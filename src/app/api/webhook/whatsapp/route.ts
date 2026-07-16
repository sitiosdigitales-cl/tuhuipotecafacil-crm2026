import { NextRequest, NextResponse } from "next/server";
import { procesarMensajeRecibido, verificarWebhookFirma } from "@/lib/whatsapp";

// GET /api/webhook/whatsapp — Verificación del webhook (Meta lo llama para verificar)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Verificar que es una solicitud de verificación
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("Webhook de WhatsApp verificado correctamente");
    return new NextResponse(challenge, { status: 200 });
  }

  console.error("Verificación de webhook fallida:", { mode, token });
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST /api/webhook/whatsapp — Recibe mensajes de WhatsApp
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // Verificar firma (opcional en desarrollo)
    if (!verificarWebhookFirma(rawBody, signature)) {
      console.error("Firma de webhook inválida");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // Verificar que es un evento de WhatsApp
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "ok" });
    }

    // Procesar cada entrada
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === "messages") {
          const value = change.value;

          // Procesar mensajes recibidos
          const messages = value.messages || [];
          for (const message of messages) {
            await procesarMensajeRecibido({
              from: message.from,
              messageId: message.id,
              timestamp: message.timestamp,
              type: message.type,
              text: message.text,
              button: message.button,
              interactive: message.interactive,
            });
          }

          // Procesar actualizaciones de estado (entregados, leídos)
          const statuses = value.statuses || [];
          for (const status of statuses) {
            console.log(`Estado del mensaje ${status.id}: ${status.status}`);
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Error en webhook de WhatsApp:", error);
    return NextResponse.json({ status: "ok" }); // Siempre responder 200 para evitar reintentos
  }
}

// OPTIONS — CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Hub-Signature-256",
    },
  });
}
