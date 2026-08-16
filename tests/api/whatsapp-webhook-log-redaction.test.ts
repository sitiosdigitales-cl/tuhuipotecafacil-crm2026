import { createHmac } from "node:crypto";

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
}));

import { GET, POST } from "@/app/api/webhook/whatsapp/route";
import { procesarMensajeRecibido } from "@/lib/whatsapp";

function capturedLogs() {
  return [console.error, console.info, console.log, console.warn]
    .flatMap((logger) => vi.mocked(logger).mock.calls.flat())
    .map(String)
    .join(" ");
}

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

describe("logs del webhook de WhatsApp", () => {
  beforeEach(() => {
    from.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("no registra el token cuando la verificación se rechaza", async () => {
    const receivedToken = "token-recibido-que-no-debe-aparecer";
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "token-configurado-distinto");

    const response = await GET(
      new NextRequest(
        `http://localhost/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=${receivedToken}`
      )
    );

    expect(response.status).toBe(403);
    expect(capturedLogs()).not.toContain(receivedToken);
  });

  it("no registra el teléfono de un mensaje sin lead", async () => {
    const phone = "56911112222";
    from.mockReturnValue(queryResult({ data: null, error: null }));

    await procesarMensajeRecibido({
      from: phone,
      messageId: "mensaje-uno",
      timestamp: "1700000000",
      type: "text",
      text: { body: "consulta privada" },
    });

    expect(capturedLogs()).not.toContain(phone);
  });

  it("no registra identificadores de estados recibidos", async () => {
    const appSecret = "whatsapp-app-secret-de-prueba";
    const messageId = "wamid-identificador-privado";
    const body = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{ changes: [{ field: "messages", value: { statuses: [{ id: messageId, status: "read" }] } }] }],
    });
    vi.stubEnv("WHATSAPP_APP_SECRET", appSecret);
    const signature = `sha256=${createHmac("sha256", appSecret).update(body).digest("hex")}`;

    const response = await POST(
      new NextRequest("http://localhost/api/webhook/whatsapp", {
        body,
        headers: { "x-hub-signature-256": signature },
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    expect(capturedLogs()).not.toContain(messageId);
  });
});
