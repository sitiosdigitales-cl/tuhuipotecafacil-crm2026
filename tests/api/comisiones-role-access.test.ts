import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { generarToken } from "@/lib/jwt";
import type { Rol } from "@/tipos";

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseArray: (rows: unknown) => rows,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { GET, POST } from "@/app/api/comisiones/route";

const TEST_SECRET = "commission-role-test-secret";
const originalSecret = process.env.JWT_SECRET;
const ROLES_SIN_COMISIONES: Rol[] = ["EJECUTIVO", "AGENTE", "CLIENTE"];

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

function requestWithRole(method: "GET" | "POST", role: Rol) {
  const token = generarToken({
    email: `${role.toLowerCase()}@example.invalid`,
    rol: role,
    userId: `usuario-${role.toLowerCase()}`,
  });

  return new NextRequest("http://localhost/api/comisiones", {
    body:
      method === "POST"
        ? JSON.stringify({ montoTotal: 100_000_000, tasaComision: 1 })
        : undefined,
    headers: {
      cookie: `crm_token=${token}`,
      "content-type": "application/json",
    },
    method,
  });
}

describe("matriz de roles de comisiones", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    from.mockReset();
    from.mockReturnValue(queryResult({ data: [], error: null }));
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it.each(ROLES_SIN_COMISIONES)(
    "responde 403 al listar con rol %s",
    async (role) => {
      const response = await GET(requestWithRole("GET", role));

      expect(response.status).toBe(403);
      expect(from).not.toHaveBeenCalled();
    }
  );

  it.each(ROLES_SIN_COMISIONES)(
    "responde 403 al crear con rol %s",
    async (role) => {
      const response = await POST(requestWithRole("POST", role));

      expect(response.status).toBe(403);
      expect(from).not.toHaveBeenCalled();
    }
  );
});
