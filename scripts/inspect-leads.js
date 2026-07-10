const { createClient } = require("@supabase/supabase-js");
const c = createClient("https://dcoyjvbhrkarrmetrhiv.supabase.co", "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw");

async function main() {
  const { data: leads } = await c.from("leads").select("*").order("creadoen", { ascending: false });
  console.log("Total:", leads.length);
  leads.forEach(function(l) {
    console.log("---");
    console.log("  ID:", l.id);
    console.log("  Nombre:", l.nombre, l.apellido);
    console.log("  RUT:", l.rut);
    console.log("  Origen:", l.origen);
    console.log("  Creado:", l.creadoen);
  });
}
main();
