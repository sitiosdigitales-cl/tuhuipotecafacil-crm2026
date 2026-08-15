import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { GET } from "@/app/api/mensajes/route";

describe("GET /api/mensajes", () => {
  beforeEach(() => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          contenido: "El cliente mantiene una deuda informada",
          conversacionid: "conversacion-ajena",
          creadoen: "2026-08-14T12:00:00.000Z",
          id: "mensaje-ajeno",
          remitenteid: "usuario-ajeno",
          remitentenombre: "Ejecutivo Dos",
        },
      ],
      error: null,
    });
    const order = vi.fn().mockReturnValue({ limit });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });
  });

  it("rechaza la consulta sin sesión antes de leer mensajes", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/mensajes?conversacionId=conversacion-ajena"
      )
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
