import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let fromSupabaseColumns: typeof import("@/lib/supabase").fromSupabaseColumns;

beforeAll(async () => {
  ({ fromSupabaseColumns } = await import("@/lib/supabase"));
});

describe("adaptador de columnas de comisiones", () => {
  it("restaura los nombres camelCase que consume la interfaz", () => {
    expect(
      fromSupabaseColumns({
        ejecutivoid: "usuario-1",
        ejecutivonombre: "Ejecutivo Uno",
        creditosaprobados: 3,
        montototal: 150_000_000,
        tasacomision: 1.5,
        comisiontotal: 2_250_000,
        fechapago: "2026-08-15T12:00:00.000Z",
        creadoen: "2026-08-01T12:00:00.000Z",
      })
    ).toEqual({
      ejecutivoId: "usuario-1",
      ejecutivoNombre: "Ejecutivo Uno",
      creditosAprobados: 3,
      montoTotal: 150_000_000,
      tasaComision: 1.5,
      comisionTotal: 2_250_000,
      fechaPago: "2026-08-15T12:00:00.000Z",
      creadoEn: "2026-08-01T12:00:00.000Z",
    });
  });
});
