import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
    try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");
    const estado = searchParams.get("estado");

    let query = supabase.from("recordatorios").select("*");

    if (leadId) query = query.eq("leadid", leadId);
    if (estado) query = query.eq("estado", estado);

    query = query.order("proximoenvio", { ascending: true });

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
    if (!body.titulo) {
      return NextResponse.json({ success: false, error: "Título requerido" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("recordatorios")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        titulo: body.titulo,
        descripcion: body.descripcion || null,
        tipo: body.tipo || "sistema",
        frecuencia: body.frecuencia || "una_vez",
        leadId: body.leadId || null,
        leadNombre: body.leadNombre || null,
        fechaEnvio: body.fechaEnvio || new Date().toISOString(),
        proximoEnvio: body.proximoEnvio || new Date().toISOString(),
        estado: "pendiente",
        activo: true,
        intentos: 0,
        maxIntentos: body.maxIntentos || 3,
        creadoEn: new Date().toISOString(),
      }))
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error al crear recordatorio" }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al crear recordatorio" }, { status: 500 });
  }
}
