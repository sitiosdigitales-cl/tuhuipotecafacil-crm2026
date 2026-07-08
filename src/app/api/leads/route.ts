import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Obtener todos los leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get("busqueda") || "";
    const etapa = searchParams.get("etapa") || "";
    const ejecutivo = searchParams.get("ejecutivo") || "";

    let query = supabase
      .from("leads")
      .select("*")
      .order("creadoen", { ascending: false });

    if (busqueda) {
      query = query.or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,rut.ilike.%${busqueda}%,email.ilike.%${busqueda}%`);
    }

    if (etapa) {
      query = query.eq("etapa", etapa);
    }

    if (ejecutivo) {
      query = query.eq("nombreejecutivo", ejecutivo);
    }

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

    const { data, error } = await supabase
      .from("leads")
      .insert({
        nombre: body.nombre,
        apellido: body.apellido,
        rut: body.rut || "",
        email: body.email || null,
        telefono: body.telefono || null,
        origen: body.origen || "WEB",
        etapa: body.etapa || "NUEVO_LEAD",
        prioridad: body.prioridad || "MEDIA",
        nombreejecutivo: body.nombreEjecutivo || null,
        banco: body.banco || null,
        tipocredito: body.tipoCredito || null,
        montosolicitado: body.montoSolicitado || null,
        valorpropiedad: body.valorPropiedad || null,
        piedisponible: body.pieDisponible || null,
        notas: body.notas || null,
        situacionlaboral: body.situacionLaboral || "DEPENDIENTE",
        endicom: body.enDicom || false,
        dicomdetalle: body.dicomDetalle || null,
        rentamensual: body.rentaMensual || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error al crear lead:", error);
      return NextResponse.json({ success: false, error: "Error al crear lead" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error al crear lead:", error);
    return NextResponse.json({ success: false, error: "Error al crear lead" }, { status: 500 });
  }
}
