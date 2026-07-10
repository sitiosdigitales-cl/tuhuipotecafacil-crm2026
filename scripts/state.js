const { createClient } = require("@supabase/supabase-js");
const c = createClient("https://dcoyjvbhrkarrmetrhiv.supabase.co", "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw");
async function main() {
  const leads = await c.from("leads").select("id");
  const users = await c.from("usuarios").select("id");
  const tareas = await c.from("tareas").select("id");
  const docs = await c.from("documentos").select("id");
  console.log("Leads:", leads.data.length);
  console.log("Usuarios:", users.data.length);
  console.log("Tareas:", tareas.data.length);
  console.log("Documentos:", docs.data.length);
}
main();
