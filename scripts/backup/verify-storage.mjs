#!/usr/bin/env node

import { verifyStorageBackup } from "./storage-manifest.mjs";

const inputDirectory = process.argv[2];
if (!inputDirectory) {
  throw new Error("Uso: node scripts/backup/verify-storage.mjs <directorio>");
}

const result = await verifyStorageBackup(inputDirectory);
console.log(JSON.stringify({ success: true, ...result }));
