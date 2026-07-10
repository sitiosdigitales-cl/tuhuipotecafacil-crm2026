import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("crm_token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const payload = JSON.parse(Buffer.from(token, "base64").toString());

    if (!payload.exp || payload.exp < Date.now()) {
      return NextResponse.json({ success: false, error: "Sesión expirada" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select("id,nombre,apellido,email,rol")
      .eq("id", payload.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 401 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error de autenticación" }, { status: 500 });
  }
}
