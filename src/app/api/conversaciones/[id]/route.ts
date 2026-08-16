import { NextRequest, NextResponse } from "next/server";
import { supabase, fromSupabaseColumns, toSupabaseColumns } from "@/lib/supabase";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import {
  normalizarParticipantes,
  puedeAccederConversacion,
} from "@/lib/permisos-conversacion";
import { COMUNICACIONES_CONFIG } from "@/modulos/comunicaciones";

async function obtenerConversacion(id: string) {
  const { data, error } = await supabase
    .from("conversaciones")
    .select("*")
    .eq("id", id)
    .single();

  return error ? null : data;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  if (!COMUNICACIONES_CONFIG.permisos.ver.includes(auth.rol)) {
    return forbidden();
  }

  try {
    const { id } = await params;
    const data = await obtenerConversacion(id);
    if (!data) return NextResponse.json({ success: false, error: "Conversación no encontrada" }, { status: 404 });
    if (!puedeAccederConversacion(auth, data)) return forbidden();
    return NextResponse.json({ success: true, data: fromSupabaseColumns(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Error al obtener conversación" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  if (!COMUNICACIONES_CONFIG.permisos.enviar.includes(auth.rol)) {
    return forbidden();
  }

  try {
    const { id } = await params;
    const conversacion = await obtenerConversacion(id);
    if (!conversacion) {
      return NextResponse.json(
        { success: false, error: "Conversación no encontrada" },
        { status: 404 }
      );
    }
    if (!puedeAccederConversacion(auth, conversacion)) return forbidden();
    if (
      conversacion.creadopor !== auth.userId &&
      !["SUPER_ADMIN", "ADMIN"].includes(auth.rol)
    ) {
      return forbidden();
    }

    const body = await request.json();
    const camposPermitidos: Record<string, unknown> = {};
    if (body.nombre !== undefined) camposPermitidos.nombre = body.nombre;
    if (body.descripcion !== undefined) camposPermitidos.descripcion = body.descripcion;
    if (body.tipo !== undefined) camposPermitidos.tipo = body.tipo;
    if (body.esFijo !== undefined) camposPermitidos.esFijo = body.esFijo;
    if (Array.isArray(body.participantes)) {
      camposPermitidos.participantes = normalizarParticipantes([
        auth.userId,
        ...body.participantes,
      ]);
    }
    const { data, error } = await supabase
      .from("conversaciones")
      .update(toSupabaseColumns(camposPermitidos))
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  if (!COMUNICACIONES_CONFIG.permisos.eliminar.includes(auth.rol)) {
    return forbidden();
  }

  try {
    const { id } = await params;
    const { error } = await supabase.from("conversaciones").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
