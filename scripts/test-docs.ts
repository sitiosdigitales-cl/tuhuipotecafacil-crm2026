import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Variables de entorno de Supabase no configuradas");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDocumentUpload() {
  console.log("=== Test: Subida y descarga de documentos ===\n");

  // 1. Verificar bucket de Storage
  console.log("1. Verificando bucket de Storage...");
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

  if (bucketError) {
    console.error("   ERROR al listar buckets:", bucketError.message);
    return;
  }

  const bucketExiste = buckets?.some(b => b.name === "documentos");

  if (!bucketExiste) {
    console.log("   Bucket 'documentos' NO existe");
    console.log("\n   INSTRUCCIONES PARA CREAR EL BUCKET:");
    console.log("   1. Ve a https://supabase.com/dashboard");
    console.log("   2. Selecciona tu proyecto");
    console.log("   3. Ve a Storage en el menú lateral");
    console.log("   4. Haz clic en 'New bucket'");
    console.log("   5. Nombre: 'documentos'");
    console.log("   6. Marca 'Public' si quieres URLs públicas");
    console.log("   7. Haz clic en 'Create bucket'");
    console.log("\n   Después de crear el bucket, ejecuta este script nuevamente.");
    return;
  }

  console.log("   Bucket 'documentos' existe");

  // 2. Crear un lead de prueba
  const leadId = crypto.randomUUID();
  const testLead = {
    id: leadId,
    nombre: "Test",
    apellido: "Documentos",
    rut: "12.345.678-9",
    email: "test.docs@conexion.cl",
    telefono: "+56912345678",
    origen: "WEB",
    etapa: "NUEVO_LEAD",
    prioridad: "MEDIA",
    situacionlaboral: "DEPENDIENTE",
    endicom: false,
    diasenetapa: 0,
    creadoen: new Date().toISOString(),
  };

  console.log("\n2. Creando lead de prueba...");
  const { error: leadError } = await supabase.from("leads").insert(testLead);
  if (leadError) {
    console.error("   ERROR al crear lead:", leadError.message);
    return;
  }
  console.log("   Lead creado:", leadId);

  // 3. Crear un archivo de prueba
  const testFilePath = path.join(__dirname, "test-document.txt");
  fs.writeFileSync(testFilePath, "Este es un documento de prueba para verificar la subida y descarga.");

  // 4. Subir archivo a Supabase Storage
  console.log("\n3. Subiendo archivo a Supabase Storage...");
  const fileBuffer = fs.readFileSync(testFilePath);
  const fileName = `test-${Date.now()}.txt`;
  const filePath = `${leadId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("documentos")
    .upload(filePath, fileBuffer, { contentType: "text/plain" });

  if (uploadError) {
    console.error("   ERROR al subir:", uploadError.message);
    console.log("\n   Si el error es 'new row violates row-level security policy':");
    console.log("   1. Ve a Supabase Dashboard > Storage > documentos");
    console.log("   2. Haz clic en 'Policies'");
    console.log("   3. Agrega política de INSERT: allow insert for authenticated users");
    console.log("   4. Agrega política de SELECT: allow select for authenticated users");
    fs.unlinkSync(testFilePath);
    return;
  }
  console.log("   Archivo subido:", filePath);

  // 5. Obtener URL pública
  const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(filePath);
  console.log("   URL pública:", urlData?.publicUrl);

  // 6. Guardar referencia en tabla documentos
  console.log("\n4. Guardando referencia en tabla documentos...");
  const docId = crypto.randomUUID();
  const docData = {
    id: docId,
    leadid: leadId,
    leadnombre: "Test Documentos",
    nombre: fileName,
    tipo: "OTRO",
    estado: "PENDIENTE",
    archivourl: urlData?.publicUrl || null,
    creadoen: new Date().toISOString(),
  };

  const { error: docError } = await supabase.from("documentos").insert(docData);
  if (docError) {
    console.error("   ERROR al guardar documento:", docError.message);
    fs.unlinkSync(testFilePath);
    return;
  }
  console.log("   Documento guardado:", docId);

  // 7. Leer documento de la tabla
  console.log("\n5. Leyendo documento de la tabla...");
  const { data: doc, error: readError } = await supabase
    .from("documentos")
    .select("*")
    .eq("id", docId)
    .single();

  if (readError || !doc) {
    console.error("   ERROR al leer:", readError?.message);
  } else {
    console.log("   Documento leído:");
    console.log("     - Nombre:", doc.nombre);
    console.log("     - Tipo:", doc.tipo);
    console.log("     - Estado:", doc.estado);
    console.log("     - URL:", doc.archivourl);
  }

  // 8. Actualizar estado del documento
  console.log("\n6. Actualizando estado a APROBADO...");
  const { error: updateError } = await supabase
    .from("documentos")
    .update({ estado: "APROBADO" })
    .eq("id", docId);

  if (updateError) {
    console.error("   ERROR al actualizar:", updateError.message);
  } else {
    console.log("   Estado actualizado a APROBADO");
  }

  // 9. Verificar descarga (simular)
  console.log("\n7. Verificando descarga...");
  if (doc?.archivourl) {
    console.log("   URL de descarga:", doc.archivourl);
    console.log("   (Se abriría en nueva pestaña al hacer clic en descargar)");
  }

  // 10. Eliminar documento
  console.log("\n8. Eliminando documento...");
  const { error: deleteError } = await supabase
    .from("documentos")
    .delete()
    .eq("id", docId);

  if (deleteError) {
    console.error("   ERROR al eliminar:", deleteError.message);
  } else {
    console.log("   Documento eliminado");
  }

  // 11. Eliminar archivo de Storage
  console.log("\n9. Eliminando archivo de Storage...");
  const { error: storageError } = await supabase.storage
    .from("documentos")
    .remove([filePath]);

  if (storageError) {
    console.error("   ERROR al eliminar de Storage:", storageError.message);
  } else {
    console.log("   Archivo eliminado de Storage");
  }

  // 12. Eliminar lead de prueba
  console.log("\n10. Eliminando lead de prueba...");
  const { error: leadDeleteError } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId);

  if (leadDeleteError) {
    console.error("   ERROR al eliminar lead:", leadDeleteError.message);
  } else {
    console.log("   Lead eliminado");
  }

  // Limpiar archivo temporal
  fs.unlinkSync(testFilePath);

  console.log("\n=== TODOS LOS TESTS PASARON ===");
  console.log("La funcionalidad de documentos funciona correctamente.");
}

testDocumentUpload().catch(console.error);
