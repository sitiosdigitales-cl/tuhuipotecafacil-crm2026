const { createClient } = require("@supabase/supabase-js");
const c = createClient("https://dcoyjvbhrkarrmetrhiv.supabase.co", "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw");

async function main() {
  // Borrar leads de prueba
  await c.from("leads").delete().eq("rut", "88.888.888-8");
  await c.from("leads").delete().eq("rut", "99.999.999-9");
  // Borrar tareas de prueba
  await c.from("tareas").delete().like("titulo", "Test%");

  const { data: leads } = await c.from("leads").select("id");
  const { data: tareas } = await c.from("tareas").select("id");
  const { data: users } = await c.from("usuarios").select("id");
  const { data: docs } = await c.from("documentos").select("id");

  console.log("Leads:", leads.length);
  console.log("Tareas:", tareas.length);
  console.log("Usuarios:", users.length);
  console.log("Documentos:", docs.length);
  console.log("\nTodo limpio y verificado.");
}
main();
