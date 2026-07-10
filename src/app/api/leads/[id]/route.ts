import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ success: false, error: "Lead no encontrado" }, { status: 404 });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error al obtener lead" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, any> = {};
    if (body.nombre) updateData.nombre = body.nombre;
    if (body.apellido) updateData.apellido = body.apellido;
    if (body.rut !== undefined) updateData.rut = body.rut;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.telefono !== undefined) updateData.telefono = body.telefono;
    if (body.origen) updateData.origen = body.origen;
    if (body.etapa) updateData.etapa = body.etapa;
    if (body.prioridad) updateData.prioridad = body.prioridad;
    if (body.nombreEjecutivo !== undefined) updateData.nombreEjecutivo = body.nombreEjecutivo;
    if (body.banco !== undefined) updateData.banco = body.banco;
    if (body.tipoCredito !== undefined) updateData.tipoCredito = body.tipoCredito;
    if (body.montoSolicitado !== undefined) updateData.montoSolicitado = body.montoSolicitado;
    if (body.valorPropiedad !== undefined) updateData.valorPropiedad = body.valorPropiedad;
    if (body.pieDisponible !== undefined) updateData.pieDisponible = body.pieDisponible;
    if (body.notas !== undefined) updateData.notas = body.notas;
    if (body.situacionLaboral) updateData.situacionLaboral = body.situacionLaboral;
    if (body.enDicom !== undefined) updateData.enDicom = body.enDicom;

    updateData.actualizadoEn = new Date().toISOString();

    const { data, error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
