import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { from, verify, verificarWebhookFirma } = vi.hoisted(() => ({
  from: vi.fn(),
  verify: vi.fn(),
  verificarWebhookFirma: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

vi.mock("@/lib/email", () => ({ enviarEmail: vi.fn() }));
vi.mock("@/lib/dispatcher-notificaciones", () => ({
  despacharNotificacion: vi.fn(),
}));
vi.mock("@/lib/whatsapp", () => ({
  procesarMensajeRecibido: vi.fn(),
  verificarWebhookFirma,
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { receiving: { get: vi.fn() } };
    webhooks = { verify };
  },
}));

import { POST as receiveEmail } from "@/app/api/webhook/email/route";
import { POST as receiveLead } from "@/app/api/webhook/leads/route";
import { POST as receiveWhatsApp } from "@/app/api/webhook/whatsapp/route";

function oversizedRequest(path: string, bytes: number, headers?: HeadersInit) {
  return new NextRequest(`http://localhost${path}`, {
    body: "x".repeat(bytes),
    headers,
    method: "POST",
  });
}

describe("límites de cuerpos en webhooks", () => {
  beforeEach(() => {
    from.mockReset();
    verify.mockReset();
    verificarWebhookFirma.mockReset();
  });

  afterEach(() => vi.unstubAllEnvs());

  it("rechaza un correo mayor a 256 KiB antes de tocar la base", async () => {
    // El secreto va porque ahora se comprueba ANTES de leer el cuerpo: sin él
    // la respuesta sería 401 y no se estaría midiendo el límite.
    vi.stubEnv("EMAIL_WEBHOOK_SECRET", "secreto-sintetico-de-prueba");
    const response = await receiveEmail(
      oversizedRequest("/api/webhook/email", 256 * 1024 + 1, {
        "x-webhook-secret": "secreto-sintetico-de-prueba",
      })
    );

    expect(response.status).toBe(413);
    expect(verify).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("rechaza un formulario externo mayor a 64 KiB antes de guardarlo", async () => {
    const secret = "webhook-secret-de-prueba-con-32-caracteres";
    vi.stubEnv("ELEMENTOR_WEBHOOK_SECRET", secret);

    const response = await receiveLead(
      oversizedRequest("/api/webhook/leads", 64 * 1024 + 1, {
        "content-type": "application/json",
        "x-webhook-secret": secret,
      })
    );

    expect(response.status).toBe(413);
    expect(from).not.toHaveBeenCalled();
  });

  it("rechaza un evento de WhatsApp mayor a 256 KiB antes de firmarlo", async () => {
    const response = await receiveWhatsApp(
      oversizedRequest("/api/webhook/whatsapp", 256 * 1024 + 1)
    );

    expect(response.status).toBe(413);
    expect(verificarWebhookFirma).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });
});
