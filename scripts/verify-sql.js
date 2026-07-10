const fs = require("fs");
const sql = fs.readFileSync("scripts/setup-supabase-fixed.sql", "utf8");

const login = fs.readFileSync("src/app/api/auth/login/route.ts", "utf8");
const docs = fs.readFileSync("src/app/api/documentos/route.ts", "utf8");
const tareas = fs.readFileSync("src/app/api/tareas/route.ts", "utf8");
const register = fs.readFileSync("src/app/api/auth/register/route.ts", "utf8");

console.log("=== Verification ===");
console.log("Login accesses:", [...login.matchAll(/user\.(\w+)/g)].map(m => m[1]).join(", "));
console.log("Register inserts password:", register.includes("password: hashedPassword"));
console.log("Docs uses leadId:", docs.includes("leadId"));
console.log("Tareas uses leadId:", tareas.includes("leadId"));
console.log("SQL has password col:", sql.includes("password TEXT"));
console.log("SQL has RLS disabled:", sql.includes("DISABLE ROW LEVEL SECURITY"));
console.log("SQL has actividades:", sql.includes("actividades"));
console.log("SQL has leadid in docs:", sql.includes("leadid TEXT NOT NULL"));
