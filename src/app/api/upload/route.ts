import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const archivo = formData.get("archivo") as File;
    const leadId = formData.get("leadId") as string;
    const tipo = formData.get("tipo") as string;

    if (!archivo || !leadId) {
      return NextResponse.json({ success: false, error: "Archivo y leadId requeridos" }, { status: 400 });
    }

    // Crear nombre de archivo único
    const nombreArchivo = `${leadId}/${tipo || "documento"}_${Date.now()}_${archivo.name}`;
    
    // Convertir File a ArrayBuffer
    const buffer = await archivo.arrayBuffer();
    
    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from("documentos")
      .upload(nombreArchivo, buffer, {
        contentType: archivo.type,
        upsert: true,
      });

    if (error) {
      console.error("Error al subir archivo:", error);
      return NextResponse.json({ success: false, error: "Error al subir archivo" }, { status: 500 });
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from("documentos")
      .getPublicUrl(nombreArchivo);

    // Guardar referencia en la tabla de documentos
    const { error: dbError } = await supabase.from("documentos").insert({
      leadid: leadId,
      nombre: archivo.name,
      tipo: tipo || "documento",
      estado: "pendiente",
      archivourl: urlData.publicUrl,
      tamano: archivo.size,
    });

    if (dbError) {
      console.error("Error al guardar referencia:", dbError);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: nombreArchivo,
        nombre: archivo.name,
        url: urlData.publicUrl,
        tamano: archivo.size,
      },
    });
  } catch (error) {
    console.error("Error en upload:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
