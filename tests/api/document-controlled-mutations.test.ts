import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  deleteRow,
  from,
  remove,
  requireAuth,
  storageFrom,
  updateRow,
} = vi.hoisted(() => ({
  deleteRow: vi.fn(),
  from: vi.fn(),
  remove: vi.fn(),
  requireAuth: vi.fn(),
  storageFrom: vi.fn(),
  updateRow: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseColumns: (row: unknown) => row,
  supabase: {
    from,
    storage: { from: storageFrom },
  },
  toSupabaseColumns: (row: unknown) => row,
}));

vi.mock("@/lib/dispatcher-notificaciones", () => ({
  despacharNotificacion: vi.fn().mockResolvedValue(undefined),
}));

import { DELETE, PUT } from "@/app/api/documentos/[id]/route";

const document = {
  archivourl: "lead-uno/documento-uno.pdf",
  estado: "PENDIENTE",
  id: "documento-uno",
  leadid: "lead-uno",
  nombre: "Liquidación de sueldo",
};
const lead = {
  asignadoa: "agente-uno",
  email: "cliente@example.invalid",
  id: "lead-uno",
};
const params = { params: Promise.resolve({ id: document.id }) };

function tableQuery(table: string) {
  const data = table === "leads" ? lead : document;
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

function setSession(rol: "AGENTE" | "CLIENTE") {
  requireAuth.mockReturnValue({
    email: rol === "CLIENTE" ? lead.email : "agente@example.invalid",
    rol,
    userId: rol === "CLIENTE" ? "cliente-uno" : lead.asignadoa,
  });
}

function putRequest(body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/documentos/${document.id}`, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "PUT",
  });
}

describe("mutaciones controladas de documentos", () => {
  beforeEach(() => {
    deleteRow.mockReset();
    from.mockReset();
    from.mockImplementation((table: string) => tableQuery(table));
    remove.mockReset();
    remove.mockResolvedValue({ error: null });
    requireAuth.mockReset();
    storageFrom.mockReset();
    storageFrom.mockReturnValue({ remove });
    updateRow.mockReset();
  });

  it("CLIENTE no puede aprobar ni eliminar sus documentos", async () => {
    setSession("CLIENTE");

    const updateResponse = await PUT(
      putRequest({ estado: "APROBADO" }),
      params
    );
    const deleteResponse = await DELETE(
      new NextRequest(`http://localhost/api/documentos/${document.id}`, {
        method: "DELETE",
      }),
      params
    );

    expect(updateResponse.status).toBe(403);
    expect(deleteResponse.status).toBe(403);
    expect(updateRow).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(deleteRow).not.toHaveBeenCalled();
  });

  it("rechaza estados fuera del catálogo", async () => {
    setSession("AGENTE");

    const response = await PUT(
      putRequest({ estado: "VALIDADO_SIN_REVISION" }),
      params
    );

    expect(response.status).toBe(400);
    expect(updateRow).not.toHaveBeenCalled();
  });

  it("deriva la aprobación desde la sesión e ignora campos ajenos", async () => {
    setSession("AGENTE");

    const response = await PUT(
      putRequest({
        aprobadoEn: "2020-01-01T00:00:00.000Z",
        aprobadoPor: "otra-persona",
        archivoUrl: "otro/archivo.pdf",
        estado: "APROBADO",
        nombre: "Documento reemplazado",
        observaciones: "Antecedentes verificados",
      }),
      params
    );

    expect(response.status).toBe(200);
    expect(updateRow).toHaveBeenCalledWith({
      aprobadoEn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      aprobadoPor: lead.asignadoa,
      estado: "APROBADO",
      observaciones: "Antecedentes verificados",
    });
  });
});
