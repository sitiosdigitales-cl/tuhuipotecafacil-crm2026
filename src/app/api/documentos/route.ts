import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray } from "@/lib/supabase";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { despacharNotificacion } from "@/lib/dispatcher-notificaciones";
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
  if (error) throw new Error("No se pudo resolver la cartera de documentos");
  return (data ?? []).map((lead) => lead.id);
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");

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

    let query = supabase.from("documentos").select("*");
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

    const { data, error } = await query;
    if (error) {
      console.error("Fallo la consulta:", error.message);
      return NextResponse.json({ success: false, error: "No se pudieron cargar los datos" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: fromSupabaseArray(data || []) });
  } catch (e) {
    console.error("Error inesperado:", e);
    return NextResponse.json({ success: false, error: "Error al cargar los datos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  try {
    const body = await request.json();
    if (typeof body.leadId !== "string" || !body.leadId) {
      return NextResponse.json(
        { success: false, error: "leadId es requerido" },
        { status: 400 }
      );
    }

    const lead = await obtenerLead(body.leadId);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead no encontrado" },
        { status: 404 }
      );
    }
    if (!puedeAccederLead(auth, lead)) return forbidden();

    const { data, error } = await supabase
      .from("documentos")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        leadId: body.leadId,
        nombre: body.nombre,
        tipo: body.tipo || "OTRO",
        // Un documento recién subido siempre nace PENDIENTE. Antes se copiaba
        // `body.estado`, así que bastaba enviar "APROBADO" para que entrara ya
        // revisado. Aprobar es una decisión de una persona y va por el PUT,
        // que sí comprueba quién la toma.
        estado: "PENDIENTE",
        archivoUrl: body.archivoUrl || null,
        creadoEn: new Date().toISOString(),
      }))
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: "Error al crear documento" }, { status: 500 });

    // Notificacion via dispatcher (ejecutivo + SUPER_ADMIN)
    despacharNotificacion({
      evento: "documento_subido",
      leadId: body.leadId,
      titulo: "Documento recibido",
      descripcion: `Nuevo documento: ${body.nombre}`,
      accionUrl: "/documentos",
    }).catch(() => {});

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al crear documento" }, { status: 500 });
  }
}
