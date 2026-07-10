const https = require("https");
const opts = {
  hostname: "tuhuipotecafacil-crm2026.vercel.app",
  path: "/api/leads",
  method: "POST",
  headers: { "Content-Type": "application/json" },
};
const data = JSON.stringify({
  nombre: "Test", apellido: "Deploy", rut: "88.888.888-8",
  email: "deploy@test.cl", origen: "WEB", etapa: "NUEVO_LEAD"
});
opts.headers["Content-Length"] = Buffer.byteLength(data);
const r = https.request(opts, (res) => {
  let d = "";
  res.on("data", (c) => (d += c));
  res.on("end", () => console.log("Status:", res.statusCode, "|", d.substring(0, 200)));
});
r.write(data);
r.end();
