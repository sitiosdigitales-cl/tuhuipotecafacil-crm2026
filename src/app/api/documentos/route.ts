import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");
    let query = supabase.from("documentos").select("*");
    if (leadId) query = query.eq("leadid", leadId);
    const { data, error } = await query;
    if (error) return NextResponse.json({ success: true, data: [] });
    return NextResponse.json({ success: true, data: fromSupabaseArray(data || []) });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from("documentos")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        leadId: body.leadId,
        leadNombre: body.leadNombre || null,
        nombre: body.nombre,
        tipo: body.tipo || "OTRO",
        estado: body.estado || "PENDIENTE",
        archivoUrl: body.archivoUrl || null,
        creadoEn: new Date().toISOString(),
      }))
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: "Error al crear documento" }, { status: 500 });

    // Notificación automática
    try {
      await supabase.from("notificaciones").insert({
        id: crypto.randomUUID(),
        tipo: "documento",
        titulo: "Documento recibido",
        descripcion: `${body.leadNombre || "Cliente"} subió: ${body.nombre}`,
        leida: false,
        leadid: body.leadId,
        accionurl: `/documentos`,
        creadoen: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al crear documento" }, { status: 500 });
  }
}
