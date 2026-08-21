import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseColumns } from "@/lib/supabase";
import { requireAuth, unauthorized, forbidden } from "@/lib/api-auth";
import { puedeAccederLead } from "@/lib/permisos-lead";
import { despacharNotificacion } from "@/lib/dispatcher-notificaciones";
import { parseBoundedJson, RequestPayloadError } from "@/lib/request-json";
import {
  documentStoragePath,
  documentWithProxyUrl,
} from "@/lib/document-storage";
import { z } from "zod";

const ROLES_GESTION_DOCUMENTOS = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "EJECUTIVO",
  "AGENTE",
]);
const MAX_DOCUMENT_UPDATE_BYTES = 8 * 1024;
const ActualizarDocumentoSchema = z
  .object({
    aprobadoEn: z.string().max(100).optional(),
    aprobadoPor: z.string().max(128).optional(),
    archivoUrl: z.string().max(2_000).optional(),
    estado: z.enum(["PENDIENTE", "EN_REVISION", "APROBADO", "RECHAZADO"]),
    nombre: z.string().max(300).optional(),
    observaciones: z.string().max(2_000).optional(),
  })
  .strict();

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

    let rawBody: unknown;
    try {
      rawBody = await parseBoundedJson(request, MAX_DOCUMENT_UPDATE_BYTES);
    } catch (error) {
      if (error instanceof RequestPayloadError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.status }
        );
      }
      throw error;
    }
    const parsedBody = ActualizarDocumentoSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: "Datos de documento inválidos" },
        { status: 400 }
      );
    }
    const body = parsedBody.data;
    const estado = body.estado;
    const updateData: Record<string, unknown> = {
      aprobadoEn: estado === "APROBADO" ? new Date().toISOString() : null,
      aprobadoPor: estado === "APROBADO" ? auth.userId : null,
      estado,
    };
    if (body.observaciones !== undefined) {
      updateData.observaciones = body.observaciones.trim() || null;
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
