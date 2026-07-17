import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";

// POST /api/portal/upload - Upload endpoint público para el portal del cliente
// No requiere autenticación - el cliente accede con su RUT
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const archivo = formData.get("archivo") as File;
    const leadId = formData.get("leadId") as string;
    const tipo = formData.get("tipo") as string;

    if (!archivo || !leadId) {
      return NextResponse.json({ success: false, error: "Archivo y leadId requeridos" }, { status: 400 });
    }

    if (archivo.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "El archivo supera los 10MB" }, { status: 400 });
    }

    const tiposPermitidos = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!tiposPermitidos.includes(archivo.type)) {
      return NextResponse.json({ success: false, error: "Tipo de archivo no permitido" }, { status: 400 });
    }

    // Verificar que el lead existe
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, nombre, apellido")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ success: false, error: "Lead no encontrado" }, { status: 404 });
    }

    // Subir archivo a Supabase Storage
    const docId = crypto.randomUUID();
    const extension = archivo.name.split(".").pop() || "bin";
    const filePath = leadId + "/" + docId + "." + extension;

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(filePath, archivo, { contentType: archivo.type });

    if (uploadError) {
      console.error("Error subiendo archivo:", uploadError);
      return NextResponse.json({ success: false, error: "Error al subir archivo" }, { status: 500 });
    }

    // Obtener URL publica
    const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(filePath);

    // Guardar referencia en la tabla documentos
    const { error: dbError } = await supabase.from("documentos").insert(toSupabaseColumns({
      id: docId,
      leadId,
      leadNombre: `${lead.nombre} ${lead.apellido || ""}`.trim(),
      nombre: archivo.name,
      tipo: tipo || "OTRO",
      estado: "PENDIENTE",
      archivoUrl: urlData?.publicUrl || null,
      creadoEn: new Date().toISOString(),
    }));

    if (dbError) {
      console.error("Error guardando referencia en DB:", JSON.stringify(dbError));
      // Retornar el error para debug
      return NextResponse.json({
        success: false,
        error: `Archivo subido pero error guardando registro: ${dbError.message || dbError.code || "unknown"}`,
        storageUrl: urlData?.publicUrl,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: docId,
        nombre: archivo.name,
        tipo: tipo || "documento",
        tamano: archivo.size,
        archivoUrl: urlData?.publicUrl || null,
        fechaSubida: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error en portal upload:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
