#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Falta la configuración protegida de staging");
}

const url = new URL(supabaseUrl);
if (
  url.protocol !== "https:" ||
  ["localhost", "127.0.0.1"].includes(url.hostname)
) {
  throw new Error("La validación requiere un proyecto staging remoto por HTTPS");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const applicationTables = [
  "usuarios",
  "leads",
  "documentos",
  "tareas",
  "comisiones",
];

for (const table of applicationTables) {
  const { count, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(`No se pudo comprobar que ${table} esté vacía`);
  }
  if (count !== 0) {
    throw new Error("Staging contiene datos de aplicación; validación detenida");
  }
}

const { data: authDirectory, error: authError } =
  await admin.auth.admin.listUsers({ page: 1, perPage: 1 });

if (authError) {
  throw new Error("No se pudo comprobar que el directorio Auth esté vacío");
}
if (authDirectory.users.length !== 0) {
  throw new Error("Staging contiene identidades Auth; validación detenida");
}

console.log("Synthetic staging emptiness: OK");
