const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://lvxdkoelmppyizvoztqp.supabase.co";
const supabaseKey = "sb_publishable_JrPqarKB0kty4g0hgVxiuw_8pVB5E7n";

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log("Conectando a Supabase...");

  // Verificar conexión
  const { data, error } = await supabase.from("leads").select("*").limit(1);

  if (error && error.message.includes("does not exist")) {
    console.log("La tabla leads no existe. Necesitas crearla en Supabase SQL Editor.");
    console.log("\nVe a: https://supabase.com/dashboard → SQL Editor → New query");
    console.log("Y ejecuta el SQL que te proporcioné.");
    return;
  }

  if (error) {
    console.log("Error:", error.message);
    return;
  }

  console.log("¡Conexión exitosa! La tabla leads existe.");
  console.log("Leads encontrados:", data?.length || 0);
}

setupDatabase();
