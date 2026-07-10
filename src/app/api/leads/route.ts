import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get("busqueda") || "";
    const etapa = searchParams.get("etapa") || "";
    const ejecutivo = searchParams.get("ejecutivo") || "";

    let query = supabase.from("leads").select("*");

    if (busqueda) {
      query = query.or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,rut.ilike.%${busqueda}%,email.ilike.%${busqueda}%`);
    }
    if (etapa) {
      query = query.eq("etapa", etapa);
    }
    if (ejecutivo) {
      query = query.eq("nombreEjecutivo", ejecutivo);
    }

    query = query.order("creadoen", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error al obtener leads:", error);
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("Error al obtener leads:", error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.nombre || !body.apellido) {
      return NextResponse.json({ success: false, error: "Nombre y apellido requeridos" }, { status: 400 });
    }

    const leadId = `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from("leads")
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      console.error("Error al crear lead:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error al crear lead:", error);
    return NextResponse.json({ success: false, error: "Error al crear lead" }, { status: 500 });
  }
}
