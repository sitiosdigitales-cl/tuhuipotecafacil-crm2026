import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { generarToken } from "@/lib/jwt";
import type { Rol } from "@/tipos";

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
}));

import { GET } from "@/app/api/auth/me/route";

const TEST_SECRET = "current-session-state-test-secret";
const originalSecret = process.env.JWT_SECRET;

function queryResult(result: unknown) {
  const query = new Proxy<Record<string, unknown>>(
    {},
    {
      get: (_target, property) => {
        if (property === "then") {
          return (resolve: (value: unknown) => void) => resolve(result);
        }
        return vi.fn(() => query);
      },
    }
  );
  return query;
}

function requestWithRole(role: Rol) {
  const token = generarToken({
    email: "persona@example.invalid",
    rol: role,
    userId: "usuario-uno",
  });

  return new NextRequest("http://localhost/api/auth/me", {
    headers: { cookie: `crm_token=${token}; auth_token=${token}` },
  });
}

function mockUser(estado: string, rol: Rol = "EJECUTIVO") {
  from.mockReturnValue(
    queryResult({
      data: {
        apellido: "Prueba",
        email: "persona@example.invalid",
        estado,
        id: "usuario-uno",
        nombre: "Persona",
        rol,
      },
      error: null,
    })
  );
}

function expectSessionCookiesCleared(response: Response) {
  const setCookie = response.headers.get("set-cookie") ?? "";
  expect(setCookie).toContain("crm_token=");
  expect(setCookie).toContain("auth_token=");
  expect(setCookie).toContain("Max-Age=0");
}

describe("vigencia de la sesión actual", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    from.mockReset();
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it.each(["INACTIVO", "SUSPENDIDO"])(
    "invalida la sesión cuando la cuenta está %s",
    async (estado) => {
      mockUser(estado);

      const response = await GET(requestWithRole("EJECUTIVO"));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expectSessionCookiesCleared(response);
    }
  );

  it("invalida la sesión cuando el rol almacenado cambió", async () => {
    mockUser("ACTIVO", "ADMIN");

    const response = await GET(requestWithRole("EJECUTIVO"));

    expect(response.status).toBe(401);
    expectSessionCookiesCleared(response);
  });

  it("mantiene la sesión de una cuenta activa con el rol vigente", async () => {
    mockUser("ACTIVO", "EJECUTIVO");

    const response = await GET(requestWithRole("EJECUTIVO"));

    expect(response.status).toBe(200);
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("crm_token=");
    expect(setCookie).toContain("Max-Age=1800");
  });
});
