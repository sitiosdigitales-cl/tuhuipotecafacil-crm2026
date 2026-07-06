import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener documentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId") || "";

    const where: any = {};
    if (leadId) {
      where.leadId = leadId;
    }

    const documentos = await prisma.documento.findMany({
      where,
      orderBy: { creadoEn: "desc" },
    });

    return NextResponse.json({ success: true, data: documentos });
  } catch (error) {
    console.error("Error al obtener documentos:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener documentos" },
      { status: 500 }
    );
  }
}

// POST - Crear documento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.leadId || !body.nombre) {
      return NextResponse.json(
        { success: false, error: "leadId y nombre son requeridos" },
        { status: 400 }
      );
    }

    const documento = await prisma.documento.create({
      data: {
        leadId: body.leadId,
        nombre: body.nombre,
        tipo: body.tipo || "OTRO",
        estado: body.estado || "PENDIENTE",
        archivoUrl: body.archivoUrl || null,
      },
    });

    return NextResponse.json({ success: true, data: documento }, { status: 201 });
  } catch (error) {
    console.error("Error al crear documento:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear documento" },
      { status: 500 }
    );
  }
}
