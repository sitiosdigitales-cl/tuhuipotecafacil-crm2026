import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireRole, forbidden } from "@/lib/api-auth";

// Etapas por defecto del sistema (almacenadas en memoria)
let etapasEnMemoria = [
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
  // Intentar cargar desde la base de datos
  let etapasDB: typeof etapasEnMemoria = [];
  try {
    const { data, error } = await supabase
      .from("pipeline_stages")
      .select("*")
      .order("orden", { ascending: true });

    if (!error && data && data.length > 0) {
      etapasDB = data;
    }
  } catch {
    // Ignorar errores
  }

  // Combinar: etapas de DB + etapas del sistema que falten
  const idsDB = new Set(etapasDB.map((e) => e.id));
  const etapasSistema = etapasEnMemoria.filter((e) => !idsDB.has(e.id));
  const todasEtapas = [...etapasDB, ...etapasSistema].sort((a, b) => a.orden - b.orden);

  return NextResponse.json({ success: true, data: todasEtapas });
}

export async function POST(request: NextRequest) {
  if (!requireRole(request, ["SUPER_ADMIN", "ADMIN"])) {
    return forbidden();
  }

  try {
    const body = await request.json();
    const { nombre, color, orden } = body;

    if (!nombre) {
      return NextResponse.json({ success: false, error: "Nombre requerido" }, { status: 400 });
    }

    const id = nombre
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "_")
      .replace(/_+/g, "_");

    const nuevoOrden = orden || etapasEnMemoria.length + 1;

    const nuevaEtapa = {
      id,
      nombre,
      color: color || "#64748B",
      orden: nuevoOrden,
      activa: true,
    };

    // Intentar guardar en la base de datos
    try {
      const { error } = await supabase
        .from("pipeline_stages")
        .insert(nuevaEtapa);

      if (error) {
        // Tabla no existe aún, usar memoria
      }
    } catch {
      // Ignorar errores
    }

    // Agregar a memoria
    etapasEnMemoria.push(nuevaEtapa);

    return NextResponse.json({ success: true, data: nuevaEtapa }, { status: 201 });
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

    // Actualizar en memoria
    const index = etapasEnMemoria.findIndex((e) => e.id === id);
    if (index !== -1) {
      if (nombre !== undefined) etapasEnMemoria[index].nombre = nombre;
      if (color !== undefined) etapasEnMemoria[index].color = color;
      if (orden !== undefined) etapasEnMemoria[index].orden = orden;
      if (activa !== undefined) etapasEnMemoria[index].activa = activa;
    }

    // Intentar actualizar en la base de datos
    try {
      const { error } = await supabase
        .from("pipeline_stages")
        .update({ nombre, color, orden, activa, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        // Error actualizando en DB
      }
    } catch {
      // Error actualizando en DB
    }

    const etapaActualizada = index !== -1 ? etapasEnMemoria[index] : { id, nombre, color, orden, activa };
    return NextResponse.json({ success: true, data: etapaActualizada });
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

    // Verificar que no sea una etapa del sistema
    const etapasSistema = ["NUEVO_LEAD", "CLIENTE_FINALIZADO"];
    if (etapasSistema.includes(id)) {
      return NextResponse.json({
        success: false,
        error: "No se pueden eliminar etapas del sistema"
      }, { status: 400 });
    }

    // Verificar que no haya leads en esta etapa
    try {
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
    } catch {
      // Ignorar errores
    }

    // Eliminar de memoria
    etapasEnMemoria = etapasEnMemoria.filter((e) => e.id !== id);

    // Intentar eliminar de la base de datos
    try {
      await supabase
        .from("pipeline_stages")
        .delete()
        .eq("id", id);
    } catch {
      // Ignorar errores
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar etapa" }, { status: 500 });
  }
}
