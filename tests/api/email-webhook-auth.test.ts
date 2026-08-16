import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { enviarEmail, from, getReceivedEmail, verify } = vi.hoisted(() => ({
  enviarEmail: vi.fn(),
  from: vi.fn(),
  getReceivedEmail: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { receiving: { get: getReceivedEmail } };
    webhooks = { verify };
  },
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from }),
}));

vi.mock("@/lib/supabase", () => ({
  toSupabaseColumns: (row: unknown) => row,
}));

vi.mock("@/lib/email", () => ({
  enviarEmail,
}));

import { POST } from "@/app/api/webhook/email/route";

const originalApiKey = process.env.RESEND_API_KEY;
const originalWebhookSecret = process.env.RESEND_WEBHOOK_SECRET;

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
    delete process.env.RESEND_WEBHOOK_SECRET;
    from.mockReset();
    from.mockReturnValue(queryResult({ data: {}, error: null }));
    enviarEmail.mockReset();
    enviarEmail.mockResolvedValue(true);
    getReceivedEmail.mockReset();
    verify.mockReset();
  });

  afterAll(() => {
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;
    if (originalWebhookSecret === undefined) delete process.env.RESEND_WEBHOOK_SECRET;
    else process.env.RESEND_WEBHOOK_SECRET = originalWebhookSecret;
  });

  it("rechaza una solicitud sin firma antes de crear el lead", async () => {
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
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_WEBHOOK_SECRET = "whsec_test_secret";
    verify.mockResolvedValue({
      data: { email_id: "email-uno" },
      type: "email.received",
    });
    getReceivedEmail.mockResolvedValue({
      data: {
        from: "Caso Prueba <cliente@example.invalid>",
        subject: "Consulta hipotecaria <img src=x>",
        text: "Necesito orientación.",
      },
      error: null,
    });

    const response = await POST(
      new NextRequest("http://localhost/api/webhook/email", {
        body: JSON.stringify({ type: "email.received" }),
        headers: {
          "svix-id": "msg_uno",
          "svix-signature": "v1,firma",
          "svix-timestamp": "1700000000",
        },
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    const options = enviarEmail.mock.calls[0]?.[0];
    expect(options.html).toContain("Consulta hipotecaria &lt;img src=x&gt;");
    expect(options.html).not.toContain("Consulta hipotecaria <img src=x>");
  });
});
