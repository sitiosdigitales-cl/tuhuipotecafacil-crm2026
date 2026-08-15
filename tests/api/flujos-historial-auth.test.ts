import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
}));

import { GET, POST } from "@/app/api/flujos/[id]/historial/route";

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

const context = { params: Promise.resolve({ id: "flujo-ajeno" }) };

describe("historial de flujos sin sesión", () => {
  beforeEach(() => {
    from.mockReset();
    from.mockReturnValue(
      queryResult({ data: [], error: null, count: 0 })
    );
  });

  it.each([
    [
      "consulta ejecuciones",
      () =>
        GET(
          new NextRequest(
            "http://localhost/api/flujos/flujo-ajeno/historial"
          ),
          context
        ),
    ],
    [
      "registra una ejecución falsa",
      () =>
        POST(
          new NextRequest(
            "http://localhost/api/flujos/flujo-ajeno/historial",
            {
              body: JSON.stringify({
                estado: "EXITOSO",
                leadEmail: "cliente@ejemplo.cl",
                leadId: "lead-ajeno",
                leadNombre: "Cliente Ajeno",
              }),
              headers: { "content-type": "application/json" },
              method: "POST",
            }
          ),
          context
        ),
    ],
  ])("rechaza cuando se intenta %s", async (_label, request) => {
    const response = await request();

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
