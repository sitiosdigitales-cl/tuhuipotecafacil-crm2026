import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseColumns } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const estado = searchParams.get("estado");
    let query = supabase.from("bancos").select("*");
    if (id) query = query.eq("id", id);
    if (estado) query = query.eq("estado", estado);
    query = query.order("nombre", { ascending: true });
    const { data, error } = await query;
    if (error) {
      console.error("Error al consultar bancos:", error.message);
      return NextResponse.json({ success: true, data: [] });
    }
    const bancos = (data || []).map((b: any) => fromSupabaseColumns(b));
    return NextResponse.json({ success: true, data: bancos });
  } catch (_e) {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bancoData = {
      id: crypto.randomUUID(),
      nombre: body.nombre,
      color: body.color || "#3B82F6",
      estado: body.estado || "ACTIVO",
      convenio: body.convenio || "Estandar",
      tasa_base: body.tasaBase || 0,
      tasa_preferencial: body.tasaPreferencial || 0,
      cae: body.cae || 0,
      financiamiento_maximo: body.financiamientoMaximo || 90,
      plazo_maximo: body.plazoMaximo || 30,
      pie_minimo: body.pieMinimo || 10,
      pie_maximo: body.pieMaximo || 20,
      prepago: body.prepago !== false,
      complemento_renta: body.complementoRenta !== false,
      independientes: body.independientes !== false,
      empresas: body.empresas !== false,
      productos: body.productos || [],
      requisitos: body.requisitos || [],
      contacto_nombre: body.contactoNombre || "",
      contacto_email: body.contactoEmail || "",
      contacto_telefono: body.contactoTelefono || "",
      contacto_whatsapp: body.contactoWhatsapp || "",
      sucursal: body.sucursal || "",
      region: body.region || "",
      horario_atencion: body.horarioAtencion || "",
      tiempo_aprobacion: body.tiempoAprobacion || "",
      tiempo_escrituracion: body.tiempoEscrituracion || "",
      tiempo_pago: body.tiempoPago || "",
      comision_convenio: body.comisionConvenio || "",
      requisitos_minimos: body.requisitosMinimos || [],
      tasas_por_tipo: body.tasasPorTipo || {},
    };
    const { data, error } = await supabase.from("bancos").insert(toSupabaseColumns(bancoData)).select().single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: fromSupabaseColumns(data) }, { status: 201 });
  } catch (_e) {
    return NextResponse.json({ success: false, error: "Error al crear banco" }, { status: 500 });
  }
}