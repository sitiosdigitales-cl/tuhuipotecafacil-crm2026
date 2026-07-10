const https = require("https");

function testEndpoint(path, method, body) {
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
          resolve({ status: res.statusCode, count: j.data?.length, success: j.success });
        } catch {
          resolve({ status: res.statusCode, raw: d.substring(0, 100) });
        }
      });
    });
    if (data) r.write(data);
    r.end();
  });
}

async function main() {
  const login = await testEndpoint("/api/auth/login", "POST", { email: "admin@tuhipotecafacil.cl", password: "demo1234" });
  console.log("LOGIN:", login.status === 200 ? "OK" : "FAIL", "| success:", login.success);

  const leads = await testEndpoint("/api/leads");
  console.log("LEADS:", leads.status, "|", leads.count, "registros");

  const tareas = await testEndpoint("/api/tareas");
  console.log("TAREAS:", tareas.status, "|", tareas.count, "registros");

  const docs = await testEndpoint("/api/documentos");
  console.log("DOCS:", docs.status, "|", docs.count, "registros");

  const test = await testEndpoint("/api/test");
  console.log("TEST:", test.status, "|", test.success);

  console.log("\n=== RESUMEN ===");
  const all = [login, leads, tareas, docs, test];
  const allOk = all.every(r => r.status === 200 || r.status === 201);
  console.log(allOk ? "TODAS LAS APIS FUNCIONANDO" : "HAY ERRORES");
}

main();
