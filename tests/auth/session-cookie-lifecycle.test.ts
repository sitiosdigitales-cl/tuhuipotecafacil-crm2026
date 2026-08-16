import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generarToken } from "@/lib/jwt";

const { compare, from } = vi.hoisted(() => ({
  compare: vi.fn(),
  from: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { compare },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
}));

import { POST as login } from "@/app/api/auth/login/route";
import { GET as currentSession } from "@/app/api/auth/me/route";

const originalSecret = process.env.JWT_SECRET;

const USER = {
  apellido: "Soto",
  email: "elena@example.invalid",
  estado: "ACTIVO",
  id: "usuario-uno",
  intentosfallidos: 0,
  nombre: "Elena",
  password: "hash-valido",
  rol: "EJECUTIVO",
  suspendidohasta: null,
};

function queryResult(result: unknown) {
  const query = new Proxy<Record<string, unknown>>(
    {},
    {
      get: (_target, property) => {
        if (property === "then") {
          return (
            onFulfilled?: (value: unknown) => unknown,
            onRejected?: (reason: unknown) => unknown
          ) => Promise.resolve(result).then(onFulfilled, onRejected);
        }
        return vi.fn(() => query);
      },
    }
  );
  return query;
}

function mockUser() {
  from.mockReturnValue(queryResult({ data: USER, error: null }));
}

describe("ciclo de vida de la cookie de sesión", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "session-cookie-lifecycle-test-secret-32-chars";
    compare.mockReset();
    compare.mockResolvedValue(true);
    from.mockReset();
    mockUser();
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it("entrega el token solo en una cookie httpOnly de treinta minutos", async () => {
    const response = await login(
      new NextRequest("http://localhost/api/auth/login", {
        body: JSON.stringify({
          email: "elena@example.invalid",
          password: "credencial-correcta",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
    );
    const payload = await response.json();
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(payload.data).not.toHaveProperty("token");
    expect(setCookie).toContain("crm_token=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Max-Age=1800");
    expect(setCookie).toContain("SameSite=lax");
    expect(setCookie).not.toContain("auth_token=");
  });

  it("renueva la cookie después de validar la cuenta vigente", async () => {
    const token = generarToken({
      email: USER.email,
      rol: USER.rol,
      userId: USER.id,
    });

    const response = await currentSession(
      new NextRequest("http://localhost/api/auth/me", {
        headers: { cookie: `crm_token=${token}` },
      })
    );
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(setCookie).toContain("crm_token=");
    expect(setCookie).toContain("Max-Age=1800");
  });

  it("migra una cookie antigua a la cookie única vigente", async () => {
    const token = generarToken({
      email: USER.email,
      rol: USER.rol,
      userId: USER.id,
    });

    const response = await currentSession(
      new NextRequest("http://localhost/api/auth/me", {
        headers: { cookie: `auth_token=${token}` },
      })
    );
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(setCookie).toContain("crm_token=");
    expect(setCookie).toContain("auth_token=");
    expect(setCookie).toContain("Max-Age=0");
  });

  it("firma tokens con una vigencia máxima de treinta minutos", () => {
    const token = generarToken({
      email: USER.email,
      rol: USER.rol,
      userId: USER.id,
    });
    const decoded = jwt.decode(token) as jwt.JwtPayload;

    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();
    expect((decoded.exp ?? 0) - (decoded.iat ?? 0)).toBe(30 * 60);
  });
});
