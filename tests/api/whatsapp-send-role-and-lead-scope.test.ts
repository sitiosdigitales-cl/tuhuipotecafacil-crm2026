import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Rol } from "@/tipos";

const {
  enviarMensajeWhatsApp,
  enviarPlantillaWhatsApp,
  from,
  isWhatsAppConfigured,
  requireAuth,
} = vi.hoisted(() => ({
  enviarMensajeWhatsApp: vi.fn(),
  enviarPlantillaWhatsApp: vi.fn(),
  from: vi.fn(),
  isWhatsAppConfigured: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
}));

vi.mock("@/lib/whatsapp", () => ({
  enviarMensajeWhatsApp,
  enviarPlantillaWhatsApp,
  isWhatsAppConfigured,
}));

import { GET, POST } from "@/app/api/whatsapp/send/route";

const lead = {
  asignadoa: "agente-dos",
  email: "cliente.real@example.invalid",
  id: "lead-uno",
  telefono: "+56 9 2222 3333",
};

function leadQuery() {
  const query = {
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({ data: lead, error: null }),
  };
  return query;
}

function setRole(rol: Rol, userId = `usuario-${rol.toLowerCase()}`) {
  requireAuth.mockReturnValue({
    email: `${userId}@example.invalid`,
    rol,
    userId,
  });
}

function request(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/whatsapp/send", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

describe("roles y alcance del envío de WhatsApp", () => {
  beforeEach(() => {
    enviarMensajeWhatsApp.mockReset();
    enviarMensajeWhatsApp.mockResolvedValue({
      messageId: "mensaje-uno",
      success: true,
    });
    enviarPlantillaWhatsApp.mockReset();
    enviarPlantillaWhatsApp.mockResolvedValue({
      messageId: "plantilla-uno",
      success: true,
    });
    from.mockReset();
    from.mockReturnValue(leadQuery());
    isWhatsAppConfigured.mockReset();
    isWhatsAppConfigured.mockReturnValue(true);
    requireAuth.mockReset();
  });

  it("CLIENTE no puede consultar configuración ni ejecutar envíos", async () => {
    setRole("CLIENTE", "cliente-uno");

    const getResponse = await GET(
      new NextRequest("http://localhost/api/whatsapp/send")
    );
    const postResponse = await POST(
      request({
        leadId: "lead-uno",
        mensaje: "Recordatorio de documentos",
      })
    );

    expect(getResponse.status).toBe(403);
    expect(postResponse.status).toBe(403);
    expect(isWhatsAppConfigured).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("AGENTE no puede enviar mensajes para un lead de otra cartera", async () => {
    setRole("AGENTE", "agente-uno");

    const response = await POST(
      request({
        leadId: "lead-uno",
        mensaje: "Recordatorio de documentos",
      })
    );

    expect(response.status).toBe(403);
    expect(enviarMensajeWhatsApp).not.toHaveBeenCalled();
  });

  it("deriva el teléfono desde el lead autorizado", async () => {
    setRole("AGENTE", "agente-dos");

    const response = await POST(
      request({
        leadId: "lead-uno",
        mensaje: "Recordatorio de documentos",
        telefono: "+56 9 9999 9999",
      })
    );

    expect(response.status).toBe(200);
    expect(enviarMensajeWhatsApp).toHaveBeenCalledWith({
      mensaje: "Recordatorio de documentos",
      telefono: "+56 9 2222 3333",
    });
  });

  it("reserva las plantillas configurables a administración", async () => {
    setRole("EJECUTIVO");

    const response = await POST(
      request({
        leadId: "lead-uno",
        nombrePlantilla: "recordatorio_documento",
        tipo: "plantilla",
      })
    );

    expect(response.status).toBe(403);
    expect(enviarPlantillaWhatsApp).not.toHaveBeenCalled();
  });

  it("no expone el identificador del número configurado", async () => {
    setRole("ADMIN");
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789012345";

    const response = await GET(
      new NextRequest("http://localhost/api/whatsapp/send")
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ configured: true });
    expect(JSON.stringify(payload)).not.toContain("12345678");
  });

  it("rechaza mensajes fuera del límite antes de llamar al proveedor", async () => {
    setRole("ADMIN");

    const response = await POST(
      request({
        leadId: "lead-uno",
        mensaje: "x".repeat(4097),
      })
    );

    expect(response.status).toBe(400);
    expect(enviarMensajeWhatsApp).not.toHaveBeenCalled();
  });
});
