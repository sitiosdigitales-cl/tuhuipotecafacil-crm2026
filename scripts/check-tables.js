const https = require("https");

const KEY = "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw";
const HOST = "dcoyjvbhrkarrmetrhiv.supabase.co";

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const opts = {
      hostname: HOST,
      path: "/rest/v1/rpc/exec_sql",
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const r = http.request(opts, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d }));
    });
    r.write(body);
    r.end();
  });
}

// Supabase REST API can't run arbitrary SQL via RPC unless function exists.
// Alternative: use the Supabase Management API to run SQL.
// But the simplest way: just verify tables exist by trying to query them.

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://dcoyjvbhrkarrmetrhiv.supabase.co",
  KEY
);

async function checkTables() {
  const tables = ["leads", "usuarios", "tareas", "documentos", "actividades"];
  const results = {};
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(1);
    results[t] = error ? "MISSING" : `OK (${(data || []).length}+ rows)`;
  }
  return results;
}

async function insertUser(id, nombre, apellido, email, password, rol) {
  const { error } = await supabase
    .from("usuarios")
    .upsert({ id, nombre, apellido, email, password, rol });
  return error ? `ERROR: ${error.message}` : "OK";
}

async function main() {
  console.log("=== Checking Supabase tables ===\n");
  const tables = await checkTables();
  for (const [name, status] of Object.entries(tables)) {
    console.log(`  ${name}: ${status}`);
  }

  const missing = Object.entries(tables)
    .filter(([_, s]) => s === "MISSING")
    .map(([n]) => n);

  if (missing.length > 0) {
    console.log(`\nMissing tables: ${missing.join(", ")}`);
    console.log("These need to be created in Supabase Dashboard SQL Editor.");
    console.log("The SQL file is at: scripts/setup-supabase.sql");
  } else {
    console.log("\nAll tables exist!");
  }

  // Check if usuarios has data
  if (tables.usuarios !== "MISSING") {
    const { data } = await supabase.from("usuarios").select("id");
    console.log(`\nUsuarios count: ${(data || []).length}`);
    if ((data || []).length === 0) {
      console.log("Inserting test users...");
      const users = [
        ["u1", "Admin", "Sistema", "admin@tuhipotecafacil.cl", "demo1234", "SUPER_ADMIN"],
        ["u2", "Andres", "Perez", "andres.perez@tuhipotecafacil.cl", "demo1234", "ADMIN"],
        ["u3", "Carolina", "Munoz", "carolina.munoz@tuhipotecafacil.cl", "demo1234", "GERENTE"],
        ["u4", "Diego", "Silva", "diego.silva@tuhipotecafacil.cl", "demo1234", "EJECUTIVO"],
        ["u5", "Valentina", "Torres", "valentina.torres@tuhipotecafacil.cl", "demo1234", "EJECUTIVO"],
      ];
      for (const u of users) {
        const result = await insertUser(...u);
        console.log(`  ${u[3]}: ${result}`);
      }
    }
  }
}

main().catch(console.error);
