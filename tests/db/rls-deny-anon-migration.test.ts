import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20260816_lock_down_anon_and_storage.sql"
);

describe("migración de cierre del Data API", () => {
  it("niega roles públicos y conserva service role", () => {
    expect(existsSync(migrationPath)).toBe(true);
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toMatch(/REVOKE ALL[^;]+FROM anon, authenticated/i);
    expect(sql).toMatch(/GRANT SELECT, INSERT, UPDATE, DELETE[^;]+service_role/i);
    expect(sql).toContain("FROM pg_policies");
    expect(sql).toContain("DROP POLICY IF EXISTS");
  });

  it("deja documentos privados y fuera de Realtime", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toMatch(
      /UPDATE storage\.buckets[\s\S]+public = false[\s\S]+documentos/i
    );
    expect(sql).toContain("pg_publication_tables");
    expect(sql).toContain("ALTER PUBLICATION supabase_realtime DROP TABLE");
    expect(sql).toMatch(
      /FROM pg_policies[\s\S]+schemaname = 'storage'[\s\S]+DROP POLICY IF EXISTS/i
    );
    expect(sql).not.toMatch(/USING\s*\(\s*true\s*\)/i);
    expect(sql).not.toMatch(/WITH CHECK\s*\(\s*true\s*\)/i);
  });
});
