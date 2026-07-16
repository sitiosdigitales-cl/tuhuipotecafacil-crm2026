import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/debug/documentos - Debug endpoint para verificar estado de documentos
export async function GET() {
  try {
    // 1. Verificar conexión a Supabase
    const { error: pingError } = await supabase.from("leads").select("id").limit(1);

    // 2. Verificar si la tabla documentos existe
    const { data: tableCheck, error: tableError } = await supabase
      .from("documentos")
      .select("*")
      .limit(1);

    // 3. Verificar bucket de documentos
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    // 4. Listar archivos en el bucket
    let files: any[] = [];
    if (!bucketError) {
      const { data: fileList } = await supabase.storage.from("documentos").list("", { limit: 10 });
      files = fileList || [];
    }

    return NextResponse.json({
      conexion: pingError ? "ERROR" : "OK",
      tablaDocumentos: tableError ? "NO EXISTE" : "EXISTE",
      tablaError: tableError?.message || null,
      totalDocumentos: tableCheck?.length || 0,
      bucketDocumentos: bucketError ? "NO EXISTE" : "EXISTE",
      bucketError: bucketError?.message || null,
      archivosEnBucket: files.length,
      archivos: files.slice(0, 5),
    });
  } catch (error) {
    return NextResponse.json({
      error: "Error en debug",
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
