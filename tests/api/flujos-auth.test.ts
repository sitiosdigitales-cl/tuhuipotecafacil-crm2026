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

import { GET } from "@/app/api/flujos/route";

describe("GET /api/flujos", () => {
  beforeEach(() => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          estado: "ACTIVO",
          id: "flujo-privado",
          nombre: "Evaluación hipotecaria",
          pasos: [{ tipo: "enviar_email", configuracion: {} }],
          trigger: "lead_creado",
        },
      ],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    from.mockReset();
    from.mockReturnValue({ select });
  });

  it("rechaza el listado sin sesión antes de leer flujos", async () => {
    const response = await GET(new NextRequest("http://localhost/api/flujos"));

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
