import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verificarToken } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("crm_token")?.value || request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const payload = verificarToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: "Token inválido o expirado" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select("id,nombre,apellido,email,rol")
      .eq("id", payload.userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 401 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error de autenticación" }, { status: 500 });
  }
}
