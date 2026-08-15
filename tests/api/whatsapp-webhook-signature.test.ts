import { afterEach, describe, expect, it, vi } from "vitest";

import { verificarWebhookFirma } from "@/lib/whatsapp";

describe("firma del webhook de WhatsApp", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rechaza una firma falsa cuando existe app secret", () => {
    vi.stubEnv("WHATSAPP_APP_SECRET", "test-whatsapp-app-secret");

    const accepted = verificarWebhookFirma(
      JSON.stringify({ object: "whatsapp_business_account" }),
      "sha256=firma-falsa"
    );

    expect(accepted).toBe(false);
  });
});
