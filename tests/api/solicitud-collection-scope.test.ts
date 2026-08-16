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
  fromSupabaseColumns: (row: unknown) => row,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { GET, POST } from "@/app/api/solicitudes/route";

const SOLICITUD_VALIDA = {
  leadId: "lead-ajeno",
  montoSolicitado: 120_000_000,
  pieDisponible: 24_000_000,
  plazoMeses: 240,
  tipoCredito: "HIPOTECARIO",
  valorPropiedad: 150_000_000,
};

function thenable<T>(result: T) {
  return (resolve: (value: T) => void) => resolve(result);
}

function leadQuery() {
  const query = {
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({
      data: {
        asignadoa: "agente-dos",
        email: "otra.persona@example.invalid",
        id: "lead-ajeno",
      },
      error: null,
    }),
    then: thenable({ data: [{ id: "lead-propio" }], error: null }),
  };
  return query;
}

function solicitudQuery() {
  const query = {
    eq: vi.fn(() => query),
    in: inFilter,
    insert,
    order: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({
      data: { id: "solicitud-nueva", lead_id: "lead-ajeno" },
      error: null,
    }),
    then: thenable({
      data: [{ id: "solicitud-ajena", lead_id: "lead-ajeno" }],
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

function postRequest() {
  return new NextRequest("http://localhost/api/solicitudes", {
    body: JSON.stringify(SOLICITUD_VALIDA),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

describe("alcance de la colección de solicitudes", () => {
  beforeEach(() => {
    requireAuth.mockReset();
    from.mockReset();
    inFilter.mockReset();
    insert.mockReset();
    from.mockImplementation((table: string) =>
      table === "leads" ? leadQuery() : solicitudQuery()
    );
  });

  it("responde 403 a CLIENTE antes de crear una solicitud", async () => {
    setRole("CLIENTE");

    const response = await POST(postRequest());

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });

  it("responde 403 a AGENTE al crear para otro lead", async () => {
    setRole("AGENTE");

    const response = await POST(postRequest());

    expect(response.status).toBe(403);
    expect(insert).not.toHaveBeenCalled();
  });

  it("responde 403 a AGENTE al filtrar por otro lead", async () => {
    setRole("AGENTE");

    const response = await GET(
      new NextRequest(
        "http://localhost/api/solicitudes?leadId=lead-ajeno"
      )
    );

    expect(response.status).toBe(403);
  });

  it.each<Rol>(["AGENTE", "CLIENTE"])(
    "filtra el listado general de %s por sus leads",
    async (role) => {
      setRole(role);

      const response = await GET(
        new NextRequest("http://localhost/api/solicitudes")
      );

      expect(response.status).toBe(200);
      expect(inFilter).toHaveBeenCalledWith("lead_id", ["lead-propio"]);
    }
  );

  it("mantiene el listado general para ADMIN", async () => {
    setRole("ADMIN");

    const response = await GET(
      new NextRequest("http://localhost/api/solicitudes")
    );

    expect(response.status).toBe(200);
    expect(from).not.toHaveBeenCalledWith("leads");
    expect(inFilter).not.toHaveBeenCalled();
  });
});
