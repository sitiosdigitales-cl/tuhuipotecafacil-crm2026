const { createClient } = require("@supabase/supabase-js");
const c = createClient("https://dcoyjvbhrkarrmetrhiv.supabase.co", "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw");

async function main() {
  // Ver todos los leads
  const { data: all } = await c.from("leads").select("id,nombre,apellido,rut,creadoen").order("creadoen", { ascending: false });
  console.log("Total leads:", all.length);
  console.log("\nUltimos 10:");
  all.slice(0, 10).forEach(function(l) {
    console.log(" ", l.creadoen ? l.creadoen.substring(0, 19) : "?", l.nombre, l.apellido, "|", l.rut);
  });

  // Borrar todos
  console.log("\nBorrando todos...");
  let total = 0;
  while (true) {
    const { data } = await c.from("leads").select("id").limit(1000);
    if (!data || data.length === 0) break;
    const ids = data.map(function(r) { return r.id; });
    await c.from("leads").delete().in("id", ids);
    total += ids.length;
    if (data.length < 1000) break;
  }
  console.log("Borrados:", total);

  // Verificar
  const { data: after } = await c.from("leads").select("id");
  console.log("Leads restantes:", after.length);
}

main();
