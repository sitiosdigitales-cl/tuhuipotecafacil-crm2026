import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Rol } from "@/tipos";

const {
  enviarEmail,
  enviarEmailBienvenida,
  enviarEmailTemplate,
  enviarSolicitudDocumentos,
  from,
  requireAuth,
} = vi.hoisted(() => ({
  enviarEmail: vi.fn(),
  enviarEmailBienvenida: vi.fn(),
  enviarEmailTemplate: vi.fn(),
  enviarSolicitudDocumentos: vi.fn(),
  from: vi.fn(),
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

vi.mock("@/lib/email", () => ({
  enviarCreditoAprobado: vi.fn(),
  enviarEmail,
  enviarEmailBienvenida,
  enviarEmailTemplate,
  enviarRecordatorio: vi.fn(),
  enviarSolicitudDocumentos,
}));

import { GET, POST } from "@/app/api/email/send/route";

const lead = {
  apellido: "Valdés",
  asignadoa: "agente-dos",
  email: "cliente.real@example.invalid",
  id: "lead-uno",
  nombre: "Camila",
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
  return new NextRequest("http://localhost/api/email/send", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

describe("roles y alcance del envío de correo", () => {
  beforeEach(() => {
    enviarEmail.mockReset();
    enviarEmail.mockResolvedValue(true);
    enviarEmailBienvenida.mockReset();
    enviarEmailBienvenida.mockResolvedValue(true);
    enviarEmailTemplate.mockReset();
    enviarEmailTemplate.mockResolvedValue(true);
    enviarSolicitudDocumentos.mockReset();
    enviarSolicitudDocumentos.mockResolvedValue(true);
    from.mockReset();
    from.mockReturnValue(leadQuery());
    requireAuth.mockReset();
  });

  it("CLIENTE no puede consultar ni ejecutar el catálogo de envíos", async () => {
    setRole("CLIENTE", "cliente-uno");

    const listResponse = await GET(
      new NextRequest("http://localhost/api/email/send")
    );
    const sendResponse = await POST(
      request({
        documentos: ["Liquidación de sueldo"],
        leadId: "lead-uno",
        tipo: "documentos",
      })
    );

    expect(listResponse.status).toBe(403);
    expect(sendResponse.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
    expect(enviarSolicitudDocumentos).not.toHaveBeenCalled();
  });

  it("AGENTE no puede enviar correos para un lead de otra cartera", async () => {
    setRole("AGENTE", "agente-uno");

    const response = await POST(
      request({
        documentos: ["Liquidación de sueldo"],
        leadId: "lead-uno",
        tipo: "documentos",
      })
    );

    expect(response.status).toBe(403);
    expect(enviarSolicitudDocumentos).not.toHaveBeenCalled();
  });

  it("deriva destinatario y nombre desde el lead autorizado", async () => {
    setRole("AGENTE", "agente-dos");

    const response = await POST(
      request({
        documentos: ["Liquidación de sueldo"],
        email: "destino.reemplazado@example.invalid",
        leadId: "lead-uno",
        nombre: "Nombre reemplazado",
        tipo: "documentos",
      })
    );

    expect(response.status).toBe(200);
    expect(enviarSolicitudDocumentos).toHaveBeenCalledWith(
      "cliente.real@example.invalid",
      "Camila Valdés",
      ["Liquidación de sueldo"],
      "lead-uno"
    );
  });

  it("exige lead y usa su destinatario en correos personalizados", async () => {
    setRole("ADMIN");

    const missingLeadResponse = await POST(
      request({
        html: "Estado actualizado",
        subject: "Proceso hipotecario",
        tipo: "custom",
        to: "destino.reemplazado@example.invalid",
      })
    );
    const validResponse = await POST(
      request({
        html: "Estado actualizado",
        leadId: "lead-uno",
        subject: "Proceso hipotecario",
        tipo: "custom",
        to: "destino.reemplazado@example.invalid",
      })
    );

    expect(missingLeadResponse.status).toBe(400);
    expect(validResponse.status).toBe(200);
    expect(enviarEmail).toHaveBeenCalledTimes(1);
    expect(enviarEmail).toHaveBeenCalledWith({
      html: "Estado actualizado",
      subject: "Proceso hipotecario",
      text: undefined,
      to: "cliente.real@example.invalid",
    });
  });

  it("reserva el correo de prueba a roles administrativos", async () => {
    setRole("EJECUTIVO");

    const response = await POST(
      request({ tipo: "test", to: "smtp@example.invalid" })
    );

    expect(response.status).toBe(403);
    expect(enviarEmail).not.toHaveBeenCalled();
  });
});
