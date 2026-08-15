import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteRow, from, remove, requireAuth, storageFrom } = vi.hoisted(() => ({
  deleteRow: vi.fn(),
  from: vi.fn(),
  remove: vi.fn(),
  requireAuth: vi.fn(),
  storageFrom: vi.fn(),
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

import { DELETE as deleteDocument } from "@/app/api/documentos/[id]/route";

function tableQuery(table: string) {
  const data =
    table === "leads"
      ? { asignadoa: "agente-dos", id: "lead-ajeno" }
      : {
          archivourl:
            "https://storage.example/documentos/lead-ajeno/documento.pdf",
          id: "documento-ajeno",
          leadid: "lead-ajeno",
        };
  const query = {
    delete: deleteRow,
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: (value: unknown) => void) =>
      resolve({ data, error: null }),
  };
  deleteRow.mockReturnValue(query);
  return query;
}

describe("DELETE /api/documentos/[id]", () => {
  beforeEach(() => {
    requireAuth.mockReset();
    requireAuth.mockReturnValue({
      email: "agente.uno@example.com",
      rol: "AGENTE",
      userId: "agente-uno",
    });
    deleteRow.mockReset();
    remove.mockReset();
    remove.mockResolvedValue({ error: null });
    storageFrom.mockReset();
    storageFrom.mockReturnValue({ remove });
    from.mockReset();
    from.mockImplementation((table: string) => tableQuery(table));
  });

  it("impide borrar el documento asociado al lead de otro agente", async () => {
    const response = await deleteDocument(
      new NextRequest("http://localhost/api/documentos/documento-ajeno", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "documento-ajeno" }) }
    );

    expect(response.status).toBe(403);
    expect(remove).not.toHaveBeenCalled();
    expect(deleteRow).not.toHaveBeenCalled();
  });
});
