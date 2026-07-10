const { createClient } = require("@supabase/supabase-js");
const c = createClient("https://dcoyjvbhrkarrmetrhiv.supabase.co", "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw");

async function main() {
  console.log("Monitoreando leads durante 60 segundos...\n");

  const check = async (label) => {
    const { data } = await c.from("leads").select("id");
    console.log(label + ": " + data.length + " leads");
  };

  await check("Inicio");
  await new Promise(function(r) { setTimeout(r, 30000); });
  await check("30 seg");
  await new Promise(function(r) { setTimeout(r, 30000); });
  await check("60 seg");

  console.log("\nSi sigue en 0, no hay creacion automatica.");
}
main();
