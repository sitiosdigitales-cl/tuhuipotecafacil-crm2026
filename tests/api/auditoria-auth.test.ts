import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseArray: (rows: unknown[]) => rows,
  supabase: { from },
  toSupabaseColumns: vi.fn(),
}));

import { GET } from "@/app/api/auditoria/route";

describe("GET /api/auditoria", () => {
  beforeEach(() => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          accion: "ACTUALIZAR_LEAD",
          modulo: "leads",
          usuarioid: "usuario-ajeno",
          valornuevo: { rentaMensual: 2500000 },
        },
      ],
      error: null,
    });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    from.mockReturnValue({ select });
  });

  it("rechaza la consulta sin sesión antes de leer la auditoría", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/auditoria")
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
