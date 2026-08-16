import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { compare, from, update } = vi.hoisted(() => ({
  compare: vi.fn(),
  from: vi.fn(),
  update: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { compare },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
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
    update.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("no aparenta registrar un intento cuando la base lo rechaza", async () => {
    compare.mockResolvedValue(false);
    from
      .mockReturnValueOnce(lookupQuery())
      .mockReturnValueOnce(updateQuery({ message: "columna no disponible" }));

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

  it("guarda el quinto intento junto con el bloqueo temporal", async () => {
    compare.mockResolvedValue(false);
    from
      .mockReturnValueOnce(lookupQuery())
      .mockReturnValueOnce(updateQuery(null));

    const response = await POST(loginRequest());

    expect(response.status).toBe(401);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        intentosfallidos: 5,
        suspendidohasta: expect.any(String),
      })
    );
  });
});
