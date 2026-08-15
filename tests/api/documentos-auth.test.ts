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

vi.mock("@/lib/dispatcher-notificaciones", () => ({
  despacharNotificacion: vi.fn(),
}));

import { GET } from "@/app/api/documentos/route";

describe("GET /api/documentos", () => {
  beforeEach(() => {
    const select = vi.fn().mockResolvedValue({
      data: [
        {
          archivourl: "https://storage.example/documentos/renta-cliente.pdf",
          id: "documento-ajeno",
          leadid: "lead-ajeno",
          nombre: "Liquidación de sueldo",
        },
      ],
      error: null,
    });
    from.mockReset();
    from.mockReturnValue({ select });
  });

  it("rechaza el listado sin sesión antes de leer documentos", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/documentos")
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
