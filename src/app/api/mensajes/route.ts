import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  if (!requireAuth(request)) return unauthorized();
    try {
    const { searchParams } = new URL(request.url);
    const conversacionId = searchParams.get("conversacionId");
    const limite = parseInt(searchParams.get("limite") || "50");

    if (!conversacionId) {
      return NextResponse.json({ success: false, error: "No se pudieron cargar los datos" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("mensajes")
      .select("*")
      .eq("conversacionid", conversacionId)
      .order("creadoen", { ascending: true })
      .limit(limite);

    if (error) {
      console.error("Fallo la consulta:", error.message);
      return NextResponse.json({ success: false, error: "No se pudieron cargar los datos" }, { status: 500 });
    }

    const mensajes = (data || []).map((m: Record<string, unknown>) => ({
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
  } catch (e) {
    console.error("Error inesperado:", e);
    return NextResponse.json({ success: false, error: "Error al cargar los datos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    if (!requireAuth(request)) return unauthorized();
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

    // Notificación de nuevo mensaje
    try {
      await supabase.from("notificaciones").insert({
        id: crypto.randomUUID(),
        tipo: "mensaje",
        titulo: "Nuevo mensaje",
        descripcion: `${body.remitenteNombre} envió un mensaje`,
        leida: false,
        accionurl: `/conversaciones`,
        creadoen: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al enviar mensaje" }, { status: 500 });
  }
}
