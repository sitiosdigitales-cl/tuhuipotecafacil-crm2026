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

import { GET } from "@/app/api/plantillas/route";

describe("GET /api/plantillas", () => {
  beforeEach(() => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          asunto: "Documentación hipotecaria pendiente",
          contenido: "Hola {{nombre}}, necesitamos {{documentos}}",
          id: "plantilla-privada",
          variables: ["nombre", "documentos"],
        },
      ],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    from.mockReset();
    from.mockReturnValue({ select });
  });

  it("rechaza el listado sin sesión antes de leer plantillas", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/plantillas")
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
