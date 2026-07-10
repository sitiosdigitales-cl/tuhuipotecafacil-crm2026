import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";

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

    // Subir archivo a Supabase Storage
    const docId = crypto.randomUUID();
    const extension = archivo.name.split(".").pop() || "bin";
    const filePath = `${leadId}/${docId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(filePath, archivo, { contentType: archivo.type });

    if (uploadError) {
      console.error("Error subiendo archivo:", uploadError);
      return NextResponse.json({ success: false, error: "Error al subir archivo" }, { status: 500 });
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(filePath);

    // Guardar referencia en la tabla documentos
    const { error: dbError } = await supabase.from("documentos").insert(toSupabaseColumns({
      id: docId,
      leadId,
      nombre: archivo.name,
      tipo: tipo || "OTRO",
      estado: "PENDIENTE",
      archivoUrl: urlData?.publicUrl || null,
      creadoEn: new Date().toISOString(),
    }));

    if (dbError) {
      console.error("Error guardando referencia:", dbError);
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
    console.error("Error en upload:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
