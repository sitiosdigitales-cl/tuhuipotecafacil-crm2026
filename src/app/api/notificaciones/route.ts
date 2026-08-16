import { NextRequest, NextResponse } from "next/server";

import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { puedeAccederLead } from "@/lib/permisos-lead";
import { supabase, toSupabaseColumns } from "@/lib/supabase";

const ROLES_CREACION = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "EJECUTIVO",
  "AGENTE",
]);
const TYPE_PATTERN = /^[a-z_]{1,50}$/;

function badRequest(error: string) {
  return NextResponse.json({ success: false, error }, { status: 400 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number
): string | null {
  const value = body[field];
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) return null;
  return normalized;
}

function getOptionalText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number
): string | undefined | null {
  if (body[field] === undefined || body[field] === null) return undefined;
  return getText(body, field, maxLength);
}

async function readBody(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number.parseInt(searchParams.get("limit") ?? "50", 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 50;
  const soloNoLeidas = searchParams.get("noLeidas") === "true";

  let query = supabase
    .from("notificaciones")
    .select("*")
    .eq("usuarioid", auth.userId)
    .order("creadoen", { ascending: false });
  if (soloNoLeidas) query = query.eq("leida", false);

  const { data, error } = await query.limit(limit);
  if (error) {
    console.error("No se pudieron cargar las notificaciones:", error.message);
    return NextResponse.json(
      { success: false, error: "No se pudieron cargar las notificaciones" },
      { status: 500 }
    );
  }

  const notifications = (data || []).map((notification: Record<string, unknown>) => ({
    id: notification.id,
    tipo: notification.tipo,
    titulo: notification.titulo,
    descripcion: notification.descripcion,
    leida: notification.leida,
    fecha: notification.creadoen,
    usuarioId: notification.usuarioid,
    leadId: notification.leadid,
    accionUrl: notification.accionurl,
  }));
  return NextResponse.json({ success: true, data: notifications });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  if (!ROLES_CREACION.has(auth.rol)) return forbidden();

  const body = await readBody(request);
  if (!body) return badRequest("Solicitud inválida");

  const tipo = getText(body, "tipo", 50);
  const titulo = getText(body, "titulo", 200);
  const descripcion = getOptionalText(body, "descripcion", 2_000);
  const leadId = getOptionalText(body, "leadId", 128);
  const accionUrl = getOptionalText(body, "accionUrl", 500);
  if (
    !tipo ||
    !TYPE_PATTERN.test(tipo) ||
    !titulo ||
    descripcion === null ||
    leadId === null ||
    accionUrl === null ||
    (accionUrl !== undefined &&
      (!accionUrl.startsWith("/") || accionUrl.startsWith("//")))
  ) {
    return badRequest("Datos de notificación no válidos");
  }

  if (leadId) {
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, asignadoa, email")
      .eq("id", leadId)
      .single();
    if (leadError || !lead) {
      return NextResponse.json(
        { success: false, error: "Lead no encontrado" },
        { status: 404 }
      );
    }
    if (!puedeAccederLead(auth, lead)) return forbidden();
  }

  const { data, error } = await supabase
    .from("notificaciones")
    .insert(
      toSupabaseColumns({
        id: crypto.randomUUID(),
        tipo,
        titulo,
        descripcion: descripcion ?? "",
        leida: false,
        usuarioId: auth.userId,
        leadId: leadId ?? null,
        accionUrl: accionUrl ?? null,
        creadoEn: new Date().toISOString(),
      })
    )
    .select()
    .single();
  if (error) {
    return NextResponse.json(
      { success: false, error: "No se pudo crear la notificación" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();

  const body = await readBody(request);
  if (!body) return badRequest("Solicitud inválida");

  let query = supabase.from("notificaciones").update({ leida: true });
  if (body.marcarTodas === true) {
    query = query.eq("usuarioid", auth.userId).eq("leida", false);
  } else {
    const id = getText(body, "id", 128);
    if (!id) return badRequest("id requerido");
    query = query.eq("id", id).eq("usuarioid", auth.userId);
  }

  const { error } = await query;
  if (error) {
    return NextResponse.json(
      { success: false, error: "No se pudo actualizar la notificación" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id || id.length > 128) return badRequest("id requerido");

  const { error } = await supabase
    .from("notificaciones")
    .delete()
    .eq("id", id)
    .eq("usuarioid", auth.userId);
  if (error) {
    return NextResponse.json(
      { success: false, error: "No se pudo eliminar la notificación" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
