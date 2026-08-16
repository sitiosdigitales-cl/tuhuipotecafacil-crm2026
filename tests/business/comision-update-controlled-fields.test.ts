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
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { PUT } from "@/app/api/comisiones/[id]/route";

const params = { params: Promise.resolve({ id: "comision-uno" }) };

function request(body: unknown) {
  return new NextRequest("http://localhost/api/comisiones/comision-uno", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "PUT",
  });
}

function updateQuery() {
  const eq = vi.fn().mockResolvedValue({ error: null });
  update.mockReturnValue({ eq });
  return { update };
}

describe("campos controlados al editar comisiones", () => {
  beforeEach(() => {
    from.mockReset();
    requireAuth.mockReset();
    update.mockReset();
    requireAuth.mockReturnValue({ rol: "ADMIN", userId: "admin-uno" });
  });

  it("rechaza un total calculado recibido desde la interfaz", async () => {
    const response = await PUT(
      request({ comisionTotal: 1, pagado: true }),
      params
    );

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it("permite cambiar el estado de pago sin otros campos", async () => {
    from.mockReturnValue(updateQuery());

    const response = await PUT(request({ pagado: true }), params);

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ pagado: true });
  });

  it("recalcula el total cuando cambian monto y tasa", async () => {
    from.mockReturnValue(updateQuery());

    const response = await PUT(
      request({ montoTotal: 100_000_001, tasaComision: 1.25 }),
      params
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      comisionTotal: 1_250_000,
      montoTotal: 100_000_001,
      tasaComision: 1.25,
    });
  });

  it("rechaza tipos y campos fuera del contrato", async () => {
    const response = await PUT(
      request({ montoTotal: "100000000", rol: "SUPER_ADMIN" }),
      params
    );

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });
});
