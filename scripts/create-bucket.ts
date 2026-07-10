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

async function createBucket() {
  console.log("=== Creando bucket 'documentos' ===\n");

  // Intentar crear el bucket
  const { data, error } = await supabase.storage.createBucket("documentos", {
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

  if (error) {
    console.log("Error al crear bucket:", error.message);
    
    if (error.message.includes("already exists")) {
      console.log("\nEl bucket ya existe. Verificando...");
      const { data: buckets } = await supabase.storage.listBuckets();
      console.log("Buckets disponibles:", buckets?.map(b => b.name).join(", "));
    } else if (error.message.includes("row-level security")) {
      console.log("\nError de permisos. Necesitas crear el bucket manualmente:");
      console.log("1. Ve a https://supabase.com/dashboard");
      console.log("2. Selecciona tu proyecto");
      console.log("3. Ve a Storage");
      console.log("4. Haz clic en 'New bucket'");
      console.log("5. Nombre: 'documentos'");
      console.log("6. Marca 'Public'");
      console.log("7. Haz clic en 'Create bucket'");
    }
    return;
  }

  console.log("Bucket creado exitosamente:", data);

  // Verificar
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log("\nBuckets disponibles:", buckets?.map(b => b.name).join(", "));
}

createBucket().catch(console.error);
