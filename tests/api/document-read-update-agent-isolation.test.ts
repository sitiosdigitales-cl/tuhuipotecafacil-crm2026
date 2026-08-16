import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, requireAuth, updateRow } = vi.hoisted(() => ({
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

vi.mock("@/lib/dispatcher-notificaciones", () => ({
  despacharNotificacion: vi.fn().mockResolvedValue(undefined),
}));

import {
  GET as getDocument,
  PUT as updateDocument,
} from "@/app/api/documentos/[id]/route";

function tableQuery(table: string) {
  const data =
    table === "leads"
      ? {
          asignadoa: "agente-dos",
          email: "cliente@example.com",
          id: "lead-ajeno",
        }
      : {
          estado: "PENDIENTE",
          id: "documento-ajeno",
          leadid: "lead-ajeno",
          nombre: "Liquidación de sueldo",
        };

  const query = {
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    update: updateRow,
  };
  updateRow.mockReturnValue(query);
  return query;
}

describe("documentos asociados a otra cartera", () => {
  beforeEach(() => {
    requireAuth.mockReset();
    requireAuth.mockReturnValue({
      email: "agente.uno@example.com",
      rol: "AGENTE",
      userId: "agente-uno",
    });
    updateRow.mockReset();
    from.mockReset();
    from.mockImplementation((table: string) => tableQuery(table));
  });

  it("responde 403 al consultar el documento de un lead asignado a otro agente", async () => {
    const response = await getDocument(
      new NextRequest("http://localhost/api/documentos/documento-ajeno"),
      { params: Promise.resolve({ id: "documento-ajeno" }) }
    );

    expect(response.status).toBe(403);
  });

  it("responde 403 antes de modificar el documento de otro agente", async () => {
    const response = await updateDocument(
      new NextRequest("http://localhost/api/documentos/documento-ajeno", {
        body: JSON.stringify({ estado: "APROBADO" }),
        headers: { "content-type": "application/json" },
        method: "PUT",
      }),
      { params: Promise.resolve({ id: "documento-ajeno" }) }
    );

    expect(response.status).toBe(403);
    expect(updateRow).not.toHaveBeenCalled();
  });
});
