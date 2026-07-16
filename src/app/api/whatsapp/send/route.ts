import { NextRequest, NextResponse } from "next/server";
import {
  enviarMensajeWhatsApp,
  enviarPlantillaWhatsApp,
  isWhatsAppConfigured,
} from "@/lib/whatsapp";

// POST /api/whatsapp/send — Enviar mensaje de WhatsApp
export async function POST(request: NextRequest) {
  try {
    // Verificar configuración
    if (!isWhatsAppConfigured()) {
      return NextResponse.json(
        { success: false, error: "WhatsApp no está configurado. Agrega WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_ACCESS_TOKEN en Vercel." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { telefono, mensaje, tipo, nombrePlantilla, parametros, idioma } = body;

    // Validar teléfono
    if (!telefono) {
      return NextResponse.json(
        { success: false, error: "Teléfono requerido" },
        { status: 400 }
      );
    }

    let result;

    if (tipo === "plantilla") {
      // Enviar plantilla
      if (!nombrePlantilla) {
        return NextResponse.json(
          { success: false, error: "nombrePlantilla requerido para tipo plantilla" },
          { status: 400 }
        );
      }

      result = await enviarPlantillaWhatsApp({
        telefono,
        nombrePlantilla,
        idioma: idioma || "es",
        parametros,
      });
    } else {
      // Enviar mensaje de texto
      if (!mensaje) {
        return NextResponse.json(
          { success: false, error: "mensaje requerido" },
          { status: 400 }
        );
      }

      result = await enviarMensajeWhatsApp({
        telefono,
        mensaje,
      });
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error en API WhatsApp:", error);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 }
    );
  }
}

// GET — Estado de la configuración
export async function GET() {
  const configured = isWhatsAppConfigured();
  return NextResponse.json({
    configured,
    phone_number_id: configured ? process.env.WHATSAPP_PHONE_NUMBER_ID?.substring(0, 8) + "..." : null,
  });
}
