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

import { GET } from "@/app/api/recordatorios/route";

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

describe("GET /api/recordatorios", () => {
  beforeEach(() => {
    from.mockReset();
    from.mockReturnValue(
      queryResult({
        data: [
          {
            descripcion: "Solicitar cartola bancaria pendiente",
            id: "recordatorio-ajeno",
            leadid: "lead-ajeno",
            leadnombre: "Cliente Ajeno",
            proximoenvio: "2026-08-20T12:00:00.000Z",
          },
        ],
        error: null,
      })
    );
  });

  it("rechaza el listado sin sesión antes de leer recordatorios", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/recordatorios")
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
