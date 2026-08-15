import { afterEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
}));

function queryResult(result: unknown) {
  const query = new Proxy<Record<string, unknown>>(
    {},
    {
      get: (_target, property) => {
        if (property === "then") {
          return (resolve: (value: unknown) => void) => resolve(result);
        }
        return vi.fn(() => query);
      },
    }
  );
  return query;
}

describe("firma del webhook de Stripe", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rechaza una firma falsa antes de registrar el pago", async () => {
    vi.resetModules();
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "test-webhook-secret");
    from.mockReset();
    from.mockReturnValue(queryResult({ data: null, error: null }));
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    const { procesarWebhookStripe } = await import("@/lib/services/stripe");
    const body = JSON.stringify({
      data: {
        object: {
          amount_total: 100,
          currency: "clp",
          id: "sesion-falsa",
          metadata: {},
          payment_intent: "pago-falso",
        },
      },
      type: "checkout.session.completed",
    });

    const result = await procesarWebhookStripe(body, "firma-falsa");

    expect(result).toEqual({ success: false, error: "Firma inválida" });
    expect(from).not.toHaveBeenCalled();
  });
});
