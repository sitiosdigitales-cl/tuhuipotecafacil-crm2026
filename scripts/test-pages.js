const https = require("https");

const pages = [
  "/", "/login", "/portal-cliente",
  "/dashboard", "/pipeline", "/leads", "/clientes",
  "/tareas", "/documentos", "/comisiones",
  "/usuarios", "/reportes", "/resumen",
  "/asistente", "/conversaciones", "/recordatorios",
  "/cmf", "/bancos", "/simulador",
  "/referidos", "/campanas", "/plantillas",
  "/flujos", "/triggers", "/integraciones",
  "/agenda", "/landings", "/portal",
  "/biblioteca", "/auditoria", "/permisos",
  "/configuracion", "/configuracion/pwa",
];

function fetchPage(path) {
  return new Promise((resolve) => {
    const opts = {
      hostname: "tuhuipotecafacil-crm2026.vercel.app",
      path,
      method: "GET",
      headers: { "User-Agent": "Mozilla/5.0" },
    };
    const r = https.request(opts, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        const hasError = body.includes("Application error") || body.includes("500") || body.includes("Internal Server Error");
        const hasTitle = body.match(/<title>(.*?)<\/title>/)?.[1] || "";
        resolve({ path, status: res.statusCode, hasError, title: hasTitle.substring(0, 50) });
      });
    });
    r.on("error", (e) => resolve({ path, status: 0, hasError: true, title: e.message }));
    r.end();
  });
}

async function main() {
  console.log("Testing " + pages.length + " pages...\n");
  const results = [];
  for (const p of pages) {
    const r = await fetchPage(p);
    const icon = r.status === 200 && !r.hasError ? "OK" : "FAIL";
    console.log(icon + " " + r.status + " " + p + (r.title ? " | " + r.title : ""));
    results.push(r);
  }
  const ok = results.filter(r => r.status === 200 && !r.hasError).length;
  const fail = results.filter(r => r.status !== 200 || r.hasError).length;
  console.log("\n=== " + ok + " OK, " + fail + " FAIL out of " + pages.length + " ===");
  if (fail > 0) {
    console.log("Failed pages:");
    results.filter(r => r.status !== 200 || r.hasError).forEach(r => console.log("  " + r.status + " " + r.path + " | " + r.title));
  }
}
main();
