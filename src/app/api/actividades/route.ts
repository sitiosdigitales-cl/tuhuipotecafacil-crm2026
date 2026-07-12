import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
    try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase.from("actividades").select("*").order("fecha", { ascending: false }).limit(limit);

    if (leadId) {
      query = query.eq("leadid", leadId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ success: true, data: [] });

    const actividades = (data || []).map((a: any) => ({
      id: a.id,
      leadId: a.leadid,
      tipo: a.tipo,
      titulo: a.titulo,
      descripcion: a.descripcion,
      fecha: a.fecha,
      usuario: a.usuario,
      usuarioId: a.usuarioid,
    }));

    return NextResponse.json({ success: true, data: actividades });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
    if (!requireAuth(request)) return unauthorized();
    try {
    const body = await request.json();
    const { leadId, tipo, titulo, descripcion, usuario, usuarioId } = body;

    if (!leadId || !tipo || !titulo) {
      return NextResponse.json({ success: false, error: "leadId, tipo y titulo requeridos" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("actividades")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        leadId,
        tipo,
        titulo,
        descripcion: descripcion || "",
        fecha: new Date().toISOString(),
        usuario: usuario || "Sistema",
        usuarioId: usuarioId || null,
      }))
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error al crear actividad" }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al crear actividad" }, { status: 500 });
  }
}
