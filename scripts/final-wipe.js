const { createClient } = require("@supabase/supabase-js");
const c = createClient("https://dcoyjvbhrkarrmetrhiv.supabase.co", "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw");

async function main() {
  const { data: all } = await c.from("leads").select("id,nombre,apellido");
  console.log("Leads actuales:", all.length);
  all.forEach(function(l) { console.log(" -", l.nombre, l.apellido, "|", l.id); });

  if (all.length > 0) {
    const ids = all.map(function(r) { return r.id; });
    await c.from("leads").delete().in("id", ids);
    console.log("\nBorrados:", ids.length);
  }

  const { data: after } = await c.from("leads").select("id");
  console.log("Leads restantes:", after.length);
}
main();
