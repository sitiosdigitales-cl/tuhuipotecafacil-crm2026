import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

function serializarActividad(actividad: Record<string, unknown>) {
  return {
    id: actividad.id,
    leadId: actividad.leadid,
    tipo: actividad.tipo,
    titulo: actividad.titulo,
    descripcion: actividad.descripcion,
    fecha: actividad.fecha,
    usuario: actividad.usuario,
    usuarioId: actividad.usuarioid,
    metadata: actividad.metadata,
  };
}

export async function GET(request: NextRequest) {
  if (!(await requireAuth(request))) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase.from("actividades").select("*").order("fecha", { ascending: false }).limit(limit);

    if (leadId) {
      query = query.eq("leadid", leadId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Fallo la consulta:", error.message);
      return NextResponse.json({ success: false, error: "No se pudieron cargar los datos" }, { status: 500 });
    }

    const actividades = (data || []).map(serializarActividad);

    return NextResponse.json({ success: true, data: actividades });
  } catch (e) {
    console.error("Error inesperado:", e);
    return NextResponse.json({ success: false, error: "Error al cargar los datos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAuth(request))) return unauthorized();
  try {
    const body = await request.json();
    const { leadId, tipo, titulo, descripcion, usuario, usuarioId, metadata } = body;

    if (!leadId || !tipo || !titulo) {
      return NextResponse.json({ success: false, error: "leadId, tipo y titulo requeridos" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("actividades")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        leadId,
        tipo,
        titulo,
        descripcion: descripcion || "",
        fecha: new Date().toISOString(),
        usuario: usuario || "Sistema",
        usuarioId: usuarioId || null,
        metadata: metadata || {},
      }))
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Error al crear actividad" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: true, data: serializarActividad(data) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ success: false, error: "Error al crear actividad" }, { status: 500 });
  }
}
