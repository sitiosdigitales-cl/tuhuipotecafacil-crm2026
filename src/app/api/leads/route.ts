import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener todos los leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get("busqueda") || "";
    const etapa = searchParams.get("etapa") || "";
    const ejecutivo = searchParams.get("ejecutivo") || "";

    if (!prisma) {
      return NextResponse.json({ success: true, data: [] });
    }

    const where: any = {};

    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda, mode: "insensitive" } },
        { apellido: { contains: busqueda, mode: "insensitive" } },
        { rut: { contains: busqueda } },
        { email: { contains: busqueda, mode: "insensitive" } },
      ];
    }

    if (etapa) where.etapa = etapa;
    if (ejecutivo) where.nombreEjecutivo = ejecutivo;

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { creadoEn: "desc" },
    });

    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error("Error al obtener leads:", error);
    return NextResponse.json({ success: true, data: [] });
  }
}

// POST - Crear nuevo lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.nombre || !body.apellido) {
      return NextResponse.json(
        { success: false, error: "Nombre y apellido son requeridos" },
        { status: 400 }
      );
    }

    if (!prisma) {
      return NextResponse.json(
        { success: false, error: "Base de datos no disponible" },
        { status: 503 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        nombre: body.nombre,
        apellido: body.apellido,
        rut: body.rut || "",
        email: body.email || null,
        telefono: body.telefono || null,
        origen: body.origen || "WEB",
        etapa: body.etapa || "NUEVO_LEAD",
        prioridad: body.prioridad || "MEDIA",
        nombreEjecutivo: body.nombreEjecutivo || null,
        banco: body.banco || null,
        tipoCredito: body.tipoCredito || null,
        montoSolicitado: body.montoSolicitado || null,
        valorPropiedad: body.valorPropiedad || null,
        pieDisponible: body.pieDisponible || null,
        notas: body.notas || null,
        situacionLaboral: body.situacionLaboral || "DEPENDIENTE",
        enDicom: body.enDicom || false,
        dicomDetalle: body.dicomDetalle || null,
        rentaMensual: body.rentaMensual || null,
      },
    });

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (error) {
    console.error("Error al crear lead:", error);
    return NextResponse.json({ success: false, error: "Error al crear lead" }, { status: 500 });
  }
}
