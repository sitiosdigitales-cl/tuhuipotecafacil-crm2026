import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Actualizar tarea
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const tareaExistente = await prisma.tarea.findUnique({
      where: { id },
    });

    if (!tareaExistente) {
      return NextResponse.json(
        { success: false, error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    const tarea = await prisma.tarea.update({
      where: { id },
      data: {
        titulo: body.titulo ?? tareaExistente.titulo,
        descripcion: body.descripcion ?? tareaExistente.descripcion,
        estado: body.estado ?? tareaExistente.estado,
        tipo: body.tipo ?? tareaExistente.tipo,
        prioridad: body.prioridad ?? tareaExistente.prioridad,
        asignadoA: body.asignadoA ?? tareaExistente.asignadoA,
        nombreEjecutivo: body.nombreEjecutivo ?? tareaExistente.nombreEjecutivo,
        fechaVencimiento: body.fechaVencimiento
          ? new Date(body.fechaVencimiento)
          : tareaExistente.fechaVencimiento,
        duracionEstimada: body.duracionEstimada ?? tareaExistente.duracionEstimada,
        etiquetas: body.etiquetas ?? tareaExistente.etiquetas,
      },
    });

    return NextResponse.json({ success: true, data: tarea });
  } catch (error) {
    console.error("Error al actualizar tarea:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar tarea" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar tarea
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.tarea.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Tarea eliminada" });
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar tarea" },
      { status: 500 }
    );
  }
}
