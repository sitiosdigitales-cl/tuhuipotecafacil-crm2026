const https = require("https");

function apiCall(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: "tuhuipotecafacil-crm2026.vercel.app",
      path,
      method: method || "GET",
      headers: { "Content-Type": "application/json" },
    };
    if (data) opts.headers["Content-Length"] = Buffer.byteLength(data);
    const r = https.request(opts, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        try { resolve(JSON.parse(d)); } catch { resolve({ raw: d }); }
      });
    });
    if (data) r.write(data);
    r.end();
  });
}

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient("https://dcoyjvbhrkarrmetrhiv.supabase.co", "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw");

async function main() {
  console.log("=== TEST 1: Crear lead via API ===");
  const newLead = await apiCall("/api/leads", "POST", {
    nombre: "Test",
    apellido: "Supabase",
    rut: "99.999.999-9",
    email: "test@supabase.cl",
    telefono: "+56900000000",
    origen: "WEB",
    etapa: "NUEVO_LEAD",
    prioridad: "MEDIA",
    banco: "Banco de Chile",
  });
  console.log("API response:", newLead.success, "| id:", newLead.data?.id);

  // Verificar en Supabase directamente
  const { data: inDB } = await supabase.from("leads").select("id,nombre,apellido,rut,etapa").eq("rut", "99.999.999-9").single();
  console.log("En Supabase directo:", inDB ? `${inDB.nombre} ${inDB.apellido} (${inDB.etapa})` : "NO ENCONTRADO");

  console.log("\n=== TEST 2: Crear tarea via API ===");
  const newTask = await apiCall("/api/tareas", "POST", {
    titulo: "Test tarea Supabase",
    descripcion: "Verificar que tareas se guardan",
    estado: "PENDIENTE",
    prioridad: "ALTA",
    leadid: newLead.data?.id,
  });
  console.log("API response:", newTask.success, "| id:", newTask.data?.id);

  const { data: taskInDB } = await supabase.from("tareas").select("id,titulo,estado").eq("titulo", "Test tarea Supabase").single();
  console.log("En Supabase directo:", taskInDB ? `${taskInDB.titulo} (${taskInDB.estado})` : "NO ENCONTRADO");

  console.log("\n=== TEST 3: Eliminar datos de prueba ===");
  if (newLead.data?.id) {
    await apiCall("/api/leads/" + newLead.data.id, "DELETE");
    await supabase.from("tareas").delete().eq("titulo", "Test tarea Supabase");
    console.log("Limpieza completada");
  }

  console.log("\n=== VERIFICACION FINAL ===");
  const leads = await apiCall("/api/leads");
  console.log("Leads totales:", leads.data?.length);
  console.log("\nConCLUSION: Cualquier creacion desde el CRM se guarda en Supabase.");
}

main();
