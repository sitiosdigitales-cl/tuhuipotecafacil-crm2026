import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-static";
import { query, insert, update, remove } from "@/lib/db";

// GET
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get("busqueda") || "";
    const etapa = searchParams.get("etapa") || "";
    const ejecutivo = searchParams.get("ejecutivo") || "";

    let sql = "SELECT * FROM leads WHERE 1=1";
    const params: any[] = [];

    if (busqueda) {
      sql += " AND (nombre LIKE ? OR apellido LIKE ? OR rut LIKE ? OR email LIKE ?)";
      const busquedaParam = `%${busqueda}%`;
      params.push(busquedaParam, busquedaParam, busquedaParam, busquedaParam);
    }
    if (etapa) {
      sql += " AND etapa = ?";
      params.push(etapa);
    }
    if (ejecutivo) {
      sql += " AND nombreEjecutivo = ?";
      params.push(ejecutivo);
    }

    sql += " ORDER BY creadoEn DESC";

    const leads = await query(sql, params);
    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error("Error al obtener leads:", error);
    return NextResponse.json({ success: true, data: [] });
  }
}

// POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.nombre || !body.apellido) {
      return NextResponse.json({ success: false, error: "Nombre y apellido requeridos" }, { status: 400 });
    }

    const leadId = `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const lead = await insert("leads", {
      id: leadId,
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
      diasEnEtapa: 0,
    });

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (error) {
    console.error("Error al crear lead:", error);
    return NextResponse.json({ success: false, error: "Error al crear lead" }, { status: 500 });
  }
}
