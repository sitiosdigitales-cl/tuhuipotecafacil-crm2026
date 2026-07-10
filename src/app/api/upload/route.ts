import { NextRequest, NextResponse } from "next/server";


// Endpoint de upload - guarda referencia en Supabase, archivo en localStorage del cliente
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const archivo = formData.get("archivo") as File;
    const leadId = formData.get("leadId") as string;
    const tipo = formData.get("tipo") as string;

    if (!archivo || !leadId) {
      return NextResponse.json({ success: false, error: "Archivo y leadId requeridos" }, { status: 400 });
    }

    // Validar tamaÃ±o (max 10MB)
    if (archivo.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "El archivo supera los 10MB" }, { status: 400 });
    }

    // Validar tipo de archivo
    const tiposPermitidos = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!tiposPermitidos.includes(archivo.type)) {
      return NextResponse.json({ success: false, error: "Tipo de archivo no permitido" }, { status: 400 });
    }

    // Generar ID Ãºnico para el documento
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      data: {
        id: docId,
        nombre: archivo.name,
        tipo: tipo || "documento",
        tamano: archivo.size,
        fechaSubida: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error en upload:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
