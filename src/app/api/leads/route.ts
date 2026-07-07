import { NextRequest, NextResponse } from "next/server";

// Almacenamiento en memoria para leads (simula base de datos)
let leadsEnMemoria: any[] = [];

// Intentar cargar Prisma si está disponible
let prisma: any = null;
try {
  prisma = require("@/lib/prisma").prisma;
} catch {
  // Prisma no disponible, usar almacenamiento en memoria
}

// GET - Obtener todos los leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get("busqueda") || "";
    const etapa = searchParams.get("etapa") || "";
    const ejecutivo = searchParams.get("ejecutivo") || "";

    // Si Prisma está disponible, usar base de datos
    if (prisma) {
      const where: any = {};
      if (busqueda) {
        where.OR = [
          { nombre: { contains: busqueda } },
          { apellido: { contains: busqueda } },
          { rut: { contains: busqueda } },
          { email: { contains: busqueda } },
        ];
      }
      if (etapa) where.etapa = etapa;
      if (ejecutivo) where.nombreEjecutivo = ejecutivo;

      const leads = await prisma.lead.findMany({
        where,
        orderBy: { creadoEn: "desc" },
      });
      return NextResponse.json({ success: true, data: leads });
    }

    // Fallback: usar almacenamiento en memoria
    let leadsFiltrados = [...leadsEnMemoria];
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      leadsFiltrados = leadsFiltrados.filter((l) =>
        l.nombre?.toLowerCase().includes(busquedaLower) ||
        l.apellido?.toLowerCase().includes(busquedaLower) ||
        l.rut?.includes(busqueda) ||
        l.email?.toLowerCase().includes(busquedaLower)
      );
    }
    if (etapa) leadsFiltrados = leadsFiltrados.filter((l) => l.etapa === etapa);
    if (ejecutivo) leadsFiltrados = leadsFiltrados.filter((l) => l.nombreEjecutivo === ejecutivo);

    return NextResponse.json({ success: true, data: leadsFiltrados });
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

    const nuevoLead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    };

    // Si Prisma está disponible, guardar en base de datos
    if (prisma) {
      const lead = await prisma.lead.create({ data: nuevoLead });
      return NextResponse.json({ success: true, data: lead }, { status: 201 });
    }

    // Fallback: guardar en memoria
    leadsEnMemoria.unshift(nuevoLead);
    return NextResponse.json({ success: true, data: nuevoLead }, { status: 201 });
  } catch (error) {
    console.error("Error al crear lead:", error);
    return NextResponse.json({ success: false, error: "Error al crear lead" }, { status: 500 });
  }
}
