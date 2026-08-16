import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { compare, eq, from } = vi.hoisted(() => ({
  compare: vi.fn(),
  eq: vi.fn(),
  from: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { compare },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
}));

import { POST } from "@/app/api/auth/login/route";

function queryResult(result: unknown) {
  const query = new Proxy<Record<string, unknown>>(
    {},
    {
      get: (_target, property) => {
        if (property === "then") {
          return (resolve: (value: unknown) => void) => resolve(result);
        }
        if (property === "eq") return eq;
        return vi.fn(() => query);
      },
    }
  );
  eq.mockReturnValue(query);
  return query;
}

function loginRequest(body: unknown, contentType = "application/json") {
  return new NextRequest("http://localhost/api/auth/login", {
    body: JSON.stringify(body),
    headers: { "content-type": contentType },
    method: "POST",
  });
}

describe("entrada del login", () => {
  beforeEach(() => {
    compare.mockReset();
    compare.mockResolvedValue(false);
    eq.mockReset();
    from.mockReset();
  });

  it("exige un cuerpo JSON", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/auth/login", {
        body: JSON.stringify({
          email: "persona@example.invalid",
          password: "credencial",
        }),
        method: "POST",
      })
    );

    expect(response.status).toBe(415);
    expect(from).not.toHaveBeenCalled();
  });

  it("rechaza más de 4 KiB antes de consultar cuentas", async () => {
    const response = await POST(
      loginRequest({
        email: "persona@example.invalid",
        password: "x".repeat(5 * 1024),
      })
    );

    expect(response.status).toBe(413);
    expect(from).not.toHaveBeenCalled();
  });

  it.each([
    { email: "correo-invalido", password: "credencial" },
    { email: { valor: "persona@example.invalid" }, password: "credencial" },
    { email: "persona@example.invalid", password: [] },
    { email: "persona@example.invalid", password: "" },
  ])("rechaza credenciales con forma inválida", async (body) => {
    const response = await POST(loginRequest(body));

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("normaliza el correo antes de buscar una cuenta", async () => {
    from.mockReturnValue(
      queryResult({ data: null, error: { message: "No encontrado" } })
    );

    const response = await POST(
      loginRequest({
        email: "  Persona@Example.invalid ",
        password: "credencial",
      })
    );

    expect(response.status).toBe(401);
    expect(eq).toHaveBeenCalledWith("email", "persona@example.invalid");
  });
});
