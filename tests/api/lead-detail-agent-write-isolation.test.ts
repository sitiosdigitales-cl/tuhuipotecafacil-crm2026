import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, requireAuth, update } = vi.hoisted(() => ({
  from: vi.fn(),
  requireAuth: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  requireRole: vi.fn(),
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

import { PUT } from "@/app/api/leads/[id]/route";

const foreignLead = {
  asignadoa: "agente-dos",
  apellido: "Protegido",
  email: "cliente@example.invalid",
  etapa: "CONTACTADO",
  id: "lead-ajeno",
  nombre: "Cliente",
};

function leadQuery() {
  const query = {
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({ data: foreignLead, error: null }),
    update,
  };
  update.mockReturnValue(query);
  return query;
}

describe("PUT /api/leads/[id]", () => {
  beforeEach(() => {
    requireAuth.mockReset();
    requireAuth.mockReturnValue({
      email: "agente.uno@example.com",
      rol: "AGENTE",
      userId: "agente-uno",
    });
    update.mockReset();
    from.mockReset();
    from.mockReturnValue(leadQuery());
  });

  it("impide que un agente modifique el lead de otro vendedor", async () => {
    const response = await PUT(
      new NextRequest("http://localhost/api/leads/lead-ajeno", {
        body: JSON.stringify({ etapa: "APROBADO" }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      }),
      { params: Promise.resolve({ id: "lead-ajeno" }) }
    );

    expect(response.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });
});
