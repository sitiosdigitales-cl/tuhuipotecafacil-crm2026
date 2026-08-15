import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { DELETE, GET, PUT } from "@/app/api/notificaciones/route";

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

describe("API de notificaciones sin sesión", () => {
  beforeEach(() => {
    from.mockReset();
    from.mockReturnValue(
      queryResult({
        data: [
          {
            descripcion: "Revisar antecedentes financieros del cliente",
            id: "notificacion-ajena",
            titulo: "Nuevo documento privado",
            usuarioid: "usuario-ajeno",
          },
        ],
        error: null,
      })
    );
  });

  it.each([
    [
      "lista notificaciones",
      () => GET(new NextRequest("http://localhost/api/notificaciones")),
    ],
    [
      "marca todas como leídas",
      () =>
        PUT(
          new NextRequest("http://localhost/api/notificaciones", {
            body: JSON.stringify({ marcarTodas: true }),
            headers: { "content-type": "application/json" },
            method: "PUT",
          })
        ),
    ],
    [
      "elimina una notificación",
      () =>
        DELETE(
          new NextRequest(
            "http://localhost/api/notificaciones?id=notificacion-ajena",
            { method: "DELETE" }
          )
        ),
    ],
  ])("rechaza cuando se intenta %s", async (_label, request) => {
    const response = await request();

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
