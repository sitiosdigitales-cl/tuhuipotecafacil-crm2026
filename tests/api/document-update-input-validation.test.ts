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

vi.mock("@/lib/dispatcher-notificaciones", () => ({
  despacharNotificacion: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseColumns: (row: unknown) => row,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { PUT } from "@/app/api/documentos/[id]/route";

function tableQuery(table: string) {
  const data =
    table === "leads"
      ? { asignadoa: "agent-1", email: "lead@example.invalid" }
      : { id: "document-1", leadid: "lead-1", nombre: "Documento" };
  const query = {
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    update: updateRow,
  };
  updateRow.mockReturnValue(query);
  return query;
}

function request(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/documentos/document-1", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "PUT",
  });
}

const params = { params: Promise.resolve({ id: "document-1" }) };

describe("entrada de actualización de documentos", () => {
  beforeEach(() => {
    from.mockReset();
    from.mockImplementation((table: string) => tableQuery(table));
    requireAuth.mockReset();
    requireAuth.mockResolvedValue({ rol: "AGENTE", userId: "agent-1" });
    updateRow.mockReset();
  });

  it("rechaza campos que no pertenecen al contrato", async () => {
    const response = await PUT(
      request({ estado: "APROBADO", rutaInterna: "no-corresponde" }),
      params
    );

    expect(response.status).toBe(400);
    expect(updateRow).not.toHaveBeenCalled();
  });

  it("rechaza cuerpos que superan 8 KiB", async () => {
    const response = await PUT(
      request({ estado: "RECHAZADO", observaciones: "x".repeat(9 * 1024) }),
      params
    );

    expect(response.status).toBe(413);
    expect(updateRow).not.toHaveBeenCalled();
  });
});
