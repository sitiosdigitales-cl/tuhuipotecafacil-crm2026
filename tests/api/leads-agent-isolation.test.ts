import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, requireAuth } = vi.hoisted(() => ({
  from: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseArray: (rows: unknown[]) => rows,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

vi.mock("@/lib/dispatcher-notificaciones", () => ({
  despacharNotificacion: vi.fn().mockResolvedValue(undefined),
}));

import { GET } from "@/app/api/leads/route";

const leads = [
  { asignadoa: "agente-uno", id: "lead-propio", nombre: "Propio" },
  { asignadoa: "agente-dos", id: "lead-ajeno", nombre: "Ajeno" },
];

function leadsQuery() {
  let propietario: string | undefined;
  const query = {
    eq: vi.fn((column: string, value: string) => {
      if (column === "asignadoa") propietario = value;
      return query;
    }),
    or: vi.fn(() => query),
    order: vi.fn(() => query),
    select: vi.fn(() => query),
    then: (resolve: (value: unknown) => void) =>
      resolve({
        data: propietario
          ? leads.filter((lead) => lead.asignadoa === propietario)
          : leads,
        error: null,
      }),
  };
  return query;
}

describe("GET /api/leads", () => {
  beforeEach(() => {
    requireAuth.mockReset();
    requireAuth.mockReturnValue({
      email: "agente.uno@example.com",
      rol: "AGENTE",
      userId: "agente-uno",
    });
    from.mockReset();
  });

  it("solo entrega al agente los leads que tiene asignados", async () => {
    const query = leadsQuery();
    from.mockReturnValue(query);

    const response = await GET(new NextRequest("http://localhost/api/leads"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(query.eq).toHaveBeenCalledWith("asignadoa", "agente-uno");
    expect(body.data).toEqual([leads[0]]);
  });
});
