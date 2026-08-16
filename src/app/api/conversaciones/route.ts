import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { normalizarParticipantes } from "@/lib/permisos-conversacion";
import { COMUNICACIONES_CONFIG } from "@/modulos/comunicaciones";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  if (!COMUNICACIONES_CONFIG.permisos.ver.includes(auth.rol)) {
    return forbidden();
  }

  try {
    const { searchParams } = new URL(request.url);
    const participante = searchParams.get("participante");
    const tipo = searchParams.get("tipo");

    let query = supabase.from("conversaciones").select("*");

    if (tipo) query = query.eq("tipo", tipo);
    if (auth.rol === "SUPER_ADMIN") {
      if (participante) {
        query = query.contains("participantes", [participante]);
      }
    } else {
      query = query.contains("participantes", [auth.userId]);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Fallo la consulta:", error.message);
      return NextResponse.json({ success: false, error: "No se pudieron cargar los datos" }, { status: 500 });
    }

    const conversaciones = (data || []).map((c: Record<string, unknown>) => ({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo,
      descripcion: c.descripcion,
      participantes: normalizarParticipantes(c.participantes),
      mensajesNoLeidos: c.mensajesnoleidos || 0,
      esFijo: c.esfijo || false,
      creadoPor: c.creadopor,
      creadoEn: c.creadoen,
    }));

    return NextResponse.json({ success: true, data: conversaciones });
  } catch (e) {
    console.error("Error inesperado:", e);
    return NextResponse.json({ success: false, error: "Error al cargar los datos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  if (!COMUNICACIONES_CONFIG.permisos.enviar.includes(auth.rol)) {
    return forbidden();
  }

  try {
    const body = await request.json();
    if (!body.nombre || !Array.isArray(body.participantes)) {
      return NextResponse.json({ success: false, error: "Nombre y participantes requeridos" }, { status: 400 });
    }

    const participantes = normalizarParticipantes([
      auth.userId,
      ...body.participantes,
    ]);

    const { data, error } = await supabase
      .from("conversaciones")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        nombre: body.nombre,
        tipo: body.tipo || "DIRECTO",
        descripcion: body.descripcion || null,
        participantes,
        mensajesNoLeidos: 0,
        esFijo: body.esFijo || false,
        creadoPor: auth.userId,
        creadoEn: new Date().toISOString(),
      }))
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error al crear conversación" }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al crear conversación" }, { status: 500 });
  }
}
