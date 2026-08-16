import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { puedeAccederLead } from "@/lib/permisos-lead";
import type { TokenPayload } from "@/lib/jwt";

async function obtenerLead(leadId: string) {
  const { data, error } = await supabase
    .from("leads")
    .select("id,email,asignadoa")
    .eq("id", leadId)
    .single();

  return error ? null : data;
}

async function obtenerIdsLeadsPermitidos(
  auth: TokenPayload
): Promise<string[] | null> {
  if (["SUPER_ADMIN", "ADMIN", "EJECUTIVO"].includes(auth.rol)) {
    return null;
  }

  let query = supabase.from("leads").select("id");
  if (auth.rol === "AGENTE") {
    query = query.eq("asignadoa", auth.userId);
  } else if (auth.rol === "CLIENTE") {
    query = query.eq("email", auth.email.toLowerCase());
  } else {
    return [];
  }

  const { data, error } = await query;
  if (error) throw new Error("No se pudo resolver la cartera de actividades");
  return (data ?? []).map((lead) => lead.id);
}

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
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");
    const limitSolicitado = Number(searchParams.get("limit") || "50");
    const limit = Number.isInteger(limitSolicitado) && limitSolicitado > 0
      ? Math.min(limitSolicitado, 200)
      : 50;

    if (leadId) {
      const lead = await obtenerLead(leadId);
      if (!lead) {
        return NextResponse.json(
          { success: false, error: "Lead no encontrado" },
          { status: 404 }
        );
      }
      if (!puedeAccederLead(auth, lead)) return forbidden();
    }

    let query = supabase.from("actividades").select("*");

    if (leadId) {
      query = query.eq("leadid", leadId);
    } else {
      const idsPermitidos = await obtenerIdsLeadsPermitidos(auth);
      if (idsPermitidos !== null) {
        if (idsPermitidos.length === 0) {
          return NextResponse.json({ success: true, data: [] });
        }
        query = query.in("leadid", idsPermitidos);
      }
    }

    query = query.order("fecha", { ascending: false }).limit(limit);

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
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  try {
    const body = await request.json();
    const { leadId, tipo, titulo, descripcion, usuario, usuarioId, metadata } = body;

    if (!leadId || !tipo || !titulo) {
      return NextResponse.json({ success: false, error: "leadId, tipo y titulo requeridos" }, { status: 400 });
    }

    const lead = await obtenerLead(leadId);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead no encontrado" },
        { status: 404 }
      );
    }
    if (!puedeAccederLead(auth, lead)) return forbidden();

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
