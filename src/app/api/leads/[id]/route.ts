import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET
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

// PUT
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { data, error } = await supabase.from("leads").update({
      nombre: body.nombre, apellido: body.apellido, etapa: body.etapa,
      prioridad: body.prioridad, nombreejecutivo: body.nombreEjecutivo || body.nombreejecutivo,
      banco: body.banco, notas: body.notas, tipocredito: body.tipoCredito || body.tipocredito,
      montosolicitado: body.montoSolicitado || body.montosolicitado,
      valorpropiedad: body.valorPropiedad || body.valorpropiedad,
      piedisponible: body.pieDisponible || body.piedisponible,
    }).eq("id", id).select().single();
    if (error) return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
