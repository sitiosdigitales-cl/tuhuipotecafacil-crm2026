import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generarToken } from "@/lib/jwt";
import {
  renovarSesionSupabaseSolicitud,
  validarSesionSolicitud,
} from "@/lib/request-session";

const TEST_SECRET = "request-session-validation-secret-32";
const AUTH_USER_ID = "10000000-0000-4000-8000-000000000001";
const originalSecret = process.env.JWT_SECRET;

const USER = {
  id: AUTH_USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: "persona@example.invalid",
  app_metadata: { crm_user_id: "usuario-uno" },
  user_metadata: {},
  created_at: "2026-08-16T00:00:00.000Z",
} as User;

const CUENTA = {
  id: "usuario-uno",
  email: "persona@example.invalid",
  rol: "EJECUTIVO",
  estado: "ACTIVO",
  auth_user_id: AUTH_USER_ID,
};

const SESSION = {
  access_token: "renewed-access",
  refresh_token: "renewed-refresh",
  expires_in: 3_600,
  expires_at: 1_800_000_000,
  token_type: "bearer",
  user: USER,
};

function request({
  accessToken,
  crm = true,
  refreshToken,
}: {
  accessToken?: string;
  crm?: boolean;
  refreshToken?: string;
} = {}) {
  const cookies: string[] = [];
  if (crm) {
    cookies.push(`crm_token=${generarToken({
      userId: "usuario-uno",
      email: "anterior@example.invalid",
      rol: "AGENTE",
    })}`);
  }
  if (accessToken) cookies.push(`crm_sb_access=${accessToken}`);
  if (refreshToken) cookies.push(`crm_sb_refresh=${refreshToken}`);
  return new NextRequest("http://localhost/api/leads", {
    headers: cookies.length > 0 ? { cookie: cookies.join("; ") } : {},
  });
}

function clients({
  account = CUENTA,
  accountError = null,
  authError = null,
  currentLevel = "aal2",
  user = USER,
}: {
  account?: unknown;
  accountError?: unknown;
  authError?: unknown;
  currentLevel?: "aal1" | "aal2";
  user?: User | null;
} = {}) {
  const single = vi.fn().mockResolvedValue({ data: account, error: accountError });
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const getUser = vi.fn().mockResolvedValue({ data: { user }, error: authError });
  const refreshSession = vi.fn().mockResolvedValue({
    data: { session: SESSION, user: USER },
    error: null,
  });
  const getAuthenticatorAssuranceLevel = vi.fn().mockResolvedValue({
    data: { currentLevel, nextLevel: "aal2" },
    error: null,
  });
  return {
    adminClient: { from } as unknown as SupabaseClient,
    authClient: {
      auth: { getUser, refreshSession, mfa: { getAuthenticatorAssuranceLevel } },
    } as unknown as SupabaseClient,
    eq,
    from,
    getAuthenticatorAssuranceLevel,
    getUser,
    refreshSession,
  };
}

