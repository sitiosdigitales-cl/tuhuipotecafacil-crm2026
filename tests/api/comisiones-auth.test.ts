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

import { GET } from "@/app/api/comisiones/route";

describe("GET /api/comisiones", () => {
  beforeEach(() => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          ejecutivoid: "usuario-ajeno",
          id: "comision-ajena",
          leadid: "lead-ajeno",
          monto: 950000,
        },
      ],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    from.mockReset();
    from.mockReturnValue({ select });
  });

  it("rechaza el listado sin sesión antes de leer comisiones", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/comisiones")
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
