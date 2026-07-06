import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener lead por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error("Error al obtener lead:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener lead" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const leadExistente = await prisma.lead.findUnique({
      where: { id },
    });

    if (!leadExistente) {
      return NextResponse.json(
        { success: false, error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        nombre: body.nombre ?? leadExistente.nombre,
        apellido: body.apellido ?? leadExistente.apellido,
        rut: body.rut ?? leadExistente.rut,
        email: body.email ?? leadExistente.email,
        telefono: body.telefono ?? leadExistente.telefono,
        origen: body.origen ?? leadExistente.origen,
        etapa: body.etapa ?? leadExistente.etapa,
        prioridad: body.prioridad ?? leadExistente.prioridad,
        nombreEjecutivo: body.nombreEjecutivo ?? leadExistente.nombreEjecutivo,
        banco: body.banco ?? leadExistente.banco,
        tipoCredito: body.tipoCredito ?? leadExistente.tipoCredito,
        montoSolicitado: body.montoSolicitado ?? leadExistente.montoSolicitado,
        valorPropiedad: body.valorPropiedad ?? leadExistente.valorPropiedad,
        pieDisponible: body.pieDisponible ?? leadExistente.pieDisponible,
        notas: body.notas ?? leadExistente.notas,
        situacionLaboral: body.situacionLaboral ?? leadExistente.situacionLaboral,
        enDicom: body.enDicom ?? leadExistente.enDicom,
        dicomDetalle: body.dicomDetalle ?? leadExistente.dicomDetalle,
        rentaMensual: body.rentaMensual ?? leadExistente.rentaMensual,
      },
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error("Error al actualizar lead:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar lead" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const leadExistente = await prisma.lead.findUnique({
      where: { id },
    });

    if (!leadExistente) {
      return NextResponse.json(
        { success: false, error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Lead eliminado" });
  } catch (error) {
    console.error("Error al eliminar lead:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar lead" },
      { status: 500 }
    );
  }
}
