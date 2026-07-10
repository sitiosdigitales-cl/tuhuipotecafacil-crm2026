const https = require("https");

function fetch(path, method, body) {
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
        try {
          const j = JSON.parse(d);
          resolve({ path, status: res.statusCode, ok: j.success !== false, data: Array.isArray(j.data) ? j.data.length : (j.data ? 1 : 0) });
        } catch {
          resolve({ path, status: res.statusCode, ok: true, data: "-" });
        }
      });
    });
    if (data) r.write(data);
    r.end();
  });
}

async function main() {
  console.log("=== API ENDPOINTS ===\n");

  const tests = [
    ["GET", "/api/leads", null],
    ["POST", "/api/leads", { nombre: "Review", apellido: "Test", rut: "77.777.777-7", origen: "WEB" }],
    ["GET", "/api/tareas", null],
    ["POST", "/api/tareas", { titulo: "Review test", estado: "PENDIENTE" }],
    ["GET", "/api/documentos", null],
    ["GET", "/api/test", null],
    ["POST", "/api/auth/login", { email: "admin@tuhipotecafacil.cl", password: "demo1234" }],
  ];

  let createdLeadId = null;

  for (const [method, path, body] of tests) {
    const r = await fetch(path, method, body);
    const icon = r.status >= 200 && r.status < 300 ? "OK" : "FAIL";
    console.log(icon + " " + method.padEnd(5) + r.status + " " + path.padEnd(30) + (typeof r.data === "number" ? r.data + " rows" : r.data));
    if (path === "/api/leads" && method === "POST" && r.ok) {
      // Get the created lead ID
      const leadRes = await fetch("/api/leads?busqueda=Review+Test", "GET");
      if (leadRes.ok && leadRes.data > 0) createdLeadId = "created";
    }
  }

  // Cleanup
  console.log("\n=== CLEANUP ===");
  const leadsRes = await fetch("/api/leads?busqueda=Review+Test", "GET");

  console.log("\n=== DYNAMIC PAGES ===");
  const dynamicPages = [
    "/leads/b9e59e5f-af23-40dd-a39e-5f36101ce0ad",
    "/clientes/b9e59e5f-af23-40dd-a39e-5f36101ce0ad",
    "/tareas/t-001",
  ];
  for (const p of dynamicPages) {
    const r = await new Promise((resolve) => {
      const opts = { hostname: "tuhuipotecafacil-crm2026.vercel.app", path: p, method: "GET", headers: { "User-Agent": "Mozilla/5.0" } };
      const req = https.request(opts, (res) => {
        let d = ""; res.on("data", (c) => d += c);
        res.on("end", () => resolve({ path: p, status: res.statusCode, size: d.length }));
      });
      req.end();
    });
    const icon = r.status === 200 ? "OK" : "FAIL";
    console.log(icon + " " + r.status + " " + r.path + " (" + r.size + " bytes)");
  }
}
main();
