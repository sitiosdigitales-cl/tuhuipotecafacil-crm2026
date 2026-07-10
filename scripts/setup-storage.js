const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://dcoyjvbhrkarrmetrhiv.supabase.co",
  "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw"
);

async function setupStorage() {
  // Intentar subir un archivo de prueba para crear el bucket automáticamente
  const testContent = new Blob(["test"], { type: "text/plain" });
  const testFile = new File([testContent], "test.txt", { type: "text/plain" });

  const { data, error } = await supabase.storage
    .from("documentos")
    .upload("test/test.txt", testFile);

  if (error) {
    if (error.message.includes("Bucket not found")) {
      console.log("Bucket no existe. Necesitas crearlo manualmente en Supabase Dashboard → Storage → New bucket → nombre: documentos");
    } else {
      console.log("Error:", error.message);
    }
  } else {
    console.log("Bucket creado y archivo subido:", data);
    // Eliminar archivo de prueba
    await supabase.storage.from("documentos").remove(["test/test.txt"]);
  }
}

setupStorage();
