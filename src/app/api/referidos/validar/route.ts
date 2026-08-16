import { NextRequest, NextResponse } from "next/server";
import {
  ReferralCodeConfigurationError,
  resolveReferralCode,
} from "@/lib/referral-code";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codigo = searchParams.get("codigo");

  if (!codigo) {
    return NextResponse.json({ valido: false, error: "Codigo requerido" });
  }

  try {
    const propietario = await resolveReferralCode(codigo);
    return NextResponse.json({ valido: Boolean(propietario) });
  } catch (error) {
    if (error instanceof ReferralCodeConfigurationError) {
      return NextResponse.json(
        { valido: false, error: "El programa de referidos no está configurado" },
        { status: 503 }
      );
    }
    console.error("Error al validar código de referido:", error);
    return NextResponse.json(
      { valido: false, error: "No se pudo validar el código" },
      { status: 500 }
    );
  }
}
