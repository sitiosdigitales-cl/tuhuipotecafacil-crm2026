import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, insert, requireAuth } = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseArray: (rows: unknown[]) => rows,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { POST } from "@/app/api/comisiones/route";

describe("cálculo de comisiones", () => {
  beforeEach(() => {
    requireAuth.mockReset();
    requireAuth.mockReturnValue({
      email: "admin@example.com",
      rol: "ADMIN",
      userId: "admin-uno",
    });
    insert.mockReset();
    from.mockReset();
  });

  it("calcula y redondea el total a partir del monto y la tasa", async () => {
    let insertedRow: Record<string, unknown> | undefined;
    const query = {
      insert,
      select: vi.fn(() => query),
      single: vi.fn(async () => ({ data: insertedRow, error: null })),
    };
    insert.mockImplementation((row: Record<string, unknown>) => {
      insertedRow = row;
      return query;
    });
    from.mockReturnValue(query);

    const montoTotal = 100_000_001;
    const tasaComision = 1.25;
    const comisionEsperada = Math.round(montoTotal * (tasaComision / 100));
    const response = await POST(
      new NextRequest("http://localhost/api/comisiones", {
        body: JSON.stringify({
          anio: 2026,
          comisionTotal: 1,
          creditosAprobados: 1,
          ejecutivoId: "ejecutivo-uno",
          ejecutivoNombre: "Ejecutivo Prueba",
          mes: "agosto",
          montoTotal,
          pagado: false,
          tasaComision,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ comisionTotal: comisionEsperada })
    );
    expect(body.data.comisionTotal).toBe(comisionEsperada);
  });
});
