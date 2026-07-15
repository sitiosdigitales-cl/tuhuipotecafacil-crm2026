import { NextRequest, NextResponse } from "next/server";
import { supabase, fromSupabaseColumns, toSupabaseColumns } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

// GET /api/solicitudes/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase.from("solicitudes").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ success: false, error: "Solicitud no encontrada" }, { status: 404 });
    return NextResponse.json({ success: true, data: fromSupabaseColumns(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Error al obtener solicitud" }, { status: 500 });
  }
}

// PUT /api/solicitudes/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, any> = {};
    const fieldMap: Record<string, string> = {
      tipoCredito: "tipo_credito",
      montoSolicitado: "monto_solicitado",
      plazoMeses: "plazo_meses",
      tasaInteres: "tasa_interes",
      cuotaMensual: "cuota_mensual",
      valorPropiedad: "valor_propiedad",
      pieDisponible: "pie_disponible",
      direccionPropiedad: "direccion_propiedad",
      comunaPropiedad: "comuna_propiedad",
      estado: "estado",
      bancoAsignado: "banco_asignado",
      ejecutivoId: "ejecutivo_id",
      documentosCompletos: "documentos_completos",
      documentosRequeridos: "documentos_requeridos",
      notas: "notas",
      etiquetas: "etiquetas",
    };

    Object.entries(body).forEach(([key, value]) => {
      const dbKey = fieldMap[key] || key.toLowerCase();
      if (value !== undefined) updateData[dbKey] = value;
    });

    updateData.actualizadoen = new Date().toISOString();

    const { data, error } = await supabase
      .from("solicitudes")
      .update(toSupabaseColumns(updateData))
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: fromSupabaseColumns(data) });

  } catch (err) {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

// DELETE /api/solicitudes/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();

  try {
    const { id } = await params;
    const { error } = await supabase.from("solicitudes").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
