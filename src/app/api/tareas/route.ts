import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener tareas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ejecutivo = searchParams.get("ejecutivo") || "";
    const estado = searchParams.get("estado") || "";

    const where: any = {};

    if (ejecutivo) {
      where.nombreEjecutivo = ejecutivo;
    }

    if (estado) {
      where.estado = estado;
    }

    const tareas = await prisma.tarea.findMany({
      where,
      orderBy: { creadoEn: "desc" },
    });

    return NextResponse.json({ success: true, data: tareas });
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener tareas" },
      { status: 500 }
    );
  }
}

// POST - Crear tarea
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.titulo) {
      return NextResponse.json(
        { success: false, error: "Título es requerido" },
        { status: 400 }
      );
    }

    const tarea = await prisma.tarea.create({
      data: {
        titulo: body.titulo,
        descripcion: body.descripcion || null,
        estado: body.estado || "PENDIENTE",
        tipo: body.tipo || "SEGUIMIENTO",
        prioridad: body.prioridad || "MEDIA",
        asignadoA: body.asignadoA || null,
        nombreEjecutivo: body.nombreEjecutivo || null,
        leadId: body.leadId || null,
        leadNombre: body.leadNombre || null,
        fechaVencimiento: body.fechaVencimiento ? new Date(body.fechaVencimiento) : null,
        duracionEstimada: body.duracionEstimada || null,
        etiquetas: body.etiquetas || null,
      },
    });

    return NextResponse.json({ success: true, data: tarea }, { status: 201 });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear tarea" },
      { status: 500 }
    );
  }
}
