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
        // Credito aprobado
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

      case "test":
        // Email de prueba para verificar configuracion SMTP
        if (!body.to) {
          return NextResponse.json(
            { success: false, error: "to es requerido" },
            { status: 400 }
          );
        }
        const fechaPrueba = new Date().toLocaleString("es-CL");
        resultado = await enviarEmail({
          to: body.to,
          subject: "Prueba de configuracion - TuHipotecaFacil",
          html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center;"><h1 style="color: white; margin: 0;">Email de Prueba Exitoso</h1></div><div style="padding: 30px; background: #F8FAFC;"><h2 style="color: #1E293B;">Configuracion SMTP Funcionando</h2><p style="color: #475569; line-height: 1.6;">La configuracion de email de TuHipotecaFacil esta funcionando correctamente.</p><div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #E2E8F0;"><p style="color: #64748B; margin: 0;"><strong>Fecha:</strong> ' + fechaPrueba + '</p></div><p style="color: #10B981; font-weight: bold;">Si recibes este email, todo esta configurado correctamente.</p></div><div style="background: #1E293B; padding: 20px; text-align: center;"><p style="color: #94A3B8; margin: 0; font-size: 12px;">© 2026 Tu Hipoteca Facil - Todos los derechos reservados</p></div></div>',
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Tipo de email no valido: " + tipo },
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
      { id: "credito_aprobado", nombre: "Credito Aprobado", descripcion: "Notificar aprobacion de credito" },
      { id: "recordatorio", nombre: "Recordatorio", descripcion: "Enviar recordatorio generico" },
      { id: "test", nombre: "Prueba SMTP", descripcion: "Enviar email de prueba para verificar configuracion" },
    ],
  });
}