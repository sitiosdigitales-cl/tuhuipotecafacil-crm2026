import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { puedeAccederConversacion } from "@/lib/permisos-conversacion";
import { COMUNICACIONES_CONFIG } from "@/modulos/comunicaciones";

async function obtenerMensaje(id: string) {
  const { data, error } = await supabase
    .from("mensajes")
    .select("*")
    .eq("id", id)
    .single();

  return error ? null : data;
}

async function obtenerConversacion(id: string) {
  const { data, error } = await supabase
    .from("conversaciones")
    .select("id,participantes")
    .eq("id", id)
    .single();

  return error ? null : data;
}

function normalizarReacciones(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([emoji, usuarios]) =>
      Array.isArray(usuarios)
        ? [[emoji, usuarios.filter((usuario): usuario is string => typeof usuario === "string")]]
        : []
    )
  );
}

// PUT /api/mensajes/[id] — Actualizar mensaje (contenido, reacciones, respondiendoA)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  if (!COMUNICACIONES_CONFIG.permisos.enviar.includes(auth.rol)) {
    return forbidden();
  }

  try {
    const { id } = await params;
    const mensaje = await obtenerMensaje(id);
    if (!mensaje) {
      return NextResponse.json(
        { success: false, error: "Mensaje no encontrado" },
        { status: 404 }
      );
    }
    const conversacion = await obtenerConversacion(mensaje.conversacionid);
    if (!conversacion || !puedeAccederConversacion(auth, conversacion)) {
      return forbidden();
    }

    const body = await request.json();
    const camposPermitidos: Record<string, unknown> = {};

    if (body.contenido !== undefined) {
      const puedeEditarContenido =
        mensaje.remitenteid === auth.userId ||
        COMUNICACIONES_CONFIG.permisos.eliminar.includes(auth.rol);
      if (!puedeEditarContenido) return forbidden();

      const contenido =
        typeof body.contenido === "string" ? body.contenido.trim() : "";
      if (!contenido || contenido.length > 10_000) {
        return NextResponse.json(
          { success: false, error: "Contenido inválido" },
          { status: 400 }
        );
      }
      camposPermitidos.contenido = contenido;
    }

    if (body.emoji !== undefined) {
      if (typeof body.emoji !== "string" || body.emoji.length > 16) {
        return NextResponse.json(
          { success: false, error: "Reacción inválida" },
          { status: 400 }
        );
      }

      const reacciones = normalizarReacciones(mensaje.reacciones);
      const usuarios = reacciones[body.emoji] || [];
      if (usuarios.includes(auth.userId)) {
        reacciones[body.emoji] = usuarios.filter(
          (usuario) => usuario !== auth.userId
        );
        if (reacciones[body.emoji].length === 0) delete reacciones[body.emoji];
      } else {
        reacciones[body.emoji] = [...usuarios, auth.userId];
      }
      camposPermitidos.reacciones = reacciones;
    }

    if (Object.keys(camposPermitidos).length === 0) {
      return NextResponse.json(
        { success: false, error: "No hay cambios válidos" },
        { status: 400 }
      );
    }
    camposPermitidos.editadoen = new Date().toISOString();

    const { data, error } = await supabase
      .from("mensajes")
      .update(camposPermitidos)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error al actualizar mensaje" }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar mensaje" }, { status: 500 });
  }
}

// DELETE /api/mensajes/[id] — Eliminar mensaje (soft delete: contenido vacío + tipo SISTEMA)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  if (!COMUNICACIONES_CONFIG.permisos.enviar.includes(auth.rol)) {
    return forbidden();
  }

  try {
    const { id } = await params;
    const mensaje = await obtenerMensaje(id);
    if (!mensaje) {
      return NextResponse.json(
        { success: false, error: "Mensaje no encontrado" },
        { status: 404 }
      );
    }
    const conversacion = await obtenerConversacion(mensaje.conversacionid);
    if (!conversacion || !puedeAccederConversacion(auth, conversacion)) {
      return forbidden();
    }
    if (
      mensaje.remitenteid !== auth.userId &&
      !COMUNICACIONES_CONFIG.permisos.eliminar.includes(auth.rol)
    ) {
      return forbidden();
    }

    const { data, error } = await supabase
      .from("mensajes")
      .update({ contenido: "[Mensaje eliminado]", tipo: "SISTEMA", editadoen: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error al eliminar mensaje" }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar mensaje" }, { status: 500 });
  }
}
