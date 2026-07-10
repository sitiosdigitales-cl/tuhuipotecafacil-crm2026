import { NextRequest, NextResponse } from "next/server";
import { queryOne, update, remove } from "@/lib/db";

// GET
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lead = await queryOne("SELECT * FROM leads WHERE id = ?", [id]);
    if (!lead) return NextResponse.json({ success: false, error: "Lead no encontrado" }, { status: 404 });
    return NextResponse.json({ success: true, data: lead });
  } catch {
    return NextResponse.json({ success: false, error: "Error al obtener lead" }, { status: 500 });
  }
}

// PUT
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const data: Record<string, any> = {};
    if (body.nombre) data.nombre = body.nombre;
    if (body.apellido) data.apellido = body.apellido;
    if (body.etapa) data.etapa = body.etapa;
    if (body.prioridad) data.prioridad = body.prioridad;
    if (body.nombreEjecutivo) data.nombreEjecutivo = body.nombreEjecutivo;
    if (body.banco) data.banco = body.banco;
    if (body.notas) data.notas = body.notas;
    if (body.tipoCredito) data.tipoCredito = body.tipoCredito;
    if (body.montoSolicitado) data.montoSolicitado = body.montoSolicitado;
    if (body.valorPropiedad) data.valorPropiedad = body.valorPropiedad;
    if (body.pieDisponible) data.pieDisponible = body.pieDisponible;

    await update("leads", id, data);
    return NextResponse.json({ success: true, data: { id, ...data } });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await remove("leads", id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
