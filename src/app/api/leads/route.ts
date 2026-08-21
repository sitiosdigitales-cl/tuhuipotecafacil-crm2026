import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray, fromSupabaseColumns, limpiarParaFiltro } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { despacharNotificacion } from "@/lib/dispatcher-notificaciones";
import { parseBoundedJson, RequestPayloadError } from "@/lib/request-json";
import { CreateLeadApiSchema } from "@/modulos/leads/validaciones-api";

const MAX_CREATE_LEAD_BYTES = 64 * 1024;

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get("busqueda") || "";
    const etapa = searchParams.get("etapa") || "";
    const ejecutivo = searchParams.get("ejecutivo") || "";

    let query = supabase.from("leads").select("*");

    // El alcance por rol se aplica en la consulta, no filtrando después: lo que
    // no corresponde no debe salir de la base. Es la versión de listado de la
    // misma regla que puedeAccederLead aplica a un lead suelto.
    if (auth.rol === "AGENTE") {
      // Contraparte del banco: solo los leads que le asignaron.
      query = query.eq("asignadoa", auth.userId);
    } else if (auth.rol === "CLIENTE") {
      // Solo el suyo, identificado por correo.
      query = query.eq("email", auth.email.toLowerCase());
    }
    // SUPER_ADMIN, ADMIN y EJECUTIVO ven todo: el equipo comercial trabaja
    // sobre un pozo compartido.

    if (busqueda) {
      const q = limpiarParaFiltro(busqueda);
      if (q) {
        query = query.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,rut.ilike.%${q}%,email.ilike.%${q}%`);
      }
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
      return NextResponse.json({ success: false, error: "No se pudieron cargar los datos" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: fromSupabaseArray(data || []) });
  } catch (error) {
    console.error("Error al obtener leads:", error);
    return NextResponse.json({ success: false, error: "Error al cargar los datos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAuth(request))) return unauthorized();
  try {
    const rawBody = await parseBoundedJson(request, MAX_CREATE_LEAD_BYTES);
    const parsedBody = CreateLeadApiSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: "Datos del lead no válidos" },
        { status: 400 }
      );
    }
    const body = parsedBody.data;

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
        asignadoA: body.asignadoA || null,
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

    return NextResponse.json(
      { success: true, data: fromSupabaseColumns(data) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof RequestPayloadError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error("Error al crear lead:", error);
    return NextResponse.json({ success: false, error: "Error al crear lead" }, { status: 500 });
  }
}
