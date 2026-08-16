import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseColumns } from "@/lib/supabase";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import {
  SolicitudSchema,
  SOLICITUDES_CONFIG,
} from "@/modulos/solicitudes";
import { puedeAccederLead } from "@/lib/permisos-lead";
import type { TokenPayload } from "@/lib/jwt";

async function obtenerLead(leadId: string) {
  const { data, error } = await supabase
    .from("leads")
    .select("id,email,asignadoa")
    .eq("id", leadId)
    .single();

  return error ? null : data;
}

async function obtenerIdsLeadsPermitidos(
  auth: TokenPayload
): Promise<string[] | null> {
  if (["SUPER_ADMIN", "ADMIN", "EJECUTIVO"].includes(auth.rol)) {
    return null;
  }

  let query = supabase.from("leads").select("id");
  if (auth.rol === "AGENTE") {
    query = query.eq("asignadoa", auth.userId);
  } else if (auth.rol === "CLIENTE") {
    query = query.eq("email", auth.email.toLowerCase());
  } else {
    return [];
  }

  const { data, error } = await query;
  if (error) throw new Error("No se pudo resolver la cartera de solicitudes");
  return (data ?? []).map((lead) => lead.id);
}

// GET /api/solicitudes - Listar solicitudes
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const leadId = searchParams.get("leadId");
    const estado = searchParams.get("estado");
    const ejecutivoId = searchParams.get("ejecutivoId");

    if (leadId) {
      const lead = await obtenerLead(leadId);
      if (!lead) {
        return NextResponse.json(
          { success: false, error: "Lead no encontrado" },
          { status: 404 }
        );
      }
      if (!puedeAccederLead(auth, lead)) return forbidden();
    }

    let query = supabase.from("solicitudes").select("*");

    if (id) query = query.eq("id", id);
    if (leadId) {
      query = query.eq("lead_id", leadId);
    } else {
      const idsPermitidos = await obtenerIdsLeadsPermitidos(auth);
      if (idsPermitidos !== null) {
        if (idsPermitidos.length === 0) {
          return NextResponse.json({ success: true, data: [] });
        }
        query = query.in("lead_id", idsPermitidos);
      }
    }
    if (estado) query = query.eq("estado", estado);
    if (ejecutivoId) query = query.eq("ejecutivo_id", ejecutivoId);

    query = query.order("creadoen", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error al consultar solicitudes:", error.message);
      return NextResponse.json({ success: false, error: "No se pudieron cargar los datos" }, { status: 500 });
    }

    const solicitudes = (data || []).map(fromSupabaseColumns);
    return NextResponse.json({ success: true, data: solicitudes });

  } catch (e) {
    console.error("Error inesperado:", e);
    return NextResponse.json({ success: false, error: "Error al cargar los datos" }, { status: 500 });
  }
}

// POST /api/solicitudes - Crear solicitud
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  if (!SOLICITUDES_CONFIG.permisos.crear.includes(auth.rol)) {
    return forbidden();
  }

  try {
    const body = await request.json();

    // SolicitudSchema existía desde el principio y ningún endpoint lo usaba:
    // se guardaban solicitudes con monto cero, pie negativo o plazos fuera de
    // rango, y el error aparecía recién cuando alguien las revisaba a mano.
    const validacion = SolicitudSchema.safeParse(body);
    if (!validacion.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos de la solicitud inválidos",
          detalles: validacion.error.issues.map((i) => ({
            campo: i.path.join("."),
            problema: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const lead = await obtenerLead(body.leadId);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead no encontrado" },
        { status: 404 }
      );
    }
    if (!puedeAccederLead(auth, lead)) return forbidden();

    const solicitud = {
      id: crypto.randomUUID(),
      lead_id: body.leadId,
      cliente_id: body.clienteId || body.leadId,
      tipo_credito: body.tipoCredito,
      monto_solicitado: body.montoSolicitado,
      plazo_meses: body.plazoMeses,
      tasa_interes: body.tasaInteres || null,
      cuota_mensual: body.cuotaMensual || null,
      valor_propiedad: body.valorPropiedad,
      pie_disponible: body.pieDisponible,
      direccion_propiedad: body.direccionPropiedad || null,
      comuna_propiedad: body.comunaPropiedad || null,
      estado: body.estado || "EN_REVISION",
      banco_asignado: body.bancoAsignado || null,
      ejecutivo_id: body.ejecutivoId || auth.userId,
      documentos_completos: 0,
      documentos_requeridos: 0,
      dias_en_proceso: 0,
      notas: body.notas || null,
      etiquetas: body.etiquetas || [],
      creadoen: new Date().toISOString(),
      actualizadoen: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("solicitudes")
      .insert(toSupabaseColumns(solicitud))
      .select()
      .single();

    if (error) {
      console.error("Error al crear solicitud:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: fromSupabaseColumns(data) }, { status: 201 });

  } catch (err) {
    console.error("Error interno:", err);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
