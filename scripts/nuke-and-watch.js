const { createClient } = require("@supabase/supabase-js");
const c = createClient("https://dcoyjvbhrkarrmetrhiv.supabase.co", "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw");

async function main() {
  // Nuke all leads
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

  // Verify zero
  const { data: after } = await c.from("leads").select("id");
  console.log("Leads restantes:", after.length);

  // Check if Supabase has any triggers by checking pg_stat_activity
  // We can't do that from client, but we can monitor
  console.log("\nMonitoreando 10 segundos...");
  await new Promise(function(r) { setTimeout(r, 10000); });
  const { data: check } = await c.from("leads").select("id");
  console.log("Leads despues de 10s:", check.length);

  if (check.length > 0) {
    console.log("\nHAY CREACION AUTOMATICA. Detalles:");
    const { data: newLeads } = await c.from("leads").select("*");
    newLeads.forEach(function(l) {
      console.log(" -", l.nombre, l.apellido, "| origen:", l.origen, "| created:", l.creadoen);
    });
  }
}

main();
