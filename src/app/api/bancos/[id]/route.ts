import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseColumns } from "@/lib/supabase";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase.from("bancos").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ success: false, error: "Banco no encontrado" }, { status: 404 });
    return NextResponse.json({ success: true, data: fromSupabaseColumns(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData: Record<string, any> = {};
    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.estado !== undefined) updateData.estado = body.estado;
    if (body.convenio !== undefined) updateData.convenio = body.convenio;
    if (body.tasaBase !== undefined) updateData.tasa_base = body.tasaBase;
    if (body.tasaPreferencial !== undefined) updateData.tasa_preferencial = body.tasaPreferencial;
    if (body.cae !== undefined) updateData.cae = body.cae;
    if (body.financiamientoMaximo !== undefined) updateData.financiamiento_maximo = body.financiamientoMaximo;
    if (body.plazoMaximo !== undefined) updateData.plazo_maximo = body.plazoMaximo;
    if (body.pieMinimo !== undefined) updateData.pie_minimo = body.pieMinimo;
    if (body.pieMaximo !== undefined) updateData.pie_maximo = body.pieMaximo;
    if (body.prepago !== undefined) updateData.prepago = body.prepago;
    if (body.complementoRenta !== undefined) updateData.complemento_renta = body.complementoRenta;
    if (body.independientes !== undefined) updateData.independientes = body.independientes;
    if (body.empresas !== undefined) updateData.empresas = body.empresas;
    if (body.productos !== undefined) updateData.productos = body.productos;
    if (body.requisitos !== undefined) updateData.requisitos = body.requisitos;
    if (body.contactoNombre !== undefined) updateData.contacto_nombre = body.contactoNombre;
    if (body.contactoEmail !== undefined) updateData.contacto_email = body.contactoEmail;
    if (body.contactoTelefono !== undefined) updateData.contacto_telefono = body.contactoTelefono;
    if (body.contactoWhatsapp !== undefined) updateData.contacto_whatsapp = body.contactoWhatsapp;
    if (body.sucursal !== undefined) updateData.sucursal = body.sucursal;
    if (body.region !== undefined) updateData.region = body.region;
    if (body.horarioAtencion !== undefined) updateData.horario_atencion = body.horarioAtencion;
    if (body.tiempoAprobacion !== undefined) updateData.tiempo_aprobacion = body.tiempoAprobacion;
    if (body.tiempoEscrituracion !== undefined) updateData.tiempo_escrituracion = body.tiempoEscrituracion;
    if (body.tiempoPago !== undefined) updateData.tiempo_pago = body.tiempoPago;
    if (body.comisionConvenio !== undefined) updateData.comision_convenio = body.comisionConvenio;
    if (body.requisitosMinimos !== undefined) updateData.requisitos_minimos = body.requisitosMinimos;
    if (body.tasasPorTipo !== undefined) updateData.tasas_por_tipo = body.tasasPorTipo;
    const { data, error } = await supabase.from("bancos").update(toSupabaseColumns(updateData)).eq("id", id).select().single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: fromSupabaseColumns(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabase.from("bancos").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}