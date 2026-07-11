import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray } from "@/lib/supabase";
import { requireRole, unauthorized, forbidden } from "@/lib/api-auth";

// Etapas por defecto del sistema
const ETAPAS_POR_DEFECTO = [
  { id: "NUEVO_LEAD", nombre: "Nuevo Lead", color: "#3B82F6", orden: 1, activa: true },
  { id: "CONTACTO_INICIAL", nombre: "Contacto Inicial", color: "#6366F1", orden: 2, activa: true },
  { id: "CONTACTADO", nombre: "Contactado", color: "#8B5CF6", orden: 3, activa: true },
  { id: "INTERESADO", nombre: "Interesado", color: "#A855F7", orden: 4, activa: true },
  { id: "CALIFICACION_COMERCIAL", nombre: "Calificación Comercial", color: "#D946EF", orden: 5, activa: true },
  { id: "DOCS_PENDIENTES", nombre: "Docs. Pendientes", color: "#F97316", orden: 6, activa: true },
  { id: "DOCS_COMPLETAS", nombre: "Docs. Completas", color: "#22C55E", orden: 7, activa: true },
  { id: "EVALUACION_BANCARIA", nombre: "Evaluación Bancaria", color: "#06B6D4", orden: 8, activa: true },
  { id: "PREAPROBADO", nombre: "Preaprobado", color: "#14B8A6", orden: 9, activa: true },
  { id: "APROBADO", nombre: "Aprobado", color: "#10B981", orden: 10, activa: true },
  { id: "FIRMA_DIGITAL", nombre: "Firma Digital", color: "#6366F1", orden: 11, activa: true },
  { id: "NOTARIA", nombre: "Notaría", color: "#8B5CF6", orden: 12, activa: true },
  { id: "CREDITO_PAGADO", nombre: "Crédito Pagado", color: "#22C55E", orden: 13, activa: true },
];

export async function GET() {
  // Cargar etapas desde la base de datos
  const { data, error } = await supabase
    .from("pipeline_stages")
    .select("*")
    .order("orden", { ascending: true });

  if (error || !data || data.length === 0) {
    // Si no hay etapas en la DB, retornar las por defecto
    return NextResponse.json({ success: true, data: ETAPAS_POR_DEFECTO });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  // Solo ADMIN y SUPER_ADMIN pueden crear etapas
  if (!requireRole(request, ["SUPER_ADMIN", "ADMIN"])) {
    return forbidden();
  }

  try {
    const body = await request.json();
    const { nombre, color, orden } = body;

    if (!nombre) {
      return NextResponse.json({ success: false, error: "Nombre requerido" }, { status: 400 });
    }

    // Generar ID único basado en el nombre
    const id = nombre
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "_")
      .replace(/_+/g, "_");

    // Obtener el último orden
    const { data: lastStage } = await supabase
      .from("pipeline_stages")
      .select("orden")
      .order("orden", { ascending: false })
      .limit(1)
      .single();

    const nuevoOrden = orden || (lastStage ? lastStage.orden + 1 : 1);

    const { data, error } = await supabase
      .from("pipeline_stages")
      .insert({
        id,
        nombre,
        color: color || "#64748B",
        orden: nuevoOrden,
        activa: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error al crear etapa:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al crear etapa" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!requireRole(request, ["SUPER_ADMIN", "ADMIN"])) {
    return forbidden();
  }

  try {
    const body = await request.json();
    const { id, nombre, color, orden, activa } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (color !== undefined) updateData.color = color;
    if (orden !== undefined) updateData.orden = orden;
    if (activa !== undefined) updateData.activa = activa;

    const { data, error } = await supabase
      .from("pipeline_stages")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar etapa" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!requireRole(request, ["SUPER_ADMIN", "ADMIN"])) {
    return forbidden();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400 });
    }

    // Verificar que no haya leads en esta etapa
    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("etapa", id);

    if (count && count > 0) {
      return NextResponse.json({
        success: false,
        error: `No se puede eliminar: hay ${count} leads en esta etapa`
      }, { status: 400 });
    }

    const { error } = await supabase
      .from("pipeline_stages")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar etapa" }, { status: 500 });
  }
}
