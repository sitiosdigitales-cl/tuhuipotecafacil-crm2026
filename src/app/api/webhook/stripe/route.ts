import { NextRequest, NextResponse } from "next/server";
import { procesarWebhookStripe, isStripeConfigured } from "@/lib/services/stripe";

// POST /api/webhook/stripe — Recibe eventos de Stripe
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe no está configurado" },
      { status: 503 }
    );
  }

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    const result = await procesarWebhookStripe(rawBody, signature);

    if (result.success) {
      return NextResponse.json({ received: true });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error en webhook de Stripe:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}

// GET — Verificar estado del webhook
export async function GET() {
  return NextResponse.json({
    status: "ok",
    configured: isStripeConfigured(),
    message: "Stripe webhook endpoint activo",
  });
}

// OPTIONS — CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
    },
  });
}
