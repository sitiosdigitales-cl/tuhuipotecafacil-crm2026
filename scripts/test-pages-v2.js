const https = require("https");

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
        const hasRealError = body.includes("Internal Server Error") || body.includes("500: ");
        const hasAppError = body.includes("Application error");
        const isSSR = body.includes("__NEXT_DATA__") || body.includes("next/data");
        resolve({ path, status: res.statusCode, hasRealError, hasAppError, isSSR, len: body.length });
      });
    });
    r.on("error", (e) => resolve({ path, status: 0, hasRealError: true, title: e.message }));
    r.end();
  });
}

async function main() {
  const pages = ["/", "/login", "/dashboard", "/pipeline", "/leads", "/clientes", "/tareas", "/documentos", "/comisiones", "/usuarios", "/reportes", "/portal-cliente"];
  console.log("Testing " + pages.length + " key pages...\n");
  for (const p of pages) {
    const r = await fetchPage(p);
    const icon = r.status === 200 && !r.hasRealError ? "OK" : "FAIL";
    console.log(icon + " " + String(r.status).padEnd(4) + p.padEnd(25) + "size:" + String(r.len).padEnd(8) + "SSR:" + (r.isSSR ? "yes" : "no"));
  }
}
main();
