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

import { GET } from "@/app/api/biblioteca/route";

describe("GET /api/biblioteca", () => {
  beforeEach(() => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          archivourl: "https://storage.example/biblioteca/manual-interno.pdf",
          descripcion: "Procedimiento interno de evaluación",
          id: "recurso-privado",
          nombre: "Manual interno",
        },
      ],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    from.mockReset();
    from.mockReturnValue({ select });
  });

  it("rechaza el listado sin sesión antes de leer recursos", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/biblioteca")
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
