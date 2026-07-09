import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }
    // En producción esto verificaría el JWT
    // Por ahora retornamos el primer usuario
    const { data, error } = await supabase.from("usuarios").select("id,nombre,apellido,email,rol").limit(1).single();
    if (error || !data) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 401 });
    }
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error de autenticación" }, { status: 500 });
  }
}
