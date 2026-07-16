import { NextRequest, NextResponse } from "next/server";
import { crearSesionPago, isStripeConfigured } from "@/lib/services/stripe";

// POST /api/stripe/create-session — Crear sesión de pago
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { success: false, error: "Stripe no está configurado. Agrega STRIPE_SECRET_KEY en Vercel." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { monto, moneda, descripcion, leadId, ejecutivoId, comisionId, email } = body;

    if (!monto || !descripcion) {
      return NextResponse.json(
        { success: false, error: "monto y descripcion son requeridos" },
        { status: 400 }
      );
    }

    const result = await crearSesionPago({
      monto: Math.round(monto * 100), // Convertir a centavos
      moneda: moneda || "clp",
      descripcion,
      leadId,
      ejecutivoId,
      comisionId,
      email,
      metadata: {
        leadId: leadId || "",
        ejecutivoId: ejecutivoId || "",
        comisionId: comisionId || "",
      },
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        sessionId: result.sessionId,
        url: result.url,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error en API create-session:", error);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 }
    );
  }
}

// GET — Estado de la configuración
export async function GET() {
  const configured = isStripeConfigured();
  return NextResponse.json({
    configured,
    publishable_key: configured ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 10) + "..." : null,
  });
}
