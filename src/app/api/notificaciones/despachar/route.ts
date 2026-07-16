import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { despacharNotificacion } from "@/lib/dispatcher-notificaciones";

export async function POST(request: NextRequest) {
  if (!requireAuth(request)) return unauthorized();

  try {
    const body = await request.json();
    const { evento, leadId, titulo, descripcion, accionUrl, usuarioIdDirecto, datosEmail } = body;

    if (!evento || !titulo) {
      return NextResponse.json(
        { success: false, error: "evento y titulo requeridos" },
        { status: 400 }
      );
    }

    await despacharNotificacion({
      evento,
      leadId,
      titulo,
      descripcion: descripcion || "",
      accionUrl,
      usuarioIdDirecto,
      datosEmail,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al despachar notificación" },
      { status: 500 }
    );
  }
}
