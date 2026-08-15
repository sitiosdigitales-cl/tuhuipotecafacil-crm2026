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

import { GET as getSolicitud } from "@/app/api/solicitudes/[id]/route";
import { GET as getSolicitudes } from "@/app/api/solicitudes/route";

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

describe("consultas de solicitudes sin sesión", () => {
  beforeEach(() => {
    from.mockReset();
    from.mockReturnValue(
      queryResult({
        data: [
          {
            direccion_propiedad: "Dirección privada 123",
            id: "solicitud-ajena",
            lead_id: "lead-ajeno",
            monto_solicitado: 120000000,
            notas: "Antecedentes financieros reservados",
            pie_disponible: 25000000,
          },
        ],
        error: null,
      })
    );
  });

  it.each([
    [
      "el listado",
      () =>
        getSolicitudes(new NextRequest("http://localhost/api/solicitudes")),
    ],
    [
      "el detalle",
      () =>
        getSolicitud(
          new NextRequest(
            "http://localhost/api/solicitudes/solicitud-ajena"
          ),
          { params: Promise.resolve({ id: "solicitud-ajena" }) }
        ),
    ],
  ])("rechaza %s antes de leer datos financieros", async (_label, request) => {
    const response = await request();

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
