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

import { GET } from "@/app/api/campanas/route";

describe("GET /api/campanas", () => {
  beforeEach(() => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          audiencia: 800,
          gastado: 1200000,
          id: "campana-privada",
          ingresos: 18000000,
          nombre: "Campaña hipotecaria",
          presupuesto: 2500000,
          segmento: "Clientes con renta alta",
        },
      ],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    from.mockReset();
    from.mockReturnValue({ select });
  });

  it("rechaza el listado sin sesión antes de leer campañas", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/campanas")
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
