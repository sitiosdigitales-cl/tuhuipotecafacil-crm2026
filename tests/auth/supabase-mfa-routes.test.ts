import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  obtenerRequisitoMfaSupabase,
  recuperarContextoMfa,
  sesionDesdeVerificacionMfa,
} = vi.hoisted(() => ({
  obtenerRequisitoMfaSupabase: vi.fn(),
  recuperarContextoMfa: vi.fn(),
  sesionDesdeVerificacionMfa: vi.fn(),
}));

vi.mock("@/lib/supabase-mfa", () => ({
  obtenerRequisitoMfaSupabase,
  recuperarContextoMfa,
  sesionDesdeVerificacionMfa,
}));

import { POST as enroll } from "@/app/api/auth/mfa/enroll/route";
import { GET as status } from "@/app/api/auth/mfa/status/route";
import { POST as verify } from "@/app/api/auth/mfa/verify/route";

const originalSecret = process.env.JWT_SECRET;
const FACTOR_ID = "20000000-0000-4000-8000-000000000001";
const STALE_FACTOR_ID = "20000000-0000-4000-8000-000000000002";
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
const AAL2_SESSION = {
  ...SESSION,
  access_token: "aal2-access-token",
  refresh_token: "aal2-refresh-token",
} as Session;

function createAuthClient({
  all = [],
  totp = [],
}: {
  all?: Array<Record<string, unknown>>;
  totp?: Array<Record<string, unknown>>;
} = {}) {
  const listFactors = vi.fn().mockResolvedValue({
    data: { all, phone: [], totp, webauthn: [] },
    error: null,
  });
  const unenroll = vi.fn().mockResolvedValue({ data: { id: STALE_FACTOR_ID }, error: null });
  const enrollFactor = vi.fn().mockResolvedValue({
    data: {
      id: FACTOR_ID,
      type: "totp",
      totp: {
        qr_code: "data:image/svg+xml;utf-8,synthetic-qr",
        secret: "SYNTHETICBASE32",
        uri: "otpauth://synthetic",
      },
    },
    error: null,
  });
  const challengeAndVerify = vi.fn().mockResolvedValue({
    data: {
      access_token: "aal2-access-token",
      refresh_token: "aal2-refresh-token",
      expires_in: 3_600,
      token_type: "bearer",
      user: AUTH_USER,
    },
    error: null,
  });
  return {
    client: {
      auth: {
        mfa: {
          challengeAndVerify,
          enroll: enrollFactor,
          listFactors,
          unenroll,
        },
      },
    } as unknown as SupabaseClient,
    challengeAndVerify,
    enrollFactor,
    listFactors,
    unenroll,
  };
}

function authenticatedContext(client: SupabaseClient) {
  return {
    status: "authenticated",
    authClient: client,
    session: SESSION,
    cuenta: {
      id: "usuario-admin",
      nombre: "Cuenta",
      apellido: "Administrativa",
      email: "admin@example.invalid",
      rol: "ADMIN",
      estado: "ACTIVO",
    },
  };
}

function mfaRequest(path: string, body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      cookie: "crm_sb_access=synthetic-access-token; crm_sb_refresh=synthetic-refresh-token",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  process.env.JWT_SECRET = "supabase-mfa-routes-test-secret-32-chars";
  obtenerRequisitoMfaSupabase.mockReset();
  recuperarContextoMfa.mockReset();
  sesionDesdeVerificacionMfa.mockReset();
  obtenerRequisitoMfaSupabase.mockResolvedValue("satisfied");
  sesionDesdeVerificacionMfa.mockReturnValue(AAL2_SESSION);
});

afterAll(() => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
});

describe("rutas MFA", () => {
  it("informa challenge con el factor TOTP verificado", async () => {
    const auth = createAuthClient({
      all: [{ id: FACTOR_ID, factor_type: "totp", status: "verified" }],
      totp: [{ id: FACTOR_ID, factor_type: "totp", status: "verified" }],
    });
    recuperarContextoMfa.mockResolvedValue(authenticatedContext(auth.client));
    obtenerRequisitoMfaSupabase.mockResolvedValue("challenge");

    const response = await status(mfaRequest("/api/auth/mfa/status"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({ mode: "challenge", factorId: FACTOR_ID });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("reemplaza un factor incompleto y entrega un QR sin caché", async () => {
    const auth = createAuthClient({
      all: [{ id: STALE_FACTOR_ID, factor_type: "totp", status: "unverified" }],
    });
    recuperarContextoMfa.mockResolvedValue(authenticatedContext(auth.client));

    const response = await enroll(
      mfaRequest("/api/auth/mfa/enroll", {}),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(auth.unenroll).toHaveBeenCalledWith({ factorId: STALE_FACTOR_ID });
    expect(auth.enrollFactor).toHaveBeenCalledWith({
      factorType: "totp",
      friendlyName: "TuHipotecaFacil CRM",
      issuer: "TuHipotecaFacil.cl",
    });
    expect(body.data).toMatchObject({
      factorId: FACTOR_ID,
      secret: "SYNTHETICBASE32",
    });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("emite la sesión CRM solo después de obtener AAL2", async () => {
    const auth = createAuthClient({
      all: [{ id: FACTOR_ID, factor_type: "totp", status: "verified" }],
      totp: [{ id: FACTOR_ID, factor_type: "totp", status: "verified" }],
    });
    recuperarContextoMfa.mockResolvedValue(authenticatedContext(auth.client));

    const response = await verify(
      mfaRequest("/api/auth/mfa/verify", {
        factorId: FACTOR_ID,
        code: "123456",
      }),
    );
    const body = await response.json();
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(auth.challengeAndVerify).toHaveBeenCalledWith({
      factorId: FACTOR_ID,
      code: "123456",
    });
    expect(obtenerRequisitoMfaSupabase).toHaveBeenCalledWith(
      "aal2-access-token",
      auth.client,
    );
    expect(cookies).toContain("crm_token=");
    expect(cookies).toContain("crm_sb_access=aal2-access-token");
    expect(JSON.stringify(body)).not.toContain("aal2-access-token");
  });

  it("no verifica un factor que no pertenece a la sesión", async () => {
    const auth = createAuthClient();
    recuperarContextoMfa.mockResolvedValue(authenticatedContext(auth.client));

    const response = await verify(
      mfaRequest("/api/auth/mfa/verify", {
        factorId: FACTOR_ID,
        code: "123456",
      }),
    );

    expect(response.status).toBe(400);
    expect(auth.challengeAndVerify).not.toHaveBeenCalled();
  });

  it("elimina las cookies cuando la sesión temporal terminó", async () => {
    recuperarContextoMfa.mockResolvedValue({ status: "unauthenticated" });

    const response = await status(mfaRequest("/api/auth/mfa/status"));
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(401);
    expect(cookies).toContain("crm_sb_access=");
    expect(cookies).toContain("Max-Age=0");
  });
});
