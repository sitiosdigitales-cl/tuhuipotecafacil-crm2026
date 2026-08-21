import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let fromSupabaseColumns: typeof import("@/lib/supabase").fromSupabaseColumns;

beforeAll(async () => {
  ({ fromSupabaseColumns } = await import("@/lib/supabase"));
});

describe("adaptador de columnas de bancos", () => {
  it("entrega los nombres que consume la interfaz", () => {
    expect(
      fromSupabaseColumns({
        cae: 5.1,
        tasa_base: 4.4,
        tasa_preferencial: 4.1,
        financiamiento_maximo: 90,
        tasas_por_tipo: {},
        updated_at: "2026-08-21T12:00:00.000Z",
      })
    ).toEqual({
      actualizadoEn: "2026-08-21T12:00:00.000Z",
      cae: 5.1,
      financiamientoMaximo: 90,
      tasaBase: 4.4,
      tasaPreferencial: 4.1,
      tasasPorTipo: {},
    });
  });
});
