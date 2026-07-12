import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
    try {
    const { searchParams } = new URL(request.url);
    const accion = searchParams.get("accion");
    const modulo = searchParams.get("modulo");
    const usuarioId = searchParams.get("usuarioId");

    let query = supabase.from("auditoria").select("*");

    if (accion) query = query.eq("accion", accion);
    if (modulo) query = query.eq("modulo", modulo);
    if (usuarioId) query = query.eq("usuarioid", usuarioId);

    query = query.order("fecha", { ascending: false }).limit(200);

    const { data, error } = await query;
    if (error) return NextResponse.json({ success: true, data: [] });
    return NextResponse.json({ success: true, data: fromSupabaseArray(data || []) });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
    if (!requireAuth(request)) return unauthorized();
    try {
    const body = await request.json();
    const { data, error } = await supabase
      .from("auditoria")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        usuarioId: body.usuarioId,
        usuarioNombre: body.usuarioNombre,
        accion: body.accion,
        modulo: body.modulo,
        registroId: body.registroId || null,
        registroNombre: body.registroNombre || null,
        valorAnterior: body.valorAnterior || null,
        valorNuevo: body.valorNuevo || null,
        motivo: body.motivo || null,
        ip: body.ip || null,
        navegador: body.navegador || null,
        dispositivo: body.dispositivo || null,
        fecha: new Date().toISOString(),
      }))
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error al crear registro" }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al crear registro" }, { status: 500 });
  }
}
