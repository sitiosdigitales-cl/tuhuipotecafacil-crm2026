import { NextRequest, NextResponse } from "next/server";
import { supabase, fromSupabaseColumns } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const { id } = await params;
    const { data, error } = await supabase.from("eventos").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ success: false, error: "Evento no encontrado" }, { status: 404 });
    return NextResponse.json({ success: true, data: fromSupabaseColumns(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Error al obtener evento" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const { id } = await params;
    const body = await request.json();
    const camposPermitidos: Record<string, any> = {};
    if (body.titulo !== undefined) camposPermitidos.titulo = body.titulo;
    if (body.descripcion !== undefined) camposPermitidos.descripcion = body.descripcion;
    if (body.fecha !== undefined) camposPermitidos.fecha = body.fecha;
    if (body.horaInicio !== undefined) camposPermitidos.horaInicio = body.horaInicio;
    if (body.horaFin !== undefined) camposPermitidos.horaFin = body.horaFin;
    if (body.tipo !== undefined) camposPermitidos.tipo = body.tipo;
    if (body.estado !== undefined) camposPermitidos.estado = body.estado;
    if (body.leadId !== undefined) camposPermitidos.leadId = body.leadId;
    if (body.leadNombre !== undefined) camposPermitidos.leadNombre = body.leadNombre;
    if (body.recordatorio !== undefined) camposPermitidos.recordatorio = body.recordatorio;
    const { data, error } = await supabase
      .from("eventos")
      .update(camposPermitidos)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const { id } = await params;
    const { error } = await supabase.from("eventos").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
