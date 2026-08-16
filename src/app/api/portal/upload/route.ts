import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import { requireAuth, unauthorized, forbidden } from "@/lib/api-auth";
import { puedeAccederLead } from "@/lib/permisos-lead";
import {
  documentContentMatchesMimeType,
  documentExtension,
  documentProxyUrl,
} from "@/lib/document-storage";

// POST /api/portal/upload - Subida de documentos desde el portal del cliente.
//
// Antes era público: bastaba conocer un leadId para escribir en el bucket de
// documentos de cualquier persona. El RUT no sirve como credencial, en Chile
// es un dato que cualquiera puede obtener o deducir.
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  try {
    const formData = await request.formData();
    const archivo = formData.get("archivo");
    const leadId = formData.get("leadId");
    const tipo = formData.get("tipo");

    if (!(archivo instanceof File) || typeof leadId !== "string" || !leadId.trim()) {
      return NextResponse.json({ success: false, error: "Archivo y leadId requeridos" }, { status: 400 });
    }

    if (archivo.size === 0 || archivo.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "El archivo supera los 10MB" }, { status: 400 });
    }

    const extension = documentExtension(archivo.type);
    if (!extension) {
      return NextResponse.json({ success: false, error: "Tipo de archivo no permitido" }, { status: 400 });
    }
    if (!(await documentContentMatchesMimeType(archivo))) {
      return NextResponse.json(
        { success: false, error: "El contenido no corresponde al tipo de archivo" },
        { status: 400 }
      );
    }
    const nombreArchivo = archivo.name.trim().replace(/[\u0000-\u001f\u007f]/g, "");
    if (!nombreArchivo || nombreArchivo.length > 255) {
      return NextResponse.json({ success: false, error: "Nombre de archivo no válido" }, { status: 400 });
    }

    // Verificar que el lead existe y que quien sube puede tocarlo
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, nombre, apellido, asignadoa, email")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ success: false, error: "Lead no encontrado" }, { status: 404 });
    }
    if (!puedeAccederLead(auth, lead)) return forbidden();

    // Subir archivo a Supabase Storage
    const docId = crypto.randomUUID();
    const filePath = leadId + "/" + docId + "." + extension;

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(filePath, archivo, { contentType: archivo.type });

    if (uploadError) {
      console.error("Error subiendo archivo:", uploadError);
      return NextResponse.json({ success: false, error: "Error al subir archivo" }, { status: 500 });
    }

    // Guardar referencia en la tabla documentos
    const { error: dbError } = await supabase.from("documentos").insert(toSupabaseColumns({
      id: docId,
      leadId,
      nombre: nombreArchivo,
      tipo: typeof tipo === "string" && tipo ? tipo : "OTRO",
      estado: "PENDIENTE",
      archivoUrl: filePath,
      creadoEn: new Date().toISOString(),
    }));

    if (dbError) {
      console.error("Error guardando referencia en DB:", JSON.stringify(dbError));
      await supabase.storage.from("documentos").remove([filePath]);
      return NextResponse.json(
        { success: false, error: "Error al guardar documento" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: docId,
        nombre: nombreArchivo,
        tipo: typeof tipo === "string" && tipo ? tipo : "documento",
        tamano: archivo.size,
        archivoUrl: documentProxyUrl(docId, filePath),
        fechaSubida: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error en portal upload:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
