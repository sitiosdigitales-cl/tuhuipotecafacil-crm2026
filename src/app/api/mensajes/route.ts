import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { puedeAccederConversacion } from "@/lib/permisos-conversacion";
import { COMUNICACIONES_CONFIG } from "@/modulos/comunicaciones";
import type { TokenPayload } from "@/lib/jwt";

const TIPOS_MENSAJE = new Set(["TEXTO", "ARCHIVO", "IMAGEN"]);

async function obtenerConversacion(id: string) {
  const { data, error } = await supabase
    .from("conversaciones")
    .select("id,participantes")
    .eq("id", id)
    .single();

  return error ? null : data;
}

async function obtenerNombreRemitente(auth: TokenPayload): Promise<string> {
  const { data } = await supabase
    .from("usuarios")
    .select("nombre,apellido")
    .eq("id", auth.userId)
    .single();

  const nombre = [data?.nombre, data?.apellido]
    .filter((parte): parte is string => typeof parte === "string" && parte.length > 0)
    .join(" ")
    .trim();

  return nombre || auth.email;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!COMUNICACIONES_CONFIG.permisos.ver.includes(auth.rol)) {
    return forbidden();
  }

  try {
    const { searchParams } = new URL(request.url);
    const conversacionId = searchParams.get("conversacionId");
    const limiteSolicitado = Number.parseInt(searchParams.get("limite") || "50", 10);
    const limite = Number.isFinite(limiteSolicitado)
      ? Math.min(Math.max(limiteSolicitado, 1), 100)
      : 50;

    if (!conversacionId) {
      return NextResponse.json(
        { success: false, error: "Conversación requerida" },
        { status: 400 }
      );
    }

    const conversacion = await obtenerConversacion(conversacionId);
    if (!conversacion) {
      return NextResponse.json(
        { success: false, error: "Conversación no encontrada" },
        { status: 404 }
      );
    }
    if (!puedeAccederConversacion(auth, conversacion)) return forbidden();

    const { data, error } = await supabase
      .from("mensajes")
      .select("*")
      .eq("conversacionid", conversacionId)
      .order("creadoen", { ascending: true })
      .limit(limite);

    if (error) {
      console.error("Fallo la consulta:", error.message);
      return NextResponse.json({ success: false, error: "No se pudieron cargar los datos" }, { status: 500 });
    }

    const mensajes = (data || []).map((m: Record<string, unknown>) => ({
      id: m.id,
      conversacionId: m.conversacionid,
      remitenteId: m.remitenteid,
      remitenteNombre: m.remitentenombre,
      contenido: m.contenido,
      tipo: m.tipo || "TEXTO",
      estado: m.estado || "ENVIADO",
      archivoUrl: m.archivourl,
      creadoEn: m.creadoen,
    }));

    return NextResponse.json({ success: true, data: mensajes });
  } catch (e) {
    console.error("Error inesperado:", e);
    return NextResponse.json({ success: false, error: "Error al cargar los datos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!COMUNICACIONES_CONFIG.permisos.enviar.includes(auth.rol)) {
    return forbidden();
  }

  try {
    const body = await request.json();
    const contenido =
      typeof body.contenido === "string" ? body.contenido.trim() : "";
    if (!body.conversacionId || !contenido || contenido.length > 10_000) {
      return NextResponse.json({ success: false, error: "Campos requeridos faltantes" }, { status: 400 });
    }

    const conversacion = await obtenerConversacion(body.conversacionId);
    if (!conversacion) {
      return NextResponse.json(
        { success: false, error: "Conversación no encontrada" },
        { status: 404 }
      );
    }
    if (!puedeAccederConversacion(auth, conversacion)) return forbidden();

    const remitenteNombre = await obtenerNombreRemitente(auth);
    const tipo = TIPOS_MENSAJE.has(body.tipo) ? body.tipo : "TEXTO";

    const { data, error } = await supabase
      .from("mensajes")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        conversacionId: body.conversacionId,
        remitenteId: auth.userId,
        remitenteNombre,
        contenido,
        tipo,
        estado: "ENVIADO",
        archivoUrl: body.archivoUrl || null,
        creadoEn: new Date().toISOString(),
      }))
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error al enviar mensaje" }, { status: 500 });

    // Notificación de nuevo mensaje
    try {
      await supabase.from("notificaciones").insert({
        id: crypto.randomUUID(),
        tipo: "mensaje",
        titulo: "Nuevo mensaje",
        descripcion: `${remitenteNombre} envió un mensaje`,
        leida: false,
        accionurl: `/conversaciones`,
        creadoen: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al enviar mensaje" }, { status: 500 });
  }
}
