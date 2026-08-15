import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseColumns } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { SolicitudSchema } from "@/modulos/solicitudes";

// GET /api/solicitudes - Listar solicitudes
export async function GET(request: NextRequest) {
  if (!requireAuth(request)) return unauthorized();
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
