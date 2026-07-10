const https = require("https");

function apiCall(path, method, body) {
  return new Promise((resolve) => {
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

async function main() {
  console.log("=== Testing lead creation ===");
  const result = await apiCall("/api/leads", "POST", {
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
  console.log("Full response:", JSON.stringify(result, null, 2));
}
main();
