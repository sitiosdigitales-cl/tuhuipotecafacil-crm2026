import type { Session } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  from,
  obtenerModoSupabaseAuth,
  renovarSesionSupabaseSolicitud,
  requireAuth,
} = vi.hoisted(() => ({
  from: vi.fn(),
  obtenerModoSupabaseAuth: vi.fn(),
  renovarSesionSupabaseSolicitud: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({ requireAuth }));
vi.mock("@/lib/request-session", () => ({ renovarSesionSupabaseSolicitud }));
vi.mock("@/lib/supabase", () => ({ supabase: { from } }));
vi.mock("@/lib/supabase-auth", () => ({ obtenerModoSupabaseAuth }));

import { GET } from "@/app/api/auth/me/route";

const PAYLOAD = {
  userId: "usuario-uno",
  email: "persona@example.invalid",
  rol: "EJECUTIVO",
};
const originalSecret = process.env.JWT_SECRET;
const SESSION = {
  access_token: "renewed-access",
  refresh_token: "renewed-refresh",
  expires_in: 3_600,
  expires_at: Math.floor(Date.now() / 1_000) + 3_600,
  token_type: "bearer",
  user: { id: "10000000-0000-4000-8000-000000000001" },
} as Session;

function request(cookies: string) {
  return new NextRequest("http://localhost/api/auth/me", {
    headers: { cookie: cookies },
  });
}

function mockAccount() {
  const single = vi.fn().mockResolvedValue({
    data: {
      id: PAYLOAD.userId,
      nombre: "Persona",
      apellido: "Ejemplo",
      email: PAYLOAD.email,
      rol: PAYLOAD.rol,
      estado: "ACTIVO",
    },
    error: null,
  });
  from.mockReturnValue({
    select: vi.fn(() => ({ eq: vi.fn(() => ({ single })) })),
  });
}

describe("renovación de la sesión actual con Supabase", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "current-supabase-session-test-secret";
    from.mockReset();
    obtenerModoSupabaseAuth.mockReset();
    renovarSesionSupabaseSolicitud.mockReset();
    requireAuth.mockReset();
    obtenerModoSupabaseAuth.mockReturnValue("required");
    renovarSesionSupabaseSolicitud.mockResolvedValue({
      payload: PAYLOAD,
      session: SESSION,
    });
    mockAccount();
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("rota los tokens y conserva la cookie CRM solo después de validar la cuenta", async () => {
    const response = await GET(
      request("crm_sb_access=old-access; crm_sb_refresh=old-refresh"),
    );
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(renovarSesionSupabaseSolicitud).toHaveBeenCalledOnce();
    expect(requireAuth).not.toHaveBeenCalled();
    expect(cookies).toContain("crm_token=");
    expect(cookies).toContain("crm_sb_access=renewed-access");
    expect(cookies).toContain("crm_sb_refresh=renewed-refresh");
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
  });

  it("elimina todo si falta una mitad de la sesión Supabase", async () => {
    const response = await GET(request("crm_sb_access=old-access"));
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(401);
    expect(renovarSesionSupabaseSolicitud).not.toHaveBeenCalled();
    expect(cookies).toContain("crm_rec_access=;");
    expect(cookies.match(/Max-Age=0/g)).toHaveLength(5);
  });

  it("elimina todo si el refresh token ya no está vigente", async () => {
    renovarSesionSupabaseSolicitud.mockResolvedValue(null);

    const response = await GET(
      request("crm_sb_access=old-access; crm_sb_refresh=old-refresh"),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(from).not.toHaveBeenCalled();
  });

  it("recupera la sesión cuando el access token venció pero queda refresh", async () => {
    const response = await GET(request("crm_sb_refresh=old-refresh"));

    expect(response.status).toBe(200);
    expect(renovarSesionSupabaseSolicitud).toHaveBeenCalledOnce();
    expect(response.headers.get("set-cookie")).toContain(
      "crm_sb_access=renewed-access",
    );
  });
});
