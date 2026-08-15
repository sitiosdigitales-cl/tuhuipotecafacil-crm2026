import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
  toSupabaseColumns: vi.fn(),
}));

import { GET } from "@/app/api/actividades/route";

describe("GET /api/actividades", () => {
  beforeEach(() => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          descripcion: "Cliente entregó antecedentes financieros",
          fecha: "2026-08-14T12:00:00.000Z",
          id: "actividad-ajena",
          leadid: "lead-ajeno",
          tipo: "NOTA",
          titulo: "Seguimiento privado",
          usuario: "Ejecutivo Dos",
          usuarioid: "usuario-dos",
        },
      ],
      error: null,
    });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    from.mockReturnValue({ select });
  });

  it("rechaza la consulta sin sesión antes de leer actividades", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/actividades")
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
