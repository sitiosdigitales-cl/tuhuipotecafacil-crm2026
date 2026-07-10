import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    const payload = authenticateRequest(request);
    if (!payload) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
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
