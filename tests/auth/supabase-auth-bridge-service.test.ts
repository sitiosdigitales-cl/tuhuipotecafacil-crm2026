import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  autenticarIdentidadSupabase,
  migrarIdentidadSupabase,
  obtenerModoSupabaseAuth,
  puenteSupabaseAuthVigente,
  revocarSesionSupabase,
} from "@/lib/supabase-auth";

const originalMode = process.env.SUPABASE_AUTH_MODE;
const originalDeadline = process.env.SUPABASE_AUTH_BRIDGE_DEADLINE;

const AUTH_USER = {
  id: "10000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "bridge@example.invalid",
  app_metadata: { crm_user_id: "usuario-bridge" },
  user_metadata: {},
  created_at: "2026-08-16T00:00:00.000Z",
} as User;

const SESSION = {
  access_token: "synthetic-access-token",
  refresh_token: "synthetic-refresh-token",
  expires_in: 3_600,
  expires_at: 1_800_000_000,
  token_type: "bearer",
  user: AUTH_USER,
} as Session;

function authClient(
  result: unknown = {
    data: { user: AUTH_USER, session: SESSION },
    error: null,
  },
) {
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue(result),
    },
  } as unknown as SupabaseClient;
}

function adminClient({
  claimed = true,
  createResult = { data: { user: AUTH_USER }, error: null },
  listedUsers = [],
}: {
  claimed?: boolean;
  createResult?: unknown;
  listedUsers?: User[];
} = {}) {
  const rpc = vi.fn(async (functionName: string) => {
    if (functionName === "reclamar_migracion_auth") {
      return { data: claimed, error: null };
    }
    return { data: null, error: null };
  });
  const createUser = vi.fn().mockResolvedValue(createResult);
  const listUsers = vi.fn().mockResolvedValue({
    data: { users: listedUsers },
    error: null,
  });
  const deleteUser = vi.fn().mockResolvedValue({ data: null, error: null });
  return {
    client: {
      rpc,
      auth: { admin: { createUser, listUsers, deleteUser } },
    } as unknown as SupabaseClient,
    createUser,
    deleteUser,
    listUsers,
    rpc,
  };
}

afterEach(() => {
  if (originalMode === undefined) delete process.env.SUPABASE_AUTH_MODE;
  else process.env.SUPABASE_AUTH_MODE = originalMode;
  if (originalDeadline === undefined) {
    delete process.env.SUPABASE_AUTH_BRIDGE_DEADLINE;
  } else {
    process.env.SUPABASE_AUTH_BRIDGE_DEADLINE = originalDeadline;
  }
});

afterAll(() => vi.restoreAllMocks());

