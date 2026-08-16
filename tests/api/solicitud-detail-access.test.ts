import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Rol } from "@/tipos";

const { deleteRow, from, requireAuth, updateRow } = vi.hoisted(() => ({
  deleteRow: vi.fn(),
  from: vi.fn(),
  requireAuth: vi.fn(),
  updateRow: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseColumns: (row: unknown) => row,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import {
  DELETE,
  GET,
  PUT,
} from "@/app/api/solicitudes/[id]/route";

let leadData: Record<string, unknown>;

function tableQuery(table: string) {
  const data =
    table === "leads"
      ? leadData
      : {
          id: "solicitud-ajena",
          lead_id: "lead-ajeno",
          monto_solicitado: 120_000_000,
        };

  const query = {
    delete: deleteRow,
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: (value: unknown) => void) =>
      resolve({ data, error: null }),
    update: updateRow,
  };
  deleteRow.mockReturnValue(query);
  updateRow.mockReturnValue(query);
  return query;
}

function setRole(role: Rol) {
  requireAuth.mockReturnValue({
    email:
      role === "CLIENTE"
        ? "cliente@example.invalid"
        : `${role.toLowerCase()}@example.invalid`,
    rol: role,
    userId: role === "AGENTE" ? "agente-uno" : `usuario-${role.toLowerCase()}`,
  });
}

function request(method: "GET" | "PUT" | "DELETE") {
  return new NextRequest(
    "http://localhost/api/solicitudes/solicitud-ajena",
    {
      body: method === "PUT" ? JSON.stringify({ notas: "Revisar" }) : undefined,
      headers: { "content-type": "application/json" },
      method,
    }
  );
}

const params = { params: Promise.resolve({ id: "solicitud-ajena" }) };

describe("roles y cartera del detalle de solicitudes", () => {
  beforeEach(() => {
    leadData = {
      asignadoa: "agente-dos",
      email: "otra.persona@example.invalid",
      id: "lead-ajeno",
    };
    requireAuth.mockReset();
    deleteRow.mockReset();
    updateRow.mockReset();
    from.mockReset();
    from.mockImplementation((table: string) => tableQuery(table));
  });

  it.each<Rol>(["AGENTE", "CLIENTE"])(
    "responde 403 a %s al consultar otra cartera",
    async (role) => {
      setRole(role);

      const response = await GET(request("GET"), params);

      expect(response.status).toBe(403);
    }
  );

  it("permite a CLIENTE consultar su propia solicitud", async () => {
    leadData.email = "cliente@example.invalid";
    setRole("CLIENTE");

    const response = await GET(request("GET"), params);

    expect(response.status).toBe(200);
  });

  it("responde 403 a CLIENTE antes de editar", async () => {
    setRole("CLIENTE");

    const response = await PUT(request("PUT"), params);

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });

  it("responde 403 a AGENTE antes de editar otra cartera", async () => {
    setRole("AGENTE");

    const response = await PUT(request("PUT"), params);

    expect(response.status).toBe(403);
    expect(updateRow).not.toHaveBeenCalled();
  });

  it("mantiene la edición para EJECUTIVO", async () => {
    setRole("EJECUTIVO");

    const response = await PUT(request("PUT"), params);

    expect(response.status).toBe(200);
    expect(updateRow).toHaveBeenCalled();
  });

  it.each<Rol>(["EJECUTIVO", "AGENTE", "CLIENTE"])(
    "responde 403 a %s antes de eliminar",
    async (role) => {
      setRole(role);

      const response = await DELETE(request("DELETE"), params);

      expect(response.status).toBe(403);
      expect(deleteRow).not.toHaveBeenCalled();
    }
  );

  it("mantiene la eliminación para ADMIN", async () => {
    setRole("ADMIN");

    const response = await DELETE(request("DELETE"), params);

    expect(response.status).toBe(200);
    expect(deleteRow).toHaveBeenCalled();
  });
});
