import { NextRequest, NextResponse } from "next/server";

import { requireAuth, forbidden, unauthorized } from "@/lib/api-auth";
import {
  createReferralCode,
  ReferralCodeConfigurationError,
} from "@/lib/referral-code";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const ROLES_CON_REFERIDOS = new Set(["SUPER_ADMIN", "ADMIN", "EJECUTIVO"]);

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!ROLES_CON_REFERIDOS.has(auth.rol)) return forbidden();

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("usuarios")
      .select("id")
      .eq("id", auth.userId)
      .eq("estado", "ACTIVO")
      .limit(1);

    if (error) throw error;
    if (!data?.[0]) return forbidden();

    return NextResponse.json({
      success: true,
      data: { codigo: createReferralCode(auth.userId) },
    });
  } catch (error) {
    if (error instanceof ReferralCodeConfigurationError) {
      return NextResponse.json(
        { success: false, error: "El programa de referidos no está configurado" },
        { status: 503 }
      );
    }
    console.error("Error al obtener código de referido:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener el código de referido" },
      { status: 500 }
    );
  }
}
