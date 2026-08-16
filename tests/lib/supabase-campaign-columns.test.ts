import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let fromSupabaseColumns: typeof import("@/lib/supabase").fromSupabaseColumns;

beforeAll(async () => {
  ({ fromSupabaseColumns } = await import("@/lib/supabase"));
});

describe("adaptador de columnas de campañas", () => {
  it("restaura las fechas camelCase que consume la interfaz", () => {
    expect(
      fromSupabaseColumns({
        id: "campana-1",
        fechainicio: "2026-08-01T00:00:00.000Z",
        fechafin: "2026-08-31T23:59:59.000Z",
        creadoen: "2026-07-20T12:00:00.000Z",
      })
    ).toEqual({
      id: "campana-1",
      fechaInicio: "2026-08-01T00:00:00.000Z",
      fechaFin: "2026-08-31T23:59:59.000Z",
      creadoEn: "2026-07-20T12:00:00.000Z",
    });
  });
});
