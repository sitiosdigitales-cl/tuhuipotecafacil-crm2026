import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("notificaciones").insert({
      id: crypto.randomUUID(),
      tipo: "info",
      titulo: "Test directo",
      descripcion: "Prueba de insercion directa con service role",
      leida: false,
      creadoen: new Date().toISOString(),
    }).select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
