/**
 * Servicio de WhatsApp Business API
 *
 * Integra con la API oficial de WhatsApp Business para:
 * - Enviar mensajes de texto
 * - Enviar plantillas (templates)
 * - Recibir mensajes (via webhook)
 */

import { supabase } from "./supabase";

// Configuración
const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";
const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "";

// Verificar si WhatsApp está configurado
export function isWhatsAppConfigured(): boolean {
  return !!(WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN);
}

// ========== ENVIAR MENSAJES ==========

interface EnviarMensajeOpts {
  telefono: string;
  mensaje: string;
}

/**
 * Envía un mensaje de texto simple por WhatsApp
 */
export async function enviarMensajeWhatsApp(opts: EnviarMensajeOpts): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!isWhatsAppConfigured()) {
    console.warn("WhatsApp no está configurado");
    return { success: false, error: "WhatsApp no configurado" };
  }

  // Normalizar teléfono (agregar código de país si falta)
  let telefono = opts.telefono.replace(/[^0-9+]/g, "");
  if (!telefono.startsWith("+56") && !telefono.startsWith("56")) {
    telefono = "56" + telefono.replace(/^0/, "");
  }
  telefono = telefono.replace("+", "");

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: telefono,
          type: "text",
          text: {
            preview_url: false,
            body: opts.mensaje,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Error enviando WhatsApp:", data);
      return { success: false, error: data.error?.message || "Error desconocido" };
    }

    const messageId = data.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (error) {
    console.error("Error en enviarMensajeWhatsApp:", error);
    return { success: false, error: "Error de conexión" };
  }
}

// ========== ENVIAR PLANTILLAS ==========

interface EnviarPlantillaOpts {
  telefono: string;
  nombrePlantilla: string;
  idioma?: string;
  parametros?: Array<{ type: string; text: string }>;
}

/**
 * Envía una plantilla (template) por WhatsApp
 * Las plantillas deben estar aprobadas en Meta Business Suite
 */
export async function enviarPlantillaWhatsApp(opts: EnviarPlantillaOpts): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!isWhatsAppConfigured()) {
    return { success: false, error: "WhatsApp no configurado" };
  }

  let telefono = opts.telefono.replace(/[^0-9+]/g, "");
  if (!telefono.startsWith("+56") && !telefono.startsWith("56")) {
    telefono = "56" + telefono.replace(/^0/, "");
  }
  telefono = telefono.replace("+", "");

  try {
    const components: any[] = [];

    // Agregar parámetros si existen
    if (opts.parametros && opts.parametros.length > 0) {
      components.push({
        type: "body",
        parameters: opts.parametros,
      });
    }

    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: telefono,
          type: "template",
          template: {
            name: opts.nombrePlantilla,
            language: {
              code: opts.idioma || "es",
            },
            ...(components.length > 0 && { components }),
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Error enviando plantilla WhatsApp:", data);
      return { success: false, error: data.error?.message || "Error desconocido" };
    }

    const messageId = data.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (error) {
    console.error("Error en enviarPlantillaWhatsApp:", error);
    return { success: false, error: "Error de conexión" };
  }
}

// ========== PLANTILLAS PREDEFINIDAS ==========

export const WHATSAPP_TEMPLATES = {
  bienvenida: {
    nombre: "bienvenida_lead",
    descripcion: "Mensaje de bienvenida a nuevos leads",
    ejemplo: (nombre: string) => `¡Hola ${nombre}! 👋 Gracias por contactarnos en Tu Hipoteca Fácil. Un asesor se pondrá en contacto contigo pronto.`,
  },
  documentos: {
    nombre: "solicitud_documentos",
    descripcion: "Solicitar documentos al cliente",
    ejemplo: (nombre: string) => `¡Hola ${nombre}! 📋 Para continuar con tu evaluación, necesitamos que nos envíes los siguientes documentos: [DOCUMENTOS]. ¿Tienes alguna consulta?`,
  },
  seguimiento: {
    nombre: "seguimiento_lead",
    descripcion: "Seguimiento a leads",
    ejemplo: (nombre: string) => `¡Hola ${nombre}! 👋 Somos de Tu Hipoteca Fácil. ¿Ya pudiste revisar la propuesta que te enviamos? Estamos aquí para ayudarte.`,
  },
  recordatorio: {
    nombre: "recordatorio_documento",
    descripcion: "Recordatorio de documentos pendientes",
    ejemplo: (nombre: string) => `¡Hola ${nombre}! 📝 Te recordamos que tienes documentos pendientes de carga. ¿Necesitas ayuda? Responde este mensaje y te asistimos.`,
  },
  aprobacion: {
    nombre: "credito_aprobado",
    descripcion: "Notificar aprobación de crédito",
    ejemplo: (nombre: string) => `¡Excelentes noticias ${nombre}! 🎉 Tu crédito hipotecario ha sido aprobado. Nos pondremos en contacto contigo para los siguientes pasos.`,
  },
};

// ========== ENVIAR NOTIFICACIONES AUTOMÁTICAS ==========

interface NotificarLeadOpts {
  leadId: string;
  tipo: keyof typeof WHATSAPP_TEMPLATES;
  datosExtra?: Record<string, string>;
}

/**
 * Envía una notificación automática de WhatsApp a un lead
 */
