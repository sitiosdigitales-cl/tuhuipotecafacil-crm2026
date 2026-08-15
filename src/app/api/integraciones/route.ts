import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  if (!requireAuth(request)) return unauthorized();
    try {
    const { data, error } = await supabase.from("integraciones").select("*").order("creadoen", { ascending: false });
    if (error) {
      console.error("Fallo la consulta:", error.message);
      return NextResponse.json({ success: false, error: "No se pudieron cargar los datos" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: fromSupabaseArray(data || []) });
  } catch (e) {
    console.error("Error inesperado:", e);
    return NextResponse.json({ success: false, error: "Error al cargar los datos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    if (!requireAuth(request)) return unauthorized();
    try {
    const body = await request.json();
    const { data, error } = await supabase
      .from("integraciones")
      .insert(toSupabaseColumns({ id: crypto.randomUUID(), ...body, creadoEn: new Date().toISOString() }))
      .select().single();
    if (error) return NextResponse.json({ success: false, error: "Error al crear" }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al crear" }, { status: 500 });
  }
}
