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

import { GET } from "@/app/api/eventos/route";

function queryResult(result: unknown) {
  const query = new Proxy<Record<string, unknown>>(
    {},
    {
      get: (_target, property) => {
        if (property === "then") {
          return (resolve: (value: unknown) => void) => resolve(result);
        }
        return vi.fn(() => query);
      },
    }
  );
  return query;
}

describe("GET /api/eventos", () => {
  beforeEach(() => {
    from.mockReset();
    from.mockReturnValue(
      queryResult({
        data: [
          {
            descripcion: "Reunión por antecedentes financieros",
            fecha: "2026-08-20",
            id: "evento-ajeno",
            leadid: "lead-ajeno",
            leadnombre: "Cliente Ajeno",
            ubicacion: "Domicilio del cliente",
          },
        ],
        error: null,
      })
    );
  });

  it("rechaza el listado sin sesión antes de leer la agenda", async () => {
    const response = await GET(new NextRequest("http://localhost/api/eventos"));

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