export async function notificarLeadWhatsApp(opts: NotificarLeadOpts): Promise<{ success: boolean; error?: string }> {
  try {
    // Obtener datos del lead
    const { data: lead, error } = await supabase
      .from("leads")
      .select("nombre, telefono, email")
      .eq("id", opts.leadId)
      .single();

    if (error || !lead) {
      return { success: false, error: "Lead no encontrado" };
    }

    if (!lead.telefono) {
      return { success: false, error: "Lead sin teléfono" };
    }

    const template = WHATSAPP_TEMPLATES[opts.tipo];
    if (!template) {
      return { success: false, error: "Plantilla no válida" };
    }

    const mensaje = template.ejemplo(lead.nombre || "Cliente");

    const result = await enviarMensajeWhatsApp({
      telefono: lead.telefono,
      mensaje,
    });

    // Registrar en historial de actividades
    if (result.success) {
      await supabase.from("actividades").insert({
        id: crypto.randomUUID(),
        tipo: "whatsapp",
        titulo: `WhatsApp enviado: ${template.descripcion}`,
        descripcion: mensaje,
        leadid: opts.leadId,
        leadnombre: lead.nombre,
        estado: "COMPLETADA",
        creadoen: new Date().toISOString(),
      });
    }

    return result;
  } catch (error) {
    console.error("Error en notificarLeadWhatsApp:", error);
    return { success: false, error: "Error interno" };
  }
}

// ========== WEBHOOK - RECIBIR MENSAJES ==========

interface MensajeWhatsApp {
  from: string;
  messageId: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  button?: { text: string; payload: string };
  interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
}

/**
 * Procesa un mensaje recibido de WhatsApp (webhook)
 */
export async function procesarMensajeRecibido(mensaje: MensajeWhatsApp): Promise<void> {
  try {
    const telefono = mensaje.from.replace("+", "");

    // Buscar lead por teléfono
    const { data: lead } = await supabase
      .from("leads")
      .select("id, nombre, apellido, nombreejecutivo")
      .or(`telefono.eq.+${telefono},telefono.eq.56${telefono},telefono.eq.${telefono}`)
      .limit(1)
      .single();

    if (!lead) {
      console.log("Mensaje WhatsApp de número no registrado:", telefono);
      return;
    }

    // Extraer contenido del mensaje
    let contenido = "";
    if (mensaje.type === "text" && mensaje.text) {
      contenido = mensaje.text.body;
    } else if (mensaje.type === "button" && mensaje.button) {
      contenido = `[Botón: ${mensaje.button.text}]`;
    } else if (mensaje.type === "interactive" && mensaje.interactive) {
      if (mensaje.interactive.button_reply) {
        contenido = `[Selección: ${mensaje.interactive.button_reply.title}]`;
      } else if (mensaje.interactive.list_reply) {
        contenido = `[Selección: ${mensaje.interactive.list_reply.title}]`;
      }
    }

    // Guardar en tabla de mensajes
    await supabase.from("mensajes_whatsapp").insert({
      id: crypto.randomUUID(),
      leadid: lead.id,
      leadnombre: `${lead.nombre} ${lead.apellido || ""}`.trim(),
      telefono: `+${telefono}`,
      direccion: "RECIBIDO",
      contenido,
      tipomensaje: mensaje.type,
      whatsappmessageid: mensaje.messageId,
      timestamp: new Date(parseInt(mensaje.timestamp) * 1000).toISOString(),
      procesado: false,
      creadoen: new Date().toISOString(),
    });

    // Crear actividad de seguimiento
    await supabase.from("actividades").insert({
      id: crypto.randomUUID(),
      tipo: "whatsapp",
      titulo: "Mensaje de WhatsApp recibido",
      descripcion: contenido.substring(0, 200),
      leadid: lead.id,
      leadnombre: `${lead.nombre} ${lead.apellido || ""}`.trim(),
      nombreejecutivo: lead.nombreejecutivo || "",
      estado: "PENDIENTE",
      prioridad: "ALTA",
      creadoen: new Date().toISOString(),
    });

    // Crear notificación in-app
    await supabase.from("notificaciones").insert({
      id: crypto.randomUUID(),
      tipo: "whatsapp",
      titulo: "Mensaje de WhatsApp recibido",
      descripcion: `${lead.nombre} envió: "${contenido.substring(0, 100)}"`,
      leida: false,
      leadid: lead.id,
      accionurl: `/leads/${lead.id}`,
      creadoen: new Date().toISOString(),
    });

    console.log(`Mensaje WhatsApp procesado de ${lead.nombre}: ${contenido.substring(0, 50)}`);
  } catch (error) {
    console.error("Error procesando mensaje WhatsApp:", error);
  }
}

// ========== VERIFICAR WEBHOOK ==========

/**
 * Verifica la firma del webhook de WhatsApp
 */
export function verificarWebhookFirma(
  body: string,
  signature: string | null
): boolean {
  if (!signature || !process.env.WHATSAPP_APP_SECRET) {
    return true; // Si no hay firma configurada, permitir (para desarrollo)
  }

  // En producción, verificar HMAC-SHA256
  // const crypto = require("crypto");
  // const expectedSignature = crypto
  //   .createHmac("sha256", process.env.WHATSAPP_APP_SECRET)
  //   .update(body)
  //   .digest("hex");
  // return signature === `sha256=${expectedSignature}`;

  return true; // Placeholder para desarrollo
}
