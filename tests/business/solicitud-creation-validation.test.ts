import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, insert, requireAuth, single } = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  requireAuth: vi.fn(),
  single: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseColumns: (row: unknown) => row,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { POST } from "@/app/api/solicitudes/route";

const SOLICITUD_VALIDA = {
  leadId: "lead-uno",
  montoSolicitado: 120_000_000,
  pieDisponible: 24_000_000,
  plazoMeses: 240,
  tipoCredito: "HIPOTECARIO",
  valorPropiedad: 150_000_000,
};

function requestCon(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/solicitudes", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

describe("alta de solicitudes hipotecarias", () => {
  beforeEach(() => {
    from.mockReset();
    insert.mockReset();
    requireAuth.mockReset();
    single.mockReset();

    requireAuth.mockReturnValue({
      email: "ejecutivo@example.invalid",
      rol: "EJECUTIVO",
      userId: "ejecutivo-uno",
    });
    single.mockResolvedValue({ data: { id: "solicitud-nueva" }, error: null });

    const query = { insert, select: vi.fn(), single };
    query.select.mockReturnValue(query);
    insert.mockReturnValue(query);
    from.mockReturnValue(query);
  });

  it.each([
    ["lead vacío", { ...SOLICITUD_VALIDA, leadId: "" }],
    ["monto no positivo", { ...SOLICITUD_VALIDA, montoSolicitado: 0 }],
    ["propiedad sin valor", { ...SOLICITUD_VALIDA, valorPropiedad: 0 }],
    ["pie negativo", { ...SOLICITUD_VALIDA, pieDisponible: -1 }],
    ["plazo menor a 12 meses", { ...SOLICITUD_VALIDA, plazoMeses: 11 }],
    ["plazo mayor a 360 meses", { ...SOLICITUD_VALIDA, plazoMeses: 361 }],
  ])("rechaza %s antes de guardar", async (_caso, body) => {
    const response = await POST(requestCon(body));

    expect(response.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });
});
