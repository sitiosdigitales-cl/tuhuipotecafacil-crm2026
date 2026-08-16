#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

import {
  exportStorageBackup,
  parseBucketList,
} from "./storage-manifest.mjs";

const outputDirectory = process.argv[2];
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!outputDirectory) {
  throw new Error("Uso: node scripts/backup/export-storage.mjs <directorio>");
}
if (!supabaseUrl || new URL(supabaseUrl).protocol !== "https:") {
  throw new Error("SUPABASE_URL debe ser una URL HTTPS");
}
if (!serviceRoleKey) {
  throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const result = await exportStorageBackup({
  client,
  outputDirectory,
  buckets: parseBucketList(process.env.SUPABASE_BACKUP_BUCKETS),
});

console.log(JSON.stringify({ success: true, ...result }));
