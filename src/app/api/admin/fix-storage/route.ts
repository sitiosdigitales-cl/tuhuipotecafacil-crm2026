import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/admin/fix-storage - Arregla permisos del bucket documentos
export async function POST(request: NextRequest) {
  try {
    // Usar service role key para tener permisos de admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: "Falta SUPABASE_SERVICE_ROLE_KEY en variables de entorno"
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Verificar si el bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      return NextResponse.json({ success: false, error: "Error listando buckets: " + listError.message }, { status: 500 });
    }

    const bucketExists = buckets?.some(b => b.id === "documentos");

    // 2. Crear bucket si no existe
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket("documentos", {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/jpg", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      });
      if (createError) {
        return NextResponse.json({ success: false, error: "Error creando bucket: " + createError.message }, { status: 500 });
      }
    }

    // 3. Hacer público el bucket
    const { error: updateError } = await supabase.storage.updateBucket("documentos", {
      public: true,
    });
    if (updateError) {
      console.error("Error actualizando bucket:", updateError);
    }

    // 4. Probar upload con un archivo de prueba
    const testContent = "Test file";
    const testBlob = new Blob([testContent], { type: "text/plain" });
    const testFile = new File([testBlob], "test.txt", { type: "text/plain" });

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload("test/test-fix.txt", testFile, { contentType: "text/plain", upsert: true });

    if (uploadError) {
      return NextResponse.json({
        success: false,
        error: "Error en test upload: " + uploadError.message,
        hint: "Las políticas de Storage necesitan configurarse manualmente en Supabase Dashboard"
      }, { status: 500 });
    }

    // 5. Eliminar archivo de prueba
    await supabase.storage.from("documentos").remove(["test/test-fix.txt"]);

    return NextResponse.json({
      success: true,
      message: "Bucket documentos configurado correctamente",
      bucketPublic: true,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 });
  }
}