describe("servicio del puente Supabase Auth", () => {
  it("permanece en legacy sin configuración explícita", () => {
    delete process.env.SUPABASE_AUTH_MODE;
    expect(obtenerModoSupabaseAuth()).toBe("legacy");

    process.env.SUPABASE_AUTH_MODE = "desconocido";
    expect(() => obtenerModoSupabaseAuth()).toThrow("no es válido");
  });

  it("acepta la ventana solo antes de la fecha configurada", () => {
    process.env.SUPABASE_AUTH_BRIDGE_DEADLINE = "2026-09-15T00:00:00.000Z";
    expect(puenteSupabaseAuthVigente(new Date("2026-09-14T23:59:59.000Z"))).toBe(true);
    expect(puenteSupabaseAuthVigente(new Date("2026-09-15T00:00:00.000Z"))).toBe(false);

    process.env.SUPABASE_AUTH_BRIDGE_DEADLINE = "2026-10-16T00:00:00.000Z";
    expect(() =>
      puenteSupabaseAuthVigente(new Date("2026-09-15T00:00:00.000Z")),
    ).toThrow("30 días");
  });

  it("crea, autentica y finaliza una identidad bajo un claim", async () => {
    const admin = adminClient();
    const authentication = authClient();

    const result = await migrarIdentidadSupabase({
      identity: { id: "usuario-bridge", email: "bridge@example.invalid" },
      password: "credencial-sintetica-larga",
      adminClient: admin.client,
      authClient: authentication,
      tokenFactory: () => "20000000-0000-4000-8000-000000000001",
    });

    expect(result).toEqual({
      status: "authenticated",
      authUserId: AUTH_USER.id,
      session: SESSION,
    });
    expect(admin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "bridge@example.invalid",
        email_confirm: true,
        app_metadata: { crm_user_id: "usuario-bridge" },
      }),
    );
    expect(admin.rpc).toHaveBeenCalledWith("completar_migracion_auth", {
      p_usuario_id: "usuario-bridge",
      p_token: "20000000-0000-4000-8000-000000000001",
      p_auth_user_id: AUTH_USER.id,
    });
    expect(admin.deleteUser).not.toHaveBeenCalled();
  });

  it("no crea otra identidad cuando la fila ya está reclamada", async () => {
    const admin = adminClient({ claimed: false });

    await expect(
      migrarIdentidadSupabase({
        identity: { id: "usuario-bridge", email: "bridge@example.invalid" },
        password: "credencial-sintetica-larga",
        adminClient: admin.client,
        authClient: authClient(),
      }),
    ).resolves.toEqual({ status: "busy" });
    expect(admin.createUser).not.toHaveBeenCalled();
  });

  it("libera el claim cuando Auth exige actualizar la contraseña", async () => {
    const admin = adminClient({
      createResult: {
        data: { user: null },
        error: { code: "weak_password", message: "weak" },
      },
    });

    await expect(
      migrarIdentidadSupabase({
        identity: { id: "usuario-bridge", email: "bridge@example.invalid" },
        password: "corta",
        adminClient: admin.client,
        authClient: authClient(),
      }),
    ).resolves.toEqual({ status: "password_upgrade_required" });
    expect(admin.rpc).toHaveBeenCalledWith("liberar_migracion_auth", expect.any(Object));
  });

  it("distingue una contraseña inválida de un fallo de infraestructura", async () => {
    const invalidClient = authClient({
      data: { user: null, session: null },
      error: { code: "invalid_credentials", message: "invalid" },
    });

    await expect(
      autenticarIdentidadSupabase({
        email: "bridge@example.invalid",
        password: "incorrecta",
        expectedAuthUserId: AUTH_USER.id,
        authClient: invalidClient,
      }),
    ).resolves.toEqual({ status: "invalid" });
  });

  it("borra la identidad recién creada si no logra finalizarla", async () => {
    const admin = adminClient();
    const invalidClient = authClient({
      data: { user: null, session: null },
      error: { code: "invalid_credentials", message: "invalid" },
    });

    await expect(
      migrarIdentidadSupabase({
        identity: { id: "usuario-bridge", email: "bridge@example.invalid" },
        password: "credencial-sintetica-larga",
        adminClient: admin.client,
        authClient: invalidClient,
      }),
    ).rejects.toThrow("no aceptó");
    expect(admin.deleteUser).toHaveBeenCalledWith(AUTH_USER.id);
    expect(admin.rpc).toHaveBeenCalledWith("liberar_migracion_auth", expect.any(Object));
  });

  it("no enlaza un correo existente que pertenece a otra cuenta CRM", async () => {
    const admin = adminClient({
      createResult: {
        data: { user: null },
        error: { code: "email_exists", message: "exists" },
      },
      listedUsers: [{
        ...AUTH_USER,
        app_metadata: { crm_user_id: "otra-cuenta" },
      }],
    });

    await expect(
      migrarIdentidadSupabase({
        identity: { id: "usuario-bridge", email: "bridge@example.invalid" },
        password: "credencial-sintetica-larga",
        adminClient: admin.client,
        authClient: authClient(),
      }),
    ).resolves.toEqual({ status: "identity_conflict" });
    expect(admin.rpc).toHaveBeenCalledWith("liberar_migracion_auth", expect.any(Object));
  });

  it("revoca globalmente una sesión que no debe entregarse", async () => {
    const signOut = vi.fn().mockResolvedValue({ data: null, error: null });
    const admin = {
      auth: { admin: { signOut } },
    } as unknown as SupabaseClient;

    await revocarSesionSupabase("synthetic-access-token", admin);

    expect(signOut).toHaveBeenCalledWith("synthetic-access-token", "global");
  });
});
