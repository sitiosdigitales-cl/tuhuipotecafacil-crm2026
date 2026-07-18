import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { despacharNotificacion } from "@/lib/dispatcher-notificaciones";

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
      query = query.eq("nombreejecutivo", ejecutivo);
    }

    query = query.order("creadoen", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error al obtener leads:", error.message, error.details);
      return NextResponse.json({ success: true, data: [], error: error.message });
    }

    return NextResponse.json({ success: true, data: fromSupabaseArray(data || []) });
  } catch (error) {
    console.error("Error al obtener leads:", error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const body = await request.json();
    if (!body.nombre || !body.apellido) {
      return NextResponse.json({ success: false, error: "Nombre y apellido requeridos" }, { status: 400 });
    }

    const leadId = crypto.randomUUID();

    const { data, error } = await supabase
      .from("leads")
      .insert(toSupabaseColumns({
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
        // Referidos
        referidoPor: body.referidoPor || null,
        referidoPorNombre: body.referidoPorNombre || null,
        codigoReferido: body.codigoReferido || null,
        situacionLaboral: body.situacionLaboral || "DEPENDIENTE",
        enDicom: body.enDicom || false,
        diasEnEtapa: 0,
        // Datos personales extendidos
        cargaslegales: body.cargasLegales || null,
        estadocivil: body.estadoCivil || null,
        regimenmatrimonial: body.regimenMatrimonial || null,
        fechanacimiento: body.fechaNacimiento || null,
        estudios: body.estudios || null,
        profesion: body.profesion || null,
        domicilioparticular: body.domicilioParticular || null,
        comunaciudad: body.comunaCiudad || null,
        valorarriendo: body.valorArriendo || null,
        afp: body.afp || null,
        // Datos del empleador
        nombreempleador: body.nombreEmpleador || null,
        rutfactura: body.rutEmpresa || null,
        fechaingreso: body.fechaIngreso || null,
        cargo: body.cargo || null,
        rentaliquida: body.rentaLiquida || null,
        bancoabonorenta: body.bancoAbonoRenta || null,
        fechapago: body.fechaPago || null,
        direccionlaboral: body.direccionLaboral || null,
        comunaciudadlaboral: body.comunaCiudadLaboral || null,
        telefonolaboralfijo: body.telefonoLaboralFijo || null,
        emaillaboral: body.emailLaboral || null,
        otrosingresos: body.otrosIngresos || null,
      }))
      .select()
      .single();

    if (error) {
      console.error("Error al crear lead:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Notificacion via dispatcher
    despacharNotificacion({
      evento: "lead_nuevo",
      leadId,
      titulo: "Nuevo lead registrado",
      descripcion: `${body.nombre} ${body.apellido} completo el formulario web`,
      accionUrl: `/leads/${leadId}`,
    }).catch(() => {});

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error al crear lead:", error);
    return NextResponse.json({ success: false, error: "Error al crear lead" }, { status: 500 });
  }
}
