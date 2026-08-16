import { NextRequest, NextResponse } from "next/server";
import { supabase, fromSupabaseColumns, toSupabaseColumns } from "@/lib/supabase";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { puedeAccederLead } from "@/lib/permisos-lead";
import { SOLICITUDES_CONFIG } from "@/modulos/solicitudes";

const CAMPOS_OPERATIVOS: Record<string, string> = {
  tipoCredito: "tipo_credito",
  montoSolicitado: "monto_solicitado",
  plazoMeses: "plazo_meses",
  tasaInteres: "tasa_interes",
  cuotaMensual: "cuota_mensual",
  valorPropiedad: "valor_propiedad",
  pieDisponible: "pie_disponible",
  direccionPropiedad: "direccion_propiedad",
  comunaPropiedad: "comuna_propiedad",
  notas: "notas",
  etiquetas: "etiquetas",
};

const CAMPOS_ADMINISTRATIVOS: Record<string, string> = {
  bancoAsignado: "banco_asignado",
  ejecutivoId: "ejecutivo_id",
  documentosCompletos: "documentos_completos",
  documentosRequeridos: "documentos_requeridos",
};

async function obtenerSolicitudYLead(id: string) {
  const { data: solicitud, error } = await supabase
    .from("solicitudes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !solicitud) return { lead: null, solicitud: null };

  const { data: lead } = await supabase
    .from("leads")
    .select("email,asignadoa")
    .eq("id", solicitud.lead_id)
    .single();

  return { lead, solicitud };
}

// GET /api/solicitudes/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  try {
    const { id } = await params;
    const { lead, solicitud } = await obtenerSolicitudYLead(id);
    if (!solicitud) {
      return NextResponse.json(
        { success: false, error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }
    if (!lead || !puedeAccederLead(auth, lead)) return forbidden();
    return NextResponse.json({
      success: true,
      data: fromSupabaseColumns(solicitud),
    });
  } catch {
    return NextResponse.json({ success: false, error: "Error al obtener solicitud" }, { status: 500 });
  }
}

// PUT /api/solicitudes/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!SOLICITUDES_CONFIG.permisos.editar.includes(auth.rol)) {
    return forbidden();
  }

  try {
    const { id } = await params;
    const { lead, solicitud } = await obtenerSolicitudYLead(id);
    if (!solicitud) {
      return NextResponse.json(
        { success: false, error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }
    if (!lead || !puedeAccederLead(auth, lead)) return forbidden();

    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    const puedeAsignarBanco =
      SOLICITUDES_CONFIG.permisos.asignarBanco.includes(auth.rol);
    const puedeCambiarEstado =
      SOLICITUDES_CONFIG.permisos.cambiarEstado.includes(auth.rol);
    const camposPermitidos = puedeAsignarBanco
      ? { ...CAMPOS_OPERATIVOS, ...CAMPOS_ADMINISTRATIVOS }
      : CAMPOS_OPERATIVOS;

    Object.entries(camposPermitidos).forEach(([key, dbKey]) => {
      if (body[key] !== undefined) updateData[dbKey] = body[key];
    });

    if (puedeCambiarEstado && body.estado !== undefined) {
      updateData.estado = body.estado;
    }

    updateData.actualizadoen = new Date().toISOString();

    const { data, error } = await supabase
      .from("solicitudes")
      .update(toSupabaseColumns(updateData))
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: fromSupabaseColumns(data) });

  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

// DELETE /api/solicitudes/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!SOLICITUDES_CONFIG.permisos.eliminar.includes(auth.rol)) {
    return forbidden();
  }

  try {
    const { id } = await params;
    const { error } = await supabase.from("solicitudes").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
