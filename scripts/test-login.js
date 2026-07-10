const https = require("https");
const data = JSON.stringify({ email: "admin@tuhipotecafacil.cl", password: "demo1234" });
const opts = {
  hostname: "tuhuipotecafacil-crm2026.vercel.app",
  path: "/api/auth/login",
  method: "POST",
  headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
};
const r = https.request(opts, (res) => {
  let body = "";
  res.on("data", (c) => (body += c));
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Body:", body);
  });
});
r.write(data);
r.end();
