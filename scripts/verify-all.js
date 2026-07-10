const { createClient } = require("@supabase/supabase-js");
const c = createClient("https://dcoyjvbhrkarrmetrhiv.supabase.co", "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw");

async function main() {
  // Check user
  const { data: user, error: e1 } = await c.from("usuarios").select("*").eq("email", "admin@tuhipotecafacil.cl").single();
  if (e1) { console.log("User error:", e1.message); return; }
  console.log("User:", user.nombre, user.email, "| password:", user.password);

  // Check leads
  const { data: leads } = await c.from("leads").select("id,nombre,apellido,etapa");
  console.log("Leads:", leads.length);

  // Check tareas
  const { data: tareas } = await c.from("tareas").select("*");
  console.log("Tareas:", tareas.length);

  // Check documentos
  const { data: docs } = await c.from("documentos").select("*");
  console.log("Documentos:", docs.length);

  // Check actividades
  const { data: acts } = await c.from("actividades").select("*");
  console.log("Actividades:", acts.length);
}
main();
