#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

import { restoreStorageBackup } from "./storage-manifest.mjs";

const inputDirectory = process.argv[2];
const supabaseUrl = process.env.TARGET_SUPABASE_URL;
const serviceRoleKey = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY;

if (process.env.TARGET_ENVIRONMENT !== "staging") {
  throw new Error("La restauración de objetos solo está habilitada para staging");
}
if (process.env.CONFIRM_RESTORE !== "RESTORE_EMPTY_STAGING") {
  throw new Error("Falta la confirmación explícita de restauración");
}
if (!inputDirectory) {
  throw new Error("Uso: node scripts/backup/restore-storage.mjs <directorio>");
}
if (!supabaseUrl || new URL(supabaseUrl).protocol !== "https:") {
  throw new Error("TARGET_SUPABASE_URL debe ser una URL HTTPS");
}
if (!serviceRoleKey) {
  throw new Error("Falta TARGET_SUPABASE_SERVICE_ROLE_KEY");
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const result = await restoreStorageBackup({
  client,
  inputDirectory,
  upsert: true,
});

console.log(JSON.stringify({ success: true, ...result }));
