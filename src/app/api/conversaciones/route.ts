import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
    try {
    const { searchParams } = new URL(request.url);
    const participante = searchParams.get("participante");
    const tipo = searchParams.get("tipo");

    let query = supabase.from("conversaciones").select("*");

    if (tipo) query = query.eq("tipo", tipo);
    if (participante) {
      query = query.contains("participantes", [participante]);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ success: true, data: [] });

    const conversaciones = (data || []).map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo,
      descripcion: c.descripcion,
      participantes: c.participantes || [],
      mensajesNoLeidos: c.mensajesnoleidos || 0,
      esFijo: c.esfijo || false,
      creadoPor: c.creadopor,
      creadoEn: c.creadoen,
    }));

    return NextResponse.json({ success: true, data: conversaciones });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
    try {
    const body = await request.json();
    if (!body.nombre || !body.participantes) {
      return NextResponse.json({ success: false, error: "Nombre y participantes requeridos" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("conversaciones")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        nombre: body.nombre,
        tipo: body.tipo || "DIRECTO",
        descripcion: body.descripcion || null,
        participantes: body.participantes,
        mensajesNoLeidos: 0,
        esFijo: body.esFijo || false,
        creadoPor: body.creadoPor || null,
        creadoEn: new Date().toISOString(),
      }))
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error al crear conversación" }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al crear conversación" }, { status: 500 });
  }
}
