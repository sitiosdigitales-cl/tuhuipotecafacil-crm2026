import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseColumns } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { despacharNotificacion } from "@/lib/dispatcher-notificaciones";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const { id } = await params;
    const { data, error } = await supabase.from("documentos").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ success: true, data: fromSupabaseColumns(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const { id } = await params;
    const body = await request.json();
    const { data, error } = await supabase
      .from("documentos")
      .update(toSupabaseColumns(body))
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });

    // Notificacion si cambio el estado del documento
    if (body.estado && data) {
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
        descripcion: data.nombre + " esta " + (estadoLabels[body.estado] || body.estado),
        accionUrl: "/documentos",
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: fromSupabaseColumns(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const { id } = await params;
    
    // Obtener el documento para saber la URL del archivo
    const { data: doc } = await supabase
      .from("documentos")
      .select("archivourl")
      .eq("id", id)
      .single();
    
    // Eliminar archivo de Storage si existe
    if (doc?.archivourl) {
      const filePath = doc.archivourl.split("/documentos/")[1];
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