describe("validación vigente de sesión por solicitud", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("mantiene el contrato JWT existente en modo legacy", async () => {
    const dependencies = clients();

    await expect(
      validarSesionSolicitud(request(), {
        mode: "legacy",
        adminClient: dependencies.adminClient,
        authClient: dependencies.authClient,
      }),
    ).resolves.toEqual(expect.objectContaining({
      userId: "usuario-uno",
      email: "anterior@example.invalid",
      rol: "AGENTE",
    }));
    expect(dependencies.from).not.toHaveBeenCalled();
    expect(dependencies.getUser).not.toHaveBeenCalled();
  });

  it("exige la cookie de Supabase en modo required", async () => {
    const dependencies = clients();

    await expect(
      validarSesionSolicitud(request(), {
        mode: "required",
        adminClient: dependencies.adminClient,
        authClient: dependencies.authClient,
      }),
    ).resolves.toBeNull();
    expect(dependencies.from).not.toHaveBeenCalled();
  });

  it("deriva rol y correo de la cuenta enlazada, no del JWT legado", async () => {
    const dependencies = clients();

    await expect(
      validarSesionSolicitud(request({ accessToken: "synthetic-access" }), {
        mode: "required",
        adminClient: dependencies.adminClient,
        authClient: dependencies.authClient,
      }),
    ).resolves.toEqual({
      userId: "usuario-uno",
      email: "persona@example.invalid",
      rol: "EJECUTIVO",
    });
    expect(dependencies.getUser).toHaveBeenCalledWith("synthetic-access");
    expect(dependencies.eq).toHaveBeenCalledWith("auth_user_id", AUTH_USER_ID);
  });

  it.each([
    { account: { ...CUENTA, estado: "INACTIVO" }, caseName: "cuenta inactiva" },
    { account: { ...CUENTA, email: "otro@example.invalid" }, caseName: "correo desalineado" },
    {
      caseName: "enlace de metadata distinto",
      user: { ...USER, app_metadata: { crm_user_id: "usuario-dos" } } as User,
    },
  ])("rechaza $caseName", async ({ account, user }) => {
    const dependencies = clients({ account, user });

    await expect(
      validarSesionSolicitud(request({ accessToken: "synthetic-access" }), {
        mode: "required",
        adminClient: dependencies.adminClient,
        authClient: dependencies.authClient,
      }),
    ).resolves.toBeNull();
  });

  it("rechaza una sesión administrativa que todavía está en AAL1", async () => {
    const dependencies = clients({
      account: { ...CUENTA, rol: "ADMIN" },
      currentLevel: "aal1",
    });

    await expect(
      validarSesionSolicitud(request({ accessToken: "synthetic-access" }), {
        mode: "required",
        adminClient: dependencies.adminClient,
        authClient: dependencies.authClient,
      }),
    ).resolves.toBeNull();
    expect(dependencies.getAuthenticatorAssuranceLevel).toHaveBeenCalledWith(
      "synthetic-access",
    );
  });

  it("permite convivencia solo a una cuenta no enlazada y no administrativa", async () => {
    const dependencies = clients({
      account: { ...CUENTA, auth_user_id: null },
    });

    await expect(
      validarSesionSolicitud(request(), {
        mode: "bridge",
        adminClient: dependencies.adminClient,
        authClient: dependencies.authClient,
      }),
    ).resolves.toEqual({
      userId: "usuario-uno",
      email: "persona@example.invalid",
      rol: "EJECUTIVO",
    });
    expect(dependencies.eq).toHaveBeenCalledWith("id", "usuario-uno");
  });

  it.each([
    { account: CUENTA, caseName: "cuenta ya enlazada" },
    { account: { ...CUENTA, auth_user_id: null, rol: "ADMIN" }, caseName: "cuenta administrativa" },
  ])("no usa el JWT de convivencia para una $caseName", async ({ account }) => {
    const dependencies = clients({ account });

    await expect(
      validarSesionSolicitud(request(), {
        mode: "bridge",
        adminClient: dependencies.adminClient,
        authClient: dependencies.authClient,
      }),
    ).resolves.toBeNull();
  });

  it("distingue una sesión inválida de una caída del proveedor", async () => {
    const invalid = clients({ authError: { status: 401 } });
    const unavailable = clients({ authError: { status: 503 } });

    await expect(
      validarSesionSolicitud(request({ accessToken: "invalid-access" }), {
        mode: "required",
        adminClient: invalid.adminClient,
        authClient: invalid.authClient,
      }),
    ).resolves.toBeNull();
    await expect(
      validarSesionSolicitud(request({ accessToken: "unavailable-access" }), {
        mode: "required",
        adminClient: unavailable.adminClient,
        authClient: unavailable.authClient,
      }),
    ).rejects.toThrow("Supabase Auth no pudo validar la sesión");
  });

  it("renueva el refresh token y vuelve a validar la cuenta enlazada", async () => {
    const dependencies = clients();

    await expect(
      renovarSesionSupabaseSolicitud(
        request({ crm: false, refreshToken: "synthetic-refresh" }),
        {
          mode: "required",
          adminClient: dependencies.adminClient,
          authClient: dependencies.authClient,
        },
      ),
    ).resolves.toEqual({
      payload: {
        userId: "usuario-uno",
        email: "persona@example.invalid",
        rol: "EJECUTIVO",
      },
      session: SESSION,
    });
    expect(dependencies.refreshSession).toHaveBeenCalledWith({
      refresh_token: "synthetic-refresh",
    });
    expect(dependencies.getUser).toHaveBeenCalledWith("renewed-access");
  });
});
