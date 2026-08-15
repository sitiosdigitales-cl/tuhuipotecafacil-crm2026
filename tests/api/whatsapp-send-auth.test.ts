import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { enviarMensajeWhatsApp, enviarPlantillaWhatsApp, isWhatsAppConfigured } =
  vi.hoisted(() => ({
    enviarMensajeWhatsApp: vi.fn(),
    enviarPlantillaWhatsApp: vi.fn(),
    isWhatsAppConfigured: vi.fn(),
  }));

vi.mock("@/lib/whatsapp", () => ({
  enviarMensajeWhatsApp,
  enviarPlantillaWhatsApp,
  isWhatsAppConfigured,
}));

import { GET, POST } from "@/app/api/whatsapp/send/route";

describe("API de envío de WhatsApp sin sesión", () => {
  beforeEach(() => {
    enviarMensajeWhatsApp.mockReset();
    enviarMensajeWhatsApp.mockResolvedValue({
      messageId: "mensaje-enviado",
      success: true,
    });
    enviarPlantillaWhatsApp.mockReset();
    isWhatsAppConfigured.mockReset();
    isWhatsAppConfigured.mockReturnValue(true);
  });

  it("no envía mensajes arbitrarios", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/whatsapp/send", {
        body: JSON.stringify({
          mensaje: "Contenido controlado por un atacante",
          telefono: "+56911111111",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
    );

    expect(response.status).toBe(401);
    expect(enviarMensajeWhatsApp).not.toHaveBeenCalled();
    expect(enviarPlantillaWhatsApp).not.toHaveBeenCalled();
  });

  it("no expone la configuración del remitente", async () => {
    const response = await (
      GET as (request: NextRequest) => Promise<Response>
    )(new NextRequest("http://localhost/api/whatsapp/send"));

    expect(response.status).toBe(401);
    expect(isWhatsAppConfigured).not.toHaveBeenCalled();
  });
});
