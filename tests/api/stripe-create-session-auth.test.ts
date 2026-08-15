import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { crearSesionPago, isStripeConfigured } = vi.hoisted(() => ({
  crearSesionPago: vi.fn(),
  isStripeConfigured: vi.fn(),
}));

vi.mock("@/lib/services/stripe", () => ({
  crearSesionPago,
  isStripeConfigured,
}));

import { POST } from "@/app/api/stripe/create-session/route";

describe("POST /api/stripe/create-session", () => {
  beforeEach(() => {
    crearSesionPago.mockReset();
    crearSesionPago.mockResolvedValue({
      sessionId: "sesion-creada",
      success: true,
      url: "https://checkout.stripe.test/sesion-creada",
    });
    isStripeConfigured.mockReset();
    isStripeConfigured.mockReturnValue(true);
  });

  it("rechaza una sesión de pago anónima antes de llamar a Stripe", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/stripe/create-session", {
        body: JSON.stringify({
          comisionId: "comision-ajena",
          descripcion: "Pago manipulado",
          monto: 1,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
    );

    expect(response.status).toBe(401);
    expect(isStripeConfigured).not.toHaveBeenCalled();
    expect(crearSesionPago).not.toHaveBeenCalled();
  });
});
