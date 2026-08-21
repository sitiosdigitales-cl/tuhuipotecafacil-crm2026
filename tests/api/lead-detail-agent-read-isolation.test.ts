import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, requireAuth } = vi.hoisted(() => ({
  from: vi.fn(),
  requireAuth: vi.fn(),
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

import { GET } from "@/app/api/leads/[id]/route";

const foreignLead = {
  asignadoa: "agente-dos",
  apellido: "Protegido",
  id: "lead-ajeno",
  nombre: "Cliente",
  rut: "11.111.111-1",
};

function detailQuery() {
  let ownerFilter: string | undefined;
  const query = {
    eq: vi.fn((column: string, value: string) => {
      if (column === "asignadoa") ownerFilter = value;
      return query;
    }),
    select: vi.fn(() => query),
    single: vi.fn(async () =>
      ownerFilter && ownerFilter !== foreignLead.asignadoa
        ? { data: null, error: { code: "PGRST116" } }
        : { data: foreignLead, error: null }
    ),
  };
  return query;
}

describe("GET /api/leads/[id]", () => {
  beforeEach(() => {
    requireAuth.mockReset();
    requireAuth.mockReturnValue({
      email: "agente.uno@example.com",
      rol: "AGENTE",
      userId: "agente-uno",
    });
    from.mockReset();
    from.mockReturnValue(detailQuery());
  });

  it.each(["AGENTE", "EJECUTIVO"])(
  "no entrega a %s la ficha asignada a otro vendedor",
  async (rol) => {
    requireAuth.mockReturnValue({
      email: "agente.uno@example.com",
      rol,
      userId: "agente-uno",
    });
    const response = await GET(
      new NextRequest("http://localhost/api/leads/lead-ajeno"),
      { params: Promise.resolve({ id: "lead-ajeno" }) }
    );
    expect([403, 404]).toContain(response.status);
    const responseText = await response.text();
    if (responseText) {
      expect(JSON.parse(responseText).data).toBeUndefined();
    }
  });
});
