/**
 * Servicio de integración con Stripe
 *
 * Maneja:
 * - Crear sesiones de pago
 * - Verificar pagos
 * - Webhooks de Stripe
 * - Gestión de comisiones
 */

import { supabase } from "../supabase";

// Configuración
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

// Verificar si Stripe está configurado
export function isStripeConfigured(): boolean {
  return !!(STRIPE_SECRET_KEY);
}

// ========== CREAR SESIÓN DE PAGO ==========

interface CrearSesionPagoOpts {
  monto: number; // En centavos
  moneda?: string;
  descripcion: string;
  leadId?: string;
  ejecutivoId?: string;
  comisionId?: string;
  email?: string;
  metadata?: Record<string, string>;
}

/**
 * Crea una sesión de pago en Stripe
 */
export async function crearSesionPago(opts: CrearSesionPagoOpts): Promise<{
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}> {
  if (!isStripeConfigured()) {
    return { success: false, error: "Stripe no está configurado" };
  }

  try {
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "payment_method_types[0]": "card",
        "line_items[0][price_data][currency]": opts.moneda || "clp",
        "line_items[0][price_data][product_data][name]": opts.descripcion,
        "line_items[0][price_data][unit_amount]": opts.monto.toString(),
        "line_items[0][quantity]": "1",
        "mode": "payment",
        "success_url": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/comisiones?payment=success`,
        "cancel_url": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/comisiones?payment=cancelled`,
        ...(opts.email && { "customer_email": opts.email }),
        ...(opts.metadata && Object.entries(opts.metadata).reduce((acc, [key, value]) => {
          acc[`metadata[${key}]`] = value;
          return acc;
        }, {} as Record<string, string>)),
        // Metadata adicional
        "metadata[leadId]": opts.leadId || "",
        "metadata[ejecutivoId]": opts.ejecutivoId || "",
        "metadata[comisionId]": opts.comisionId || "",
      }),
    });

    const data = await response.json();

    if (data.id) {
      return {
        success: true,
        sessionId: data.id,
        url: data.url,
      };
    }

    return { success: false, error: data.error?.message || "Error desconocido" };
  } catch (error) {
    console.error("Error creando sesión de pago:", error);
    return { success: false, error: "Error de conexión" };
  }
}

// ========== VERIFICAR PAGO ==========

/**
 * Verifica el estado de un pago
 */
export async function verificarPago(sessionId: string): Promise<{
  success: boolean;
  estado?: string;
  monto?: number;
  moneda?: string;
  error?: string;
}> {
  if (!isStripeConfigured()) {
    return { success: false, error: "Stripe no está configurado" };
  }

  try {
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      {
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (data.id) {
      return {
        success: true,
        estado: data.payment_status,
        monto: data.amount_total,
        moneda: data.currency,
      };
    }

    return { success: false, error: data.error?.message || "Sesión no encontrada" };
  } catch (error) {
    console.error("Error verificando pago:", error);
    return { success: false, error: "Error de conexión" };
  }
}

// ========== WEBHOOK - PROCESAR EVENTOS ==========

/**
 * Procesa un evento de webhook de Stripe
 */
export async function procesarWebhookStripe(
  body: string,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  // Verificar firma del webhook
  if (!verificarFirmaWebhook(body, signature)) {
    return { success: false, error: "Firma inválida" };
  }

  try {
    const evento = JSON.parse(body);

    switch (evento.type) {
      case "checkout.session.completed":
        await handlePagoCompletado(evento.data.object);
        break;

      case "checkout.session.expired":
        await handleSesionExpirada(evento.data.object);
        break;

      case "payment_intent.succeeded":
        await handlePagoAprobado(evento.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePagoFallido(evento.data.object);
        break;

      default:
        console.log(`Evento de Stripe no manejado: ${evento.type}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error procesando webhook de Stripe:", error);
    return { success: false, error: "Error procesando evento" };
  }
}

// ========== HANDLERS ==========

async function handlePagoCompletado(session: any) {
  const { leadId, ejecutivoId, comisionId } = session.metadata || {};

  // Actualizar comisión si existe
  if (comisionId) {
    await supabase
      .from("comisiones")
      .update({
        pagado: true,
        fechapago: new Date().toISOString(),
        stripeessionid: session.id,
      })
      .eq("id", comisionId);
  }

  // Crear registro de transacción
  await supabase.from("transacciones").insert({
    id: crypto.randomUUID(),
    tipo: "PAGO",
    monto: session.amount_total / 100, // Convertir de centavos
    moneda: session.currency?.toUpperCase() || "CLP",
    estadado: "COMPLETADO",
    stripeessionid: session.id,
    stripeaymentintent: session.payment_intent,
    leadid: leadId || null,
    ejecutivoid: ejecutivoId || null,
    comisionid: comisionId || null,
    descripcion: `Pago recibido - ${session.metadata?.descripcion || "Comisión"}`,
    creadoEn: new Date().toISOString(),
  });

  // Notificación
  if (ejecutivoId) {
    await supabase.from("notificaciones").insert({
      id: crypto.randomUUID(),
      tipo: "pago",
      titulo: "Pago recibido",
      descripcion: `Se recibió un pago de $${(session.amount_total / 100).toLocaleString("es-CL")}`,
      leida: false,
      leadid: leadId || null,
      creadoen: new Date().toISOString(),
    });
  }

  console.log(`Pago completado: ${session.id} - $${session.amount_total / 100}`);
}

async function handleSesionExpirada(session: any) {
  console.log(`Sesión expirada: ${session.id}`);
}

async function handlePagoAprobado(paymentIntent: any) {
  console.log(`Pago aprobado: ${paymentIntent.id}`);
}

async function handlePagoFallido(paymentIntent: any) {
  console.log(`Pago fallido: ${paymentIntent.id}`);
}

// ========== UTILIDADES ==========

function verificarFirmaWebhook(body: string, signature: string): boolean {
  if (!STRIPE_WEBHOOK_SECRET) {
    return true; // En desarrollo, permitir sin verificar
  }

  // En producción, usar crypto para verificar HMAC-SHA256
  // const crypto = require("crypto");
  // const expectedSignature = crypto
  //   .createHmac("sha256", STRIPE_WEBHOOK_SECRET)
  //   .update(body)
  //   .digest("hex");
  // return signature === `v1=${expectedSignature}`;

  return true; // Placeholder para desarrollo
}

// ========== CREAR LINK DE PAGO RÁPIDO ==========

/**
 * Crea un link de pago rápido para compartir
 */
export async function crearLinkPagoRapido(opts: {
  monto: number;
  descripcion: string;
  email?: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!isStripeConfigured()) {
    return { success: false, error: "Stripe no está configurado" };
  }

  try {
    const response = await fetch("https://api.stripe.com/v1/payment_links", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "line_items[0][price_data][currency]": "clp",
        "line_items[0][price_data][product_data][name]": opts.descripcion,
        "line_items[0][price_data][unit_amount]": opts.monto.toString(),
        "line_items[0][quantity]": "1",
        "active": "true",
      }),
    });

    const data = await response.json();

    if (data.id) {
      return {
        success: true,
        url: data.url,
      };
    }

    return { success: false, error: data.error?.message || "Error desconocido" };
  } catch (error) {
    console.error("Error creando link de pago:", error);
    return { success: false, error: "Error de conexión" };
  }
}
