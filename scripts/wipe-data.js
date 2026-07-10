const { createClient } = require("@supabase/supabase-js");
const c = createClient("https://dcoyjvbhrkarrmetrhiv.supabase.co", "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw");

async function main() {
  console.log("Estado ANTES:");
  const before = {};
  for (const t of ["leads", "tareas", "documentos", "actividades"]) {
    const { data } = await c.from(t).select("id");
    before[t] = data ? data.length : 0;
    console.log("  " + t + ": " + before[t]);
  }

  // Borrar todo en lotes de 1000
  for (const t of ["leads", "tareas", "documentos", "actividades"]) {
    let total = 0;
    while (true) {
      const { data, error } = await c.from(t).select("id").limit(1000);
      if (error || !data || data.length === 0) break;
      const ids = data.map(function(r) { return r.id; });
      await c.from(t).delete().in("id", ids);
      total += ids.length;
      if (data.length < 1000) break;
    }
    console.log("  Borrados de " + t + ": " + total);
  }

  console.log("\nEstado DESPUES:");
  const after = {};
  for (const t of ["leads", "tareas", "documentos", "actividades"]) {
    const { data } = await c.from(t).select("id");
    after[t] = data ? data.length : 0;
    console.log("  " + t + ": " + after[t]);
  }

  const { data: users } = await c.from("usuarios").select("id");
  console.log("  usuarios (se conservan): " + (users ? users.length : 0));
}

main();
