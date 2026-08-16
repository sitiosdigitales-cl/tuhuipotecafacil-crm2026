import { createHash, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { crearRespaldo } from "@/lib/backup";

function cronSecretValido(request: NextRequest, secret: string): boolean {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;

  const recibido = authorization.slice("Bearer ".length);
  const esperadoHash = createHash("sha256").update(secret).digest();
  const recibidoHash = createHash("sha256").update(recibido).digest();
  return timingSafeEqual(esperadoHash, recibidoHash);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.json(
      { success: false, error: "La tarea automática no está configurada" },
      { status: 503 }
    );
  }
  if (!cronSecretValido(request, secret)) {
    return NextResponse.json(
      { success: false, error: "No autenticado" },
      { status: 401 }
    );
  }

  try {
    return NextResponse.json(await crearRespaldo());
  } catch (error) {
    console.error("Error en respaldo automático:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo crear el respaldo" },
      { status: 500 }
    );
  }
}
