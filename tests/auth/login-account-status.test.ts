import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

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

import { POST } from "@/app/api/auth/login/route";

const originalSecret = process.env.JWT_SECRET;

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

describe("estado de cuenta al iniciar sesión", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "login-status-test-secret-not-for-production";
    compare.mockReset();
    compare.mockResolvedValue(true);
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
    "no crea sesión para una cuenta %s",
    async (estado) => {
      from.mockReturnValue(
        queryResult({
          data: {
            apellido: "Prueba",
            email: "cuenta@example.invalid",
            estado,
            id: "usuario-inhabilitado",
            intentosfallidos: 0,
            nombre: "Cuenta",
            password: "hash-valido",
            rol: "EJECUTIVO",
            suspendidohasta: null,
          },
          error: null,
        })
      );

      const response = await POST(
        new NextRequest("http://localhost/api/auth/login", {
          body: JSON.stringify({
            email: "cuenta@example.invalid",
            password: "credencial-correcta",
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        })
      );
      const body = await response.json();

      expect(response.ok).toBe(false);
      expect(body.success).toBe(false);
      expect(response.headers.get("set-cookie")).toBeNull();
    }
  );
});
