import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversacionId = searchParams.get("conversacionId");
    const limite = parseInt(searchParams.get("limite") || "50");

    if (!conversacionId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data, error } = await supabase
      .from("mensajes")
      .select("*")
      .eq("conversacionid", conversacionId)
      .order("creadoEn", { ascending: true })
      .limit(limite);

    if (error) return NextResponse.json({ success: true, data: [] });

    const mensajes = (data || []).map((m: any) => ({
      id: m.id,
      conversacionId: m.conversacionid,
      remitenteId: m.remitenteid,
      remitenteNombre: m.remitentenombre,
      contenido: m.contenido,
      tipo: m.tipo || "TEXTO",
      estado: m.estado || "ENVIADO",
      archivoUrl: m.archivourl,
      creadoEn: m.creadoEn,
    }));

    return NextResponse.json({ success: true, data: mensajes });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.conversacionId || !body.remitenteId || !body.contenido) {
      return NextResponse.json({ success: false, error: "Campos requeridos faltantes" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("mensajes")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        conversacionId: body.conversacionId,
        remitenteId: body.remitenteId,
        remitenteNombre: body.remitenteNombre,
        contenido: body.contenido,
        tipo: body.tipo || "TEXTO",
        estado: "ENVIADO",
        archivoUrl: body.archivoUrl || null,
        creadoEn: new Date().toISOString(),
      }))
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error al enviar mensaje" }, { status: 500 });

    // Actualizar último mensaje de la conversación
    await supabase
      .from("conversaciones")
      .update({ mensajesnoleidos: 0 })
      .eq("id", body.conversacionId);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al enviar mensaje" }, { status: 500 });
  }
}
