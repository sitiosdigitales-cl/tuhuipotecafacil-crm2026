import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");
    const fechaDesde = searchParams.get("fechaDesde");
    const fechaHasta = searchParams.get("fechaHasta");

    let query = supabase.from("eventos").select("*");

    if (leadId) query = query.eq("leadid", leadId);
    if (fechaDesde) query = query.gte("fecha", fechaDesde);
    if (fechaHasta) query = query.lte("fecha", fechaHasta);

    query = query.order("fecha", { ascending: true });

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
    if (!body.titulo || !body.fecha) {
      return NextResponse.json({ success: false, error: "Título y fecha requeridos" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("eventos")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        titulo: body.titulo,
        fecha: body.fecha,
        horaInicio: body.horaInicio || null,
        horaFin: body.horaFin || null,
        tipo: body.tipo || "reunion",
        leadId: body.leadId || null,
        leadNombre: body.leadNombre || null,
        descripcion: body.descripcion || null,
        ubicacion: body.ubicacion || null,
        recordatorio: body.recordatorio || false,
        completado: false,
        notas: body.notas || null,
        creadoEn: new Date().toISOString(),
      }))
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error al crear evento" }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al crear evento" }, { status: 500 });
  }
}
