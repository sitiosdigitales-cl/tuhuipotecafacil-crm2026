import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/debug/test-upload - Test endpoint para debuggear uploads
export async function POST(request: NextRequest) {
  const logs: string[] = [];

  try {
    logs.push("1. Iniciando test de upload...");

    // Verificar conexión
    const { error: pingError } = await supabase.from("documentos").select("id").limit(1);
    if (pingError) {
      logs.push(`ERROR: No se puede conectar a tabla documentos: ${pingError.message}`);
      return NextResponse.json({ success: false, logs }, { status: 500 });
    }
    logs.push("OK: Conexión a tabla documentos funcionando");

    // Verificar buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      logs.push(`ERROR: No se pueden listar buckets: ${bucketError.message}`);
    } else {
      const docBucket = buckets?.find(b => b.id === "documentos");
      if (docBucket) {
        logs.push(`OK: Bucket 'documentos' existe (público: ${docBucket.public})`);
      } else {
        logs.push("ERROR: Bucket 'documentos' NO existe");
        logs.push("_buckets disponibles: " + buckets?.map(b => b.id).join(", "));
        return NextResponse.json({ success: false, logs }, { status: 500 });
      }
    }

    // Intentar subir un archivo de prueba
    const testContent = "Test file content";
    const testBlob = new Blob([testContent], { type: "text/plain" });
    const testFile = new File([testBlob], "test.txt", { type: "text/plain" });

    logs.push("2. Intentando subir archivo de prueba a Storage...");
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documentos")
      .upload("test/test-upload.txt", testFile, { contentType: "text/plain" });

    if (uploadError) {
      logs.push(`ERROR: Falló upload a Storage: ${uploadError.message}`);
      return NextResponse.json({ success: false, logs }, { status: 500 });
    }
    logs.push(`OK: Archivo subido a Storage: ${uploadData?.path}`);

    // Obtener URL pública
    const { data: urlData } = supabase.storage.from("documentos").getPublicUrl("test/test-upload.txt");
    logs.push(`OK: URL pública: ${urlData?.publicUrl}`);

    // Intentar insertar en la tabla
    logs.push("3. Intentando insertar en tabla documentos...");
    const { error: insertError } = await supabase.from("documentos").insert({
      id: crypto.randomUUID(),
      leadid: "test-debug",
      leadnombre: "Debug Test",
      nombre: "test.txt",
      tipo: "OTRO",
      estado: "PENDIENTE",
      archivourl: urlData?.publicUrl || null,
      creadoEn: new Date().toISOString(),
    });

    if (insertError) {
      logs.push(`ERROR: Falló insert en documentos: ${insertError.message}`);
      return NextResponse.json({ success: false, logs }, { status: 500 });
    }
    logs.push("OK: Documento insertado en tabla correctamente");

    // Limpiar: eliminar archivo de prueba
    await supabase.storage.from("documentos").remove(["test/test-upload.txt"]);
    logs.push("OK: Archivo de prueba eliminado");

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    logs.push(`ERROR EXCEPCIÓN: ${error instanceof Error ? error.message : "Unknown error"}`);
    return NextResponse.json({ success: false, logs }, { status: 500 });
  }
}
