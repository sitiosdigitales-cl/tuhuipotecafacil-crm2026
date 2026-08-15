import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseColumns: (row: unknown) => row,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { GET as getConversacion } from "@/app/api/conversaciones/[id]/route";
import { GET as getConversaciones } from "@/app/api/conversaciones/route";

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

describe("consultas de conversaciones", () => {
  beforeEach(() => {
    from.mockReturnValue(
      queryResult({
        data: [
          {
            creadopor: "usuario-uno",
            descripcion: "Caso hipotecario reservado",
            id: "conversacion-ajena",
            nombre: "Cliente reservado",
            participantes: ["usuario-uno", "usuario-dos"],
          },
        ],
        error: null,
      })
    );
  });

  it.each([
    [
      "el listado",
      () => getConversaciones(new NextRequest("http://localhost/api/conversaciones")),
    ],
    [
      "el detalle",
      () =>
        getConversacion(
          new NextRequest("http://localhost/api/conversaciones/conversacion-ajena"),
          { params: Promise.resolve({ id: "conversacion-ajena" }) }
        ),
    ],
  ])("rechaza %s sin sesión", async (_label, request) => {
    const response = await request();

    expect(response.status).toBe(401);
  });
});
