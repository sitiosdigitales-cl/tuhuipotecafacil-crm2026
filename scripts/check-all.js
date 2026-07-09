const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://larcrkislkrtpnhzofni.supabase.co",
  "sb_publishable_GuspM3K-3aOy2j7oWV4eWg_VPvGWSCj"
);

async function check() {
  const { data, error } = await supabase.from("leads").select("id,nombre,apellido,rut,etapa");
  console.log("Total leads:", data ? data.length : 0);
  if (data && data.length > 0) {
    data.slice(0, 5).forEach(l => console.log("  " + l.rut + " | " + l.nombre + " " + l.apellido));
  }
  if (error) console.log("Error:", error.message);
}

check();
