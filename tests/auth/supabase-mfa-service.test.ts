import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  obtenerRequisitoMfaSupabase,
  recuperarContextoMfa,
  rolRequiereMfa,
  sesionDesdeVerificacionMfa,
} from "@/lib/supabase-mfa";

const AUTH_USER = {
  id: "10000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "admin@example.invalid",
  app_metadata: {},
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

const ACCOUNT = {
  id: "usuario-admin",
  nombre: "Cuenta",
  apellido: "Administrativa",
  email: "admin@example.invalid",
  rol: "ADMIN",
  estado: "ACTIVO",
};

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

function authClient({
  currentLevel = "aal1",
  nextLevel = "aal1",
  session = SESSION,
}: {
  currentLevel?: string;
  nextLevel?: string;
  session?: Session | null;
} = {}) {
  return {
    auth: {
      setSession: vi.fn().mockResolvedValue({
        data: { session, user: session?.user ?? null },
        error: null,
      }),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: { currentLevel, nextLevel, currentAuthenticationMethods: [] },
          error: null,
        }),
      },
    },
  } as unknown as SupabaseClient;
}

function adminClient(account = ACCOUNT) {
  return {
    from: vi.fn(() => queryResult({ data: account, error: null })),
  } as unknown as SupabaseClient;
}

function requestWithSession() {
  return new NextRequest("http://localhost/api/auth/mfa/status", {
    headers: {
      cookie: "crm_sb_access=synthetic-access-token; crm_sb_refresh=synthetic-refresh-token",
    },
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("servicio MFA de Supabase Auth", () => {
  it.each([
    ["SUPER_ADMIN", true],
    ["ADMIN", true],
    ["EJECUTIVO", false],
    ["AGENTE", false],
    ["CLIENTE", false],
  ])("define MFA administrativo para %s", (role, expected) => {
    expect(rolRequiereMfa(role)).toBe(expected);
  });

  it.each([
    ["aal2", "aal2", "satisfied"],
    ["aal1", "aal2", "challenge"],
    ["aal1", "aal1", "enroll"],
  ] as const)(
    "traduce %s/%s al requisito %s",
    async (currentLevel, nextLevel, expected) => {
      await expect(
        obtenerRequisitoMfaSupabase(
          "synthetic-access-token",
          authClient({ currentLevel, nextLevel }),
        ),
      ).resolves.toBe(expected);
    },
  );

  it("restaura la sesión y enlaza una cuenta administrativa activa", async () => {
    const client = authClient();

    const result = await recuperarContextoMfa(requestWithSession(), {
      authClient: client,
      adminClient: adminClient(),
    });

    expect(result).toMatchObject({
      status: "authenticated",
      session: SESSION,
      cuenta: ACCOUNT,
    });
    expect(client.auth.setSession).toHaveBeenCalledWith({
      access_token: "synthetic-access-token",
      refresh_token: "synthetic-refresh-token",
    });
  });

  it("rechaza una sesión incompleta o una cuenta que ya no es administrativa", async () => {
    await expect(
      recuperarContextoMfa(
        new NextRequest("http://localhost/api/auth/mfa/status"),
        { authClient: authClient(), adminClient: adminClient() },
      ),
    ).resolves.toEqual({ status: "unauthenticated" });

    await expect(
      recuperarContextoMfa(requestWithSession(), {
        authClient: authClient(),
        adminClient: adminClient({ ...ACCOUNT, rol: "EJECUTIVO" }),
      }),
    ).resolves.toEqual({ status: "invalid_account" });
  });

  it("construye la sesión renovada con expiración absoluta", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T12:00:00.000Z"));

    const session = sesionDesdeVerificacionMfa({
      access_token: "aal2-access-token",
      refresh_token: "aal2-refresh-token",
      expires_in: 3_600,
      token_type: "bearer",
      user: AUTH_USER,
    });

    expect(session.expires_at).toBe(
      Math.floor(new Date("2026-08-16T13:00:00.000Z").getTime() / 1_000),
    );
  });
});
