import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { eq, from, requireAuth } = vi.hoisted(() => ({
  eq: vi.fn(),
  from: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
}));

import { GET } from "@/app/api/portal/asesor/route";

function query(data: unknown) {
  const chain = {
    eq,
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    order: vi.fn(() => chain),
    select: vi.fn(() => chain),
  };
  eq.mockReturnValue(chain);
  return chain;
}

describe("asesor del portal resuelto por sesión", () => {
  beforeEach(() => {
    eq.mockReset();
    from.mockReset();
    requireAuth.mockReset();
  });

  it("devuelve solo el asesor asignado al lead del cliente", async () => {
    requireAuth.mockReturnValue({
      email: "cliente@example.invalid",
      rol: "CLIENTE",
      userId: "cliente-uno",
    });
    from.mockImplementation((table: string) =>
      table === "leads"
        ? query({
            asignadoa: "asesor-asignado",
            nombreejecutivo: "Elena Soto",
          })
        : query({
            apellido: "Soto",
            cargo: "Ejecutiva hipotecaria",
            email: "elena@example.invalid",
            nombre: "Elena",
            telefono: "+56911111111",
          })
    );

    const response = await GET(
      new NextRequest(
        "http://localhost/api/portal/asesor?id=asesor-no-asignado"
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(eq).toHaveBeenCalledWith("email", "cliente@example.invalid");
    expect(eq).toHaveBeenCalledWith("id", "asesor-asignado");
    expect(eq).not.toHaveBeenCalledWith("id", "asesor-no-asignado");
    expect(payload.data).toMatchObject({
      email: "elena@example.invalid",
      nombre: "Elena",
    });
  });

  it("rechaza roles que no pertenecen al portal antes de consultar", async () => {
    requireAuth.mockReturnValue({
      email: "ejecutivo@example.invalid",
      rol: "EJECUTIVO",
      userId: "ejecutivo-uno",
    });

    const response = await GET(
      new NextRequest("http://localhost/api/portal/asesor")
    );

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });
});
