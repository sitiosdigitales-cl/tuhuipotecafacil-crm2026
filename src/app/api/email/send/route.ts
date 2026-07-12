import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";

import {
  enviarEmail,
  enviarEmailTemplate,
  enviarEmailBienvenida,
  enviarSolicitudDocumentos,
  enviarCreditoAprobado,
  enviarRecordatorio,
} from "@/lib/email";

// POST - Enviar email
export async function POST(request: NextRequest) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const body = await request.json();
    const { tipo } = body;

    let resultado = false;

    switch (tipo) {
      case "custom":
        // Email personalizado
        if (!body.to || !body.subject || !body.html) {
          return NextResponse.json(
            { success: false, error: "to, subject y html son requeridos" },
            { status: 400 }
          );
        }
        resultado = await enviarEmail({
          to: body.to,
          subject: body.subject,
          html: body.html,
          text: body.text,
        });
        break;

      case "template":
        // Email desde template
        if (!body.template || !body.to || !body.data) {
          return NextResponse.json(
            { success: false, error: "template, to y data son requeridos" },
            { status: 400 }
          );
        }
        resultado = await enviarEmailTemplate(body.template, body.to, body.data);
        break;

      case "bienvenida":
        // Email de bienvenida
        if (!body.email || !body.nombre) {
          return NextResponse.json(
            { success: false, error: "email y nombre son requeridos" },
            { status: 400 }
          );
        }
        resultado = await enviarEmailBienvenida(body.email, body.nombre);
        break;

      case "documentos":
        // Solicitud de documentos
        if (!body.email || !body.nombre || !body.documentos) {
          return NextResponse.json(
            { success: false, error: "email, nombre y documentos son requeridos" },
            { status: 400 }
          );
        }
        resultado = await enviarSolicitudDocumentos(
          body.email,
          body.nombre,
          body.documentos,
          body.leadId || ""
        );
        break;

      case "credito_aprobado":
        // CrÃ©dito aprobado
        if (!body.email || !body.nombre || !body.monto || !body.banco) {
          return NextResponse.json(
            { success: false, error: "email, nombre, monto y banco son requeridos" },
            { status: 400 }
          );
        }
        resultado = await enviarCreditoAprobado(
          body.email,
          body.nombre,
          body.monto,
          body.banco,
          body.plazo || "20",
          body.cuota || "0"
        );
        break;

      case "recordatorio":
        // Recordatorio
        if (!body.email || !body.nombre || !body.asunto || !body.mensaje) {
          return NextResponse.json(
            { success: false, error: "email, nombre, asunto y mensaje son requeridos" },
            { status: 400 }
          );
        }
        resultado = await enviarRecordatorio(
          body.email,
          body.nombre,
          body.asunto,
          body.mensaje,
          body.fecha
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Tipo de email no vÃ¡lido: ${tipo}` },
          { status: 400 }
        );
    }

    if (resultado) {
      return NextResponse.json({
        success: true,
        message: "Email enviado correctamente",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Error al enviar email" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error en API de email:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// GET - Listar templates disponibles
export async function GET() {
  return NextResponse.json({
    success: true,
    templates: [
      { id: "bienvenida", nombre: "Bienvenida", descripcion: "Email de bienvenida a nuevos clientes" },
      { id: "documentos", nombre: "Solicitud de Documentos", descripcion: "Solicitar documentos pendientes" },
      { id: "credito_aprobado", nombre: "CrÃ©dito Aprobado", descripcion: "Notificar aprobaciÃ³n de crÃ©dito" },
      { id: "recordatorio", nombre: "Recordatorio", descripcion: "Enviar recordatorio genÃ©rico" },
    ],
  });
}
