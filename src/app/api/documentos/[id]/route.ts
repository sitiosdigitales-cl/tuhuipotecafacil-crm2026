import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Actualizar documento (cambiar estado)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const docExistente = await prisma.documento.findUnique({
      where: { id },
    });

    if (!docExistente) {
      return NextResponse.json(
        { success: false, error: "Documento no encontrado" },
        { status: 404 }
      );
    }

    const documento = await prisma.documento.update({
      where: { id },
      data: {
        estado: body.estado ?? docExistente.estado,
        archivoUrl: body.archivoUrl ?? docExistente.archivoUrl,
      },
    });

    return NextResponse.json({ success: true, data: documento });
  } catch (error) {
    console.error("Error al actualizar documento:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar documento" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar documento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.documento.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Documento eliminado" });
  } catch (error) {
    console.error("Error al eliminar documento:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar documento" },
      { status: 500 }
    );
  }
}
