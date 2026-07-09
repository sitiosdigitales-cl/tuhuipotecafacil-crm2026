const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://larcrkislkrtpnhzofni.supabase.co",
  "sb_publishable_GuspM3K-3aOy2j7oWV4eWg_VPvGWSCj"
);

async function test() {
  console.log("=== Prueba conexion Supabase ===\n");

  const { data: leads, error } = await supabase.from("leads").select("id,nombre,apellido,rut,etapa").limit(5);
  console.log("Leads encontrados:", leads ? leads.length : 0);
  if (error) console.log("Error:", error.message);
  if (leads && leads.length > 0) {
    leads.forEach(l => console.log("  " + l.rut + " | " + l.nombre + " " + l.apellido + " | " + l.etapa));
  }

  console.log("\n=== Fin ===");
}

test().catch(console.error);
