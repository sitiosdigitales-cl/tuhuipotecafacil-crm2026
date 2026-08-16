import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20260816000000_lock_down_anon_and_storage.sql",
);

describe("alcance de las políticas de Storage", () => {
  it("conserva políticas ajenas y restringe solo los buckets del CRM", () => {
    const sql = readFileSync(migrationPath, "utf8");
    const storageSection = sql.slice(sql.indexOf("UPDATE storage.buckets"));

    expect(storageSection).not.toMatch(
      /FROM pg_policies[\s\S]+schemaname = 'storage'[\s\S]+DROP POLICY IF EXISTS/i,
    );
    expect(storageSection).toMatch(/CREATE POLICY[\s\S]+AS RESTRICTIVE/i);
    expect(storageSection).toMatch(
      /bucket_id\s+NOT IN\s*\(\s*'documentos'\s*,\s*'backups'\s*\)/i,
    );
  });
});
