import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Rol } from "@/tipos";

const { from, inFilter, insert, requireAuth } = vi.hoisted(() => ({
  from: vi.fn(),
  inFilter: vi.fn(),
  insert: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseArray: (rows: unknown) => rows,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

vi.mock("@/lib/dispatcher-notificaciones", () => ({
  despacharNotificacion: vi.fn().mockResolvedValue(undefined),
}));

import { GET, POST } from "@/app/api/documentos/route";

const leadAjeno = {
  asignadoa: "agente-dos",
  email: "otra.persona@example.invalid",
  id: "lead-ajeno",
};

function thenable<T>(result: T) {
  return (resolve: (value: T) => void) => resolve(result);
}

function leadQuery() {
  const query = {
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({ data: leadAjeno, error: null }),
    then: thenable({ data: [{ id: "lead-propio" }], error: null }),
  };
  return query;
}

function documentQuery() {
  const query = {
    eq: vi.fn(() => query),
    in: inFilter,
    insert,
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({
      data: { id: "documento-nuevo", leadid: "lead-ajeno" },
      error: null,
    }),
    then: thenable({
      data: [{ id: "documento-ajeno", leadid: "lead-ajeno" }],
      error: null,
    }),
  };
  inFilter.mockReturnValue(query);
  insert.mockReturnValue(query);
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

describe("alcance de la colección de documentos", () => {
  beforeEach(() => {
    requireAuth.mockReset();
    from.mockReset();
    inFilter.mockReset();
    insert.mockReset();
    from.mockImplementation((table: string) =>
      table === "leads" ? leadQuery() : documentQuery()
    );
  });

  it.each<Rol>(["AGENTE", "CLIENTE"])(
    "responde 403 a %s al listar documentos de otro lead",
    async (role) => {
      setRole(role);

      const response = await GET(
        new NextRequest(
          "http://localhost/api/documentos?leadId=lead-ajeno"
        )
      );

      expect(response.status).toBe(403);
    }
  );

  it.each<Rol>(["AGENTE", "CLIENTE"])(
    "responde 403 a %s antes de crear un documento en otro lead",
    async (role) => {
      setRole(role);

      const response = await POST(
        new NextRequest("http://localhost/api/documentos", {
          body: JSON.stringify({
            leadId: "lead-ajeno",
            nombre: "Documento de prueba",
          }),
          headers: { "content-type": "application/json" },
          method: "POST",
        })
      );

      expect(response.status).toBe(403);
      expect(insert).not.toHaveBeenCalled();
    }
  );

  it("filtra el listado general del agente por sus leads asignados", async () => {
    setRole("AGENTE");

    const response = await GET(
      new NextRequest("http://localhost/api/documentos")
    );

    expect(response.status).toBe(200);
    expect(inFilter).toHaveBeenCalledWith("leadid", ["lead-propio"]);
  });

  it("mantiene el listado general para ADMIN", async () => {
    setRole("ADMIN");

    const response = await GET(
      new NextRequest("http://localhost/api/documentos")
    );

    expect(response.status).toBe(200);
    expect(from).not.toHaveBeenCalledWith("leads");
    expect(inFilter).not.toHaveBeenCalled();
  });
});
