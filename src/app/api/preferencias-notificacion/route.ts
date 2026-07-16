import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuarioId") || auth.userId;

    const { data, error } = await supabase
      .from("preferencias_notificacion")
      .select("*")
      .eq("usuario_id", usuarioId);

    if (error) {
      // Si la tabla no existe, devolver preferencias por defecto
      return NextResponse.json({ success: true, data: getDefaultPreferences(usuarioId) });
    }

    // Si no hay datos, devolver defaults
    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, data: getDefaultPreferences(usuarioId) });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth) return unauthorized();

    const body = await request.json();
    const { preferencias } = body;

    if (!Array.isArray(preferencias)) {
      return NextResponse.json(
        { success: false, error: "preferencias debe ser un array" },
        { status: 400 }
      );
    }

    const usuarioId = auth.userId;

    // Eliminar preferencias existentes del usuario
    await supabase
      .from("preferencias_notificacion")
      .delete()
      .eq("usuario_id", usuarioId);

    // Insertar nuevas preferencias
    if (preferencias.length > 0) {
      const rows = preferencias.map((p: any) => ({
        id: crypto.randomUUID(),
        usuario_id: usuarioId,
        canal: p.canal,
        evento: p.evento,
        habilitado: p.habilitado ?? true,
        creado_en: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("preferencias_notificacion")
        .insert(rows);

      if (error) {
        console.error("Error guardando preferencias:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al guardar preferencias" },
      { status: 500 }
    );
  }
}

// Preferencias por defecto (cuando la tabla no existe o no hay datos)
function getDefaultPreferences(usuarioId: string) {
  const eventos = [
    "documento_subido", "documento_estado", "documento_version",
    "lead_nuevo", "lead_etapa", "lead_asignado",
    "tarea_asignada", "tarea_vencida", "tarea_completada",
    "mensaje", "sistema",
  ];
  const canales = ["in_app", "email", "whatsapp"];

  const prefs: any[] = [];
  for (const evento of eventos) {
    for (const canal of canales) {
      prefs.push({
        id: "default_" + evento + "_" + canal,
        usuario_id: usuarioId,
        canal,
        evento,
        habilitado: true,
      });
    }
  }
  return prefs;
}
