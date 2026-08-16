import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseColumns } from "@/lib/supabase";
import { requireAuth, unauthorized, forbidden } from "@/lib/api-auth";
import { puedeAccederLead } from "@/lib/permisos-lead";
import { despacharNotificacion } from "@/lib/dispatcher-notificaciones";
import {
  documentStoragePath,
  documentWithProxyUrl,
} from "@/lib/document-storage";

const ROLES_GESTION_DOCUMENTOS = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "EJECUTIVO",
  "AGENTE",
]);
const ESTADOS_DOCUMENTO = new Set([
  "PENDIENTE",
  "EN_REVISION",
  "APROBADO",
  "RECHAZADO",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function obtenerDocumentoYLead(id: string) {
  const { data: documento, error } = await supabase
    .from("documentos")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !documento) return { documento: null, lead: null };

  const { data: lead } = await supabase
    .from("leads")
    .select("email, asignadoa")
    .eq("id", documento.leadid)
    .single();

  return { documento, lead };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  try {
    const { id } = await params;
    const { documento, lead } = await obtenerDocumentoYLead(id);
    if (!documento) {
      return NextResponse.json(
        { success: false, error: "No encontrado" },
        { status: 404 }
      );
    }
    if (!lead || !puedeAccederLead(auth, lead)) return forbidden();
    return NextResponse.json({
      success: true,
      data: documentWithProxyUrl(fromSupabaseColumns(documento)),
    });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!ROLES_GESTION_DOCUMENTOS.has(auth.rol)) return forbidden();
  try {
    const { id } = await params;
    const { documento, lead } = await obtenerDocumentoYLead(id);
    if (!documento) {
      return NextResponse.json(
        { success: false, error: "Documento no encontrado" },
        { status: 404 }
      );
    }
    if (!lead || !puedeAccederLead(auth, lead)) return forbidden();

    const parsedBody: unknown = await request.json();
    if (!isRecord(parsedBody) || !ESTADOS_DOCUMENTO.has(String(parsedBody.estado))) {
      return NextResponse.json(
        { success: false, error: "Estado de documento inválido" },
        { status: 400 }
      );
    }

    if (
      parsedBody.observaciones !== undefined &&
      (typeof parsedBody.observaciones !== "string" ||
        parsedBody.observaciones.length > 2_000)
    ) {
      return NextResponse.json(
        { success: false, error: "Observaciones inválidas" },
        { status: 400 }
      );
    }

    const estado = String(parsedBody.estado);
    const updateData: Record<string, unknown> = {
      aprobadoEn: estado === "APROBADO" ? new Date().toISOString() : null,
      aprobadoPor: estado === "APROBADO" ? auth.userId : null,
      estado,
    };
    if (typeof parsedBody.observaciones === "string") {
      updateData.observaciones = parsedBody.observaciones.trim() || null;
    }

    const { data, error } = await supabase
      .from("documentos")
      .update(toSupabaseColumns(updateData))
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });

    // Notificacion si cambio el estado del documento
    if (data) {
      const estadoLabels: Record<string, string> = {
        APROBADO: "aprobado",
        RECHAZADO: "rechazado",
        EN_REVISION: "en revision",
        PENDIENTE: "pendiente",
      };
      despacharNotificacion({
        evento: "documento_estado",
        leadId: data.leadid,
        titulo: "Estado de documento actualizado",
        descripcion: data.nombre + " esta " + (estadoLabels[estado] || estado),
        accionUrl: "/documentos",
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: documentWithProxyUrl(fromSupabaseColumns(data)),
    });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!ROLES_GESTION_DOCUMENTOS.has(auth.rol)) return forbidden();
  try {
    const { id } = await params;

    // Obtener el documento para saber la URL del archivo y a qué lead pertenece
    const { data: doc } = await supabase
      .from("documentos")
      .select("archivourl, leadid")
      .eq("id", id)
      .single();

    if (!doc) {
      return NextResponse.json({ success: false, error: "Documento no encontrado" }, { status: 404 });
    }

    // El permiso lo define el lead dueño del documento, y se comprueba ANTES
    // de borrar del bucket: un archivo eliminado no se recupera.
    const { data: lead } = await supabase
      .from("leads")
      .select("email, asignadoa")
      .eq("id", doc.leadid)
      .single();
    if (!lead || !puedeAccederLead(auth, lead)) return forbidden();

    // Eliminar archivo de Storage si existe
    if (doc?.archivourl) {
      const filePath = documentStoragePath(doc.archivourl);
      if (filePath) {
        await supabase.storage.from("documentos").remove([filePath]);
      }
    }
    
    // Eliminar el registro de la DB
    const { error } = await supabase.from("documentos").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
