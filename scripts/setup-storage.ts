import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Variables de entorno de Supabase no configuradas");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  console.log("=== Configurando Supabase Storage ===\n");

  // 1. Listar buckets existentes
  console.log("1. Verificando buckets existentes...");
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error("   ERROR al listar buckets:", listError.message);
    return;
  }

  console.log("   Buckets encontrados:", buckets?.map(b => b.name).join(", ") || "Ninguno");

  // 2. Verificar si existe el bucket "documentos"
  const bucketExiste = buckets?.some(b => b.name === "documentos");

  if (!bucketExiste) {
    console.log("\n2. Creando bucket 'documentos'...");
    const { error: createError } = await supabase.storage.createBucket("documentos", {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    });

    if (createError) {
      console.error("   ERROR al crear bucket:", createError.message);
      return;
    }
    console.log("   Bucket 'documentos' creado exitosamente");
  } else {
    console.log("\n2. Bucket 'documentos' ya existe");
  }

  // 3. Configurar políticas de acceso (RLS)
  console.log("\n3. Configurando políticas de acceso...");
  console.log("   (Las políticas RLS se configuran en el panel de Supabase)");

  // 4. Probar subida
  console.log("\n4. Probando subida de archivo...");
  const testContent = "Archivo de prueba para verificar Storage";
  const testPath = `test/test-${Date.now()}.txt`;

  const { error: uploadError } = await supabase.storage
    .from("documentos")
    .upload(testPath, testContent, { contentType: "text/plain" });

  if (uploadError) {
    console.error("   ERROR al subir:", uploadError.message);
    console.log("\n   Solución: Configura las políticas de Storage en el panel de Supabase:");
    console.log("   1. Ve a Storage > Buckets > documentos");
    console.log("   2. Haz clic en Policies");
    console.log("   3. Agrega una política de INSERT para authenticated users");
    console.log("   4. Agrega una política de SELECT para authenticated users");
    return;
  }

  console.log("   Archivo subido exitosamente");

  // 5. Obtener URL
  const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(testPath);
  console.log("   URL pública:", urlData?.publicUrl);

  // 6. Eliminar archivo de prueba
  console.log("\n5. Limpiando archivo de prueba...");
  const { error: deleteError } = await supabase.storage
    .from("documentos")
    .remove([testPath]);

  if (deleteError) {
    console.error("   ERROR al eliminar:", deleteError.message);
  } else {
    console.log("   Archivo eliminado");
  }

  console.log("\n=== CONFIGURACIÓN COMPLETADA ===");
  console.log("El bucket 'documentos' está listo para usar.");
}

setupStorage().catch(console.error);
