import type { Session } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  autenticarIdentidadSupabase,
  compare,
  from,
  migrarIdentidadSupabase,
  obtenerModoSupabaseAuth,
  puenteSupabaseAuthVigente,
  revocarSesionSupabase,
  rpc,
} = vi.hoisted(() => ({
  autenticarIdentidadSupabase: vi.fn(),
  compare: vi.fn(),
  from: vi.fn(),
  migrarIdentidadSupabase: vi.fn(),
  obtenerModoSupabaseAuth: vi.fn(),
  puenteSupabaseAuthVigente: vi.fn(),
  revocarSesionSupabase: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("bcryptjs", () => ({ default: { compare } }));
vi.mock("@/lib/supabase", () => ({ supabase: { from, rpc } }));
vi.mock("@/lib/supabase-auth", () => ({
  autenticarIdentidadSupabase,
  migrarIdentidadSupabase,
  obtenerModoSupabaseAuth,
  puenteSupabaseAuthVigente,
  revocarSesionSupabase,
}));

import { POST } from "@/app/api/auth/login/route";

const originalSecret = process.env.JWT_SECRET;
const USER = {
  id: "usuario-bridge",
  nombre: "Cuenta",
  apellido: "Sintetica",
  email: "bridge@example.invalid",
  password: "hash-legado",
  rol: "EJECUTIVO",
  estado: "ACTIVO",
  suspendidohasta: null,
};
const SESSION = {
  access_token: "synthetic-access-token",
  refresh_token: "synthetic-refresh-token",
  expires_in: 3_600,
  expires_at: 1_800_000_000,
  token_type: "bearer",
  user: { id: "10000000-0000-4000-8000-000000000001" },
} as Session;

function queryResult(result: unknown) {
  const query = new Proxy<Record<string, unknown>>(
    {},
    {
      get: (_target, property) => {
        if (property === "then") {
          return (
            onFulfilled?: (value: unknown) => unknown,
            onRejected?: (reason: unknown) => unknown,
          ) => Promise.resolve(result).then(onFulfilled, onRejected);
        }
        return vi.fn(() => query);
      },
    },
  );
  return query;
}

function loginRequest() {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "bridge@example.invalid",
      password: "credencial-sintetica-larga",
    }),
  });
}

function mockQueries(authUserId: string | null) {
  from
    .mockReturnValueOnce(queryResult({ data: USER, error: null }))
    .mockReturnValueOnce(queryResult({ data: { auth_user_id: authUserId }, error: null }))
    .mockReturnValueOnce(queryResult({ data: null, error: null }));
}

beforeEach(() => {
  process.env.JWT_SECRET = "supabase-auth-login-mode-secret-32-chars";
  autenticarIdentidadSupabase.mockReset();
  compare.mockReset();
  from.mockReset();
  migrarIdentidadSupabase.mockReset();
  obtenerModoSupabaseAuth.mockReset();
  puenteSupabaseAuthVigente.mockReset();
  revocarSesionSupabase.mockReset();
  rpc.mockReset();
  compare.mockResolvedValue(true);
  puenteSupabaseAuthVigente.mockReturnValue(true);
});

afterEach(() => vi.restoreAllMocks());

afterAll(() => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
});

describe("modos del login Supabase Auth", () => {
  it("autentica una identidad enlazada y guarda tokens solo en cookies", async () => {
    obtenerModoSupabaseAuth.mockReturnValue("bridge");
    mockQueries("10000000-0000-4000-8000-000000000001");
    autenticarIdentidadSupabase.mockResolvedValue({
      status: "authenticated",
      authUserId: "10000000-0000-4000-8000-000000000001",
      session: SESSION,
    });

    const response = await POST(loginRequest());
    const payload = await response.json();
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(cookies).toContain("crm_sb_access=synthetic-access-token");
    expect(cookies).toContain("crm_sb_refresh=synthetic-refresh-token");
    expect(cookies).toContain("HttpOnly");
    expect(JSON.stringify(payload)).not.toContain("synthetic-access-token");
    expect(compare).not.toHaveBeenCalled();
  });

  it("migra una cuenta legacy durante la ventana bridge", async () => {
    obtenerModoSupabaseAuth.mockReturnValue("bridge");
    mockQueries(null);
    migrarIdentidadSupabase.mockResolvedValue({
      status: "authenticated",
      authUserId: "10000000-0000-4000-8000-000000000001",
      session: SESSION,
    });

    const response = await POST(loginRequest());

    expect(response.status).toBe(200);
    expect(migrarIdentidadSupabase).toHaveBeenCalledWith({
      identity: { id: USER.id, email: USER.email },
      password: "credencial-sintetica-larga",
    });
  });

  it("required no acepta una cuenta que conserva solo el hash legado", async () => {
    obtenerModoSupabaseAuth.mockReturnValue("required");
    from
      .mockReturnValueOnce(queryResult({ data: USER, error: null }))
      .mockReturnValueOnce(queryResult({ data: { auth_user_id: null }, error: null }));

    const response = await POST(loginRequest());
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.code).toBe("AUTH_MIGRATION_REQUIRED");
    expect(migrarIdentidadSupabase).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("no migra una cuenta inactiva aunque la contraseña legacy sea válida", async () => {
    obtenerModoSupabaseAuth.mockReturnValue("bridge");
    from
      .mockReturnValueOnce(queryResult({
        data: { ...USER, estado: "INACTIVO" },
        error: null,
      }))
      .mockReturnValueOnce(queryResult({ data: { auth_user_id: null }, error: null }));

    const response = await POST(loginRequest());

    expect(response.status).toBe(403);
    expect(migrarIdentidadSupabase).not.toHaveBeenCalled();
  });

  it("revoca la sesión Auth de una cuenta enlazada que quedó inactiva", async () => {
    obtenerModoSupabaseAuth.mockReturnValue("bridge");
    from
      .mockReturnValueOnce(queryResult({
        data: { ...USER, estado: "INACTIVO" },
        error: null,
      }))
      .mockReturnValueOnce(queryResult({
        data: { auth_user_id: "10000000-0000-4000-8000-000000000001" },
        error: null,
      }));
    autenticarIdentidadSupabase.mockResolvedValue({
      status: "authenticated",
      authUserId: "10000000-0000-4000-8000-000000000001",
      session: SESSION,
    });

    const response = await POST(loginRequest());

    expect(response.status).toBe(403);
    expect(revocarSesionSupabase).toHaveBeenCalledWith("synthetic-access-token");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
