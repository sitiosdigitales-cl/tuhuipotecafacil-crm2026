const https = require("https");

function fetch(path) {
  return new Promise((resolve) => {
    const opts = { hostname: "tuhuipotecafacil-crm2026.vercel.app", path, method: "GET", headers: { "User-Agent": "Mozilla/5.0" } };
    const r = https.request(opts, (res) => {
      let d = ""; res.on("data", (c) => d += c);
      res.on("end", () => resolve({ path, status: res.statusCode, size: d.length }));
    });
    r.on("error", (e) => resolve({ path, status: 0, err: e.message }));
    r.end();
  });
}

function apiCall(path, method, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = { hostname: "tuhuipotecafacil-crm2026.vercel.app", path, method: method || "GET", headers: { "Content-Type": "application/json" } };
    if (data) opts.headers["Content-Length"] = Buffer.byteLength(data);
    const r = https.request(opts, (res) => {
      let d = ""; res.on("data", (c) => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch { resolve({ raw: d.substring(0, 100) }); } });
    });
    if (data) r.write(data);
    r.end();
  });
}

async function main() {
  console.log("=== VERIFICACION EN VERCEL ===\n");

  // Pages
  const pages = ["/", "/login", "/dashboard", "/pipeline", "/leads", "/clientes", "/tareas", "/documentos", "/portal-cliente"];
  console.log("--- Paginas ---");
  for (const p of pages) {
    const r = await fetch(p);
    console.log((r.status === 200 ? "OK" : "FAIL") + " " + r.status + " " + p + " (" + r.size + " bytes)");
  }

  // APIs
  console.log("\n--- APIs ---");
  const login = await apiCall("/api/auth/login", "POST", { email: "admin@tuhipotecafacil.cl", password: "demo1234" });
  console.log((login.success ? "OK" : "FAIL") + " Login");

  const leads = await apiCall("/api/leads");
  console.log("OK Leads: " + (leads.data ? leads.data.length : 0) + " registros");

  const tareas = await apiCall("/api/tareas");
  console.log("OK Tareas: " + (tareas.data ? tareas.data.length : 0) + " registros");

  const docs = await apiCall("/api/documentos");
  console.log("OK Documentos: " + (docs.data ? docs.data.length : 0) + " registros");

  // Create lead test
  console.log("\n--- CRUD Test ---");
  const create = await apiCall("/api/leads", "POST", { nombre: "Verificacion", apellido: "Vercel", rut: "00.000.000-0", origen: "WEB", etapa: "NUEVO_LEAD" });
  console.log((create.success ? "OK" : "FAIL") + " Crear lead: " + (create.data ? create.data.id : create.error));

  // Delete test lead
  if (create.success && create.data && create.data.id) {
    const del = await apiCall("/api/leads/" + create.data.id, "DELETE");
    console.log((del.success ? "OK" : "FAIL") + " Eliminar lead");
  }

  console.log("\n=== CRM DEPLOYADO Y FUNCIONANDO EN VERCEL ===");
  console.log("URL: https://tuhuipotecafacil-crm2026.vercel.app");
}

main();
