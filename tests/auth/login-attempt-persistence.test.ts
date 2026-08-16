import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { compare, from, rpc, update } = vi.hoisted(() => ({
  compare: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  update: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { compare },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from, rpc },
}));

import { POST } from "@/app/api/auth/login/route";

const USER = {
  apellido: "Prueba",
  email: "persona@example.invalid",
  estado: "ACTIVO",
  id: "usuario-uno",
  intentosfallidos: 4,
  nombre: "Persona",
  password: "hash-vigente",
  rol: "EJECUTIVO",
  suspendidohasta: null,
};

function loginRequest() {
  return new NextRequest("http://localhost/api/auth/login", {
    body: JSON.stringify({
      email: USER.email,
      password: "credencial-presentada",
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

function lookupQuery() {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: USER, error: null }),
      })),
    })),
  };
}

function updateQuery(error: { message: string } | null) {
  const eq = vi.fn().mockResolvedValue({ data: null, error });
  update.mockReturnValue({ eq });
  return { update };
}

describe("persistencia de intentos del login", () => {
  beforeEach(() => {
    compare.mockReset();
    from.mockReset();
    rpc.mockReset();
    update.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("no aparenta registrar un intento cuando la base lo rechaza", async () => {
    compare.mockResolvedValue(false);
    from.mockReturnValueOnce(lookupQuery());
    rpc.mockResolvedValue({ data: null, error: { message: "función no disponible" } });

    const response = await POST(loginRequest());

    expect(response.status).toBe(500);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("no crea sesión si no puede limpiar un contador anterior", async () => {
    compare.mockResolvedValue(true);
    from
      .mockReturnValueOnce(lookupQuery())
      .mockReturnValueOnce(updateQuery({ message: "escritura rechazada" }));

    const response = await POST(loginRequest());

    expect(response.status).toBe(500);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("delega el intento a la operación atómica", async () => {
    compare.mockResolvedValue(false);
    from.mockReturnValueOnce(lookupQuery());
    rpc.mockResolvedValue({
      data: [{ intentosfallidos: 5, suspendidohasta: new Date().toISOString() }],
      error: null,
    });

    const response = await POST(loginRequest());

    expect(response.status).toBe(401);
    expect(rpc).toHaveBeenCalledWith("registrar_intento_login_fallido", {
      p_usuario_id: USER.id,
    });
  });
});
