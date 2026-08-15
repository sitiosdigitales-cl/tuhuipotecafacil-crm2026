import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseArray: (rows: unknown) => rows,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { GET } from "@/app/api/triggers/route";

describe("GET /api/triggers", () => {
  beforeEach(() => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          acciones: [{ tipo: "enviar_email", configuracion: {} }],
          condiciones: [{ campo: "estado", operador: "igual", valor: "NUEVO" }],
          estado: "ACTIVO",
          id: "trigger-privado",
          nombre: "Contacto inicial",
        },
      ],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    from.mockReset();
    from.mockReturnValue({ select });
  });

  it("rechaza el listado sin sesión antes de leer triggers", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/triggers")
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
