const { createClient } = require("@supabase/supabase-js");
const c = createClient("https://dcoyjvbhrkarrmetrhiv.supabase.co", "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw");
async function clean() {
  await c.from("leads").delete().eq("rut", "77.777.777-7");
  await c.from("tareas").delete().eq("titulo", "Review test");
  const { data: l } = await c.from("leads").select("id");
  const { data: t } = await c.from("tareas").select("id");
  console.log("Leads:", l.length, "Tareas:", t.length, "Limpio");
}
clean();
