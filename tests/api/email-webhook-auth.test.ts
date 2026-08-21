import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { enviarEmail, from, getReceivedEmail, rpc, verify } = vi.hoisted(() => ({
  enviarEmail: vi.fn(),
  from: vi.fn(),
  getReceivedEmail: vi.fn(),
  rpc: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { receiving: { get: getReceivedEmail } };
    webhooks = { verify };
  },
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from, rpc }),
}));

vi.mock("@/lib/supabase", () => ({
  toSupabaseColumns: (row: unknown) => row,
}));

vi.mock("@/lib/email", () => ({
  enviarEmail,
}));

import { POST } from "@/app/api/webhook/email/route";

const originalApiKey = process.env.RESEND_API_KEY;
const originalWebhookSecret = process.env.EMAIL_WEBHOOK_SECRET;

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

describe("POST /api/webhook/email", () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_WEBHOOK_SECRET;
    from.mockReset();
    from.mockReturnValue(queryResult({ data: {}, error: null }));
    rpc.mockReset();
    rpc.mockResolvedValue({ data: true, error: null });
    enviarEmail.mockReset();
    enviarEmail.mockResolvedValue(true);
    getReceivedEmail.mockReset();
    verify.mockReset();
  });

  afterAll(() => {
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;
    if (originalWebhookSecret === undefined) delete process.env.EMAIL_WEBHOOK_SECRET;
    else process.env.EMAIL_WEBHOOK_SECRET = originalWebhookSecret;
  });

  it("rechaza una solicitud sin secreto antes de crear el lead", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/webhook/email", {
        body: JSON.stringify({
          from: "Remitente <remitente@example.com>",
          subject: "Consulta sin firma",
          text: "Teléfono: +56 9 1111 1111",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
    );

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
    expect(enviarEmail).not.toHaveBeenCalled();
  });

  it("trata el asunto recibido como texto dentro de la confirmación", async () => {
    // El piping de cPanel manda el correo ya desarmado en el cuerpo y se
    // autentica con X-Webhook-Secret: no hay firma Svix ni segunda consulta.
    process.env.EMAIL_WEBHOOK_SECRET = "secreto-sintetico-de-prueba";

    const response = await POST(
      new NextRequest("http://localhost/api/webhook/email", {
        body: JSON.stringify({
          from: "Caso Prueba <cliente@example.invalid>",
          to: "ventas@example.invalid",
          subject: "Consulta hipotecaria <img src=x>",
          text: "Necesito orientación.",
          date: "Mon, 17 Aug 2026 12:00:00 -0400",
          messageId: "<correo-html@example.invalid>",
        }),
        headers: {
          "content-type": "application/json",
          "x-webhook-secret": "secreto-sintetico-de-prueba",
        },
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    const options = enviarEmail.mock.calls[0]?.[0];
    expect(options.html).toContain("Consulta hipotecaria &lt;img src=x&gt;");
    expect(options.html).not.toContain("Consulta hipotecaria <img src=x>");
    expect(rpc).toHaveBeenCalledWith(
      "reclamar_correo_entrante",
      expect.objectContaining({
        p_mensaje_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      })
    );
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("correo-html@example.invalid");
  });

  it("acepta una repetición sin crear otro lead", async () => {
    process.env.EMAIL_WEBHOOK_SECRET = "secreto-sintetico-de-prueba";
    rpc.mockResolvedValueOnce({ data: false, error: null });

    const response = await POST(
      new NextRequest("http://localhost/api/webhook/email", {
        body: JSON.stringify({
          from: "Caso Prueba <cliente@example.invalid>",
          to: "ventas@example.invalid",
          subject: "Consulta",
          text: "Necesito orientación.",
          date: "",
          messageId: "<correo-repetido@example.invalid>",
        }),
        headers: {
          "content-type": "application/json",
          "x-webhook-secret": "secreto-sintetico-de-prueba",
        },
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      message: "Correo procesado",
    });
    expect(from).not.toHaveBeenCalled();
    expect(enviarEmail).not.toHaveBeenCalled();
  });

  it("rechaza campos fuera del payload fijo", async () => {
    process.env.EMAIL_WEBHOOK_SECRET = "secreto-sintetico-de-prueba";

    const response = await POST(
      new NextRequest("http://localhost/api/webhook/email", {
        body: JSON.stringify({
          from: "Caso Prueba <cliente@example.invalid>",
          to: "ventas@example.invalid",
          subject: "Consulta",
          text: "Necesito orientación.",
          date: "",
          messageId: "",
          headers: { "x-extra": "no debe entrar" },
        }),
        headers: {
          "content-type": "application/json",
          "x-webhook-secret": "secreto-sintetico-de-prueba",
        },
        method: "POST",
      })
    );

    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });
});
