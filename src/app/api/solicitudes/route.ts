import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseColumns } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

// GET /api/solicitudes - Listar solicitudes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const leadId = searchParams.get("leadId");
    const estado = searchParams.get("estado");
    const ejecutivoId = searchParams.get("ejecutivoId");

    let query = supabase.from("solicitudes").select("*");

    if (id) query = query.eq("id", id);
    if (leadId) query = query.eq("lead_id", leadId);
    if (estado) query = query.eq("estado", estado);
    if (ejecutivoId) query = query.eq("ejecutivo_id", ejecutivoId);

    query = query.order("creadoen", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error al consultar solicitudes:", error.message);
      return NextResponse.json({ success: true, data: [] });
    }

    const solicitudes = (data || []).map(fromSupabaseColumns);
    return NextResponse.json({ success: true, data: solicitudes });

  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

// POST /api/solicitudes - Crear solicitud
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();

  try {
    const body = await request.json();

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
