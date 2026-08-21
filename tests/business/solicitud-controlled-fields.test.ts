import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Rol } from "@/tipos";

const { from, insert, requireAuth, update } = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  requireAuth: vi.fn(),
  update: vi.fn(),
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

import { POST } from "@/app/api/solicitudes/route";
import { PUT } from "@/app/api/solicitudes/[id]/route";
import { SOLICITUDES_CONFIG } from "@/modulos/solicitudes";

const SOLICITUD_VALIDA = {
  estado: "APROBADO",
  leadId: "lead-uno",
  montoSolicitado: 120_000_000,
  pieDisponible: 24_000_000,
  plazoMeses: 240,
  tipoCredito: "HIPOTECARIO",
  valorPropiedad: 150_000_000,
};

function tableQuery(table: string) {
  const data =
    table === "leads"
      ? {
          asignadoa: "agente-uno",
          email: "cliente@example.invalid",
          id: "lead-uno",
        }
      : { id: "solicitud-uno", lead_id: "lead-uno" };

  const query = {
    eq: vi.fn(() => query),
    insert,
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: (value: unknown) => void) =>
      resolve({ data, error: null }),
    update,
  };
  insert.mockReturnValue(query);
  update.mockReturnValue(query);
  return query;
}

function setRole(role: Rol) {
  requireAuth.mockReturnValue({
    email: `${role.toLowerCase()}@example.invalid`,
    rol: role,
    userId: ["AGENTE", "EJECUTIVO"].includes(role)
      ? "agente-uno"
      : `usuario-${role.toLowerCase()}`,
  });
}

function postRequest() {
  return new NextRequest("http://localhost/api/solicitudes", {
    body: JSON.stringify(SOLICITUD_VALIDA),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

function putRequest() {
  return new NextRequest("http://localhost/api/solicitudes/solicitud-uno", {
    body: JSON.stringify({
      bancoAsignado: "banco-uno",
      estado: "APROBADO",
      id: "solicitud-reemplazada",
      leadId: "lead-ajeno",
      notas: "Antecedentes revisados",
    }),
    headers: { "content-type": "application/json" },
    method: "PUT",
  });
}

const params = { params: Promise.resolve({ id: "solicitud-uno" }) };

describe("campos controlados de solicitudes", () => {
  beforeEach(() => {
    requireAuth.mockReset();
    from.mockReset();
    insert.mockReset();
    update.mockReset();
    from.mockImplementation((table: string) => tableQuery(table));
  });

  it("crea siempre la solicitud en EN_REVISION", async () => {
    setRole("EJECUTIVO");

    const response = await POST(postRequest());

    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ estado: "EN_REVISION" })
    );
  });

  it("usa EN_REVISION en el catálogo del módulo", () => {
    const ids = SOLICITUDES_CONFIG.estados.map(({ id }) => id);

    expect(ids).toContain("EN_REVISION");
    expect(ids).not.toContain("EN_REVISON");
  });

  it("EJECUTIVO solo modifica campos operativos permitidos", async () => {
    setRole("EJECUTIVO");

    const response = await PUT(putRequest(), params);
    const payload = update.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ notas: "Antecedentes revisados" });
    expect(payload).not.toHaveProperty("estado");
    expect(payload).not.toHaveProperty("banco_asignado");
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("leadid");
  });

  it("ADMIN cambia estado y banco sin poder reemplazar identificadores", async () => {
    setRole("ADMIN");

    const response = await PUT(putRequest(), params);
    const payload = update.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      banco_asignado: "banco-uno",
      estado: "APROBADO",
      notas: "Antecedentes revisados",
    });
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("leadid");
  });
});
