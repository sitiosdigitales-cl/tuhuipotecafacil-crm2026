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

import { GET } from "@/app/api/tareas/route";

describe("GET /api/tareas", () => {
  beforeEach(() => {
    const select = vi.fn().mockResolvedValue({
      data: [
        {
          asignadoa: "usuario-ajeno",
          descripcion: "Revisar informe financiero reservado",
          id: "tarea-ajena",
          leadid: "lead-ajeno",
          leadnombre: "Cliente Ajeno",
        },
      ],
      error: null,
    });
    from.mockReset();
    from.mockReturnValue({ select });
  });

  it("rechaza el listado sin sesión antes de leer tareas", async () => {
    const response = await GET(new NextRequest("http://localhost/api/tareas"));

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
