import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20260816110000_auth_identity_bridge.sql",
);

describe("puente de identidades hacia Supabase Auth", () => {
  it("enlaza un UUID único y permite retirar el hash legado", () => {
    expect(existsSync(migrationPath)).toBe(true);
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS auth_user_id UUID/i);
    expect(sql).toMatch(/REFERENCES auth\.users\s*\(\s*id\s*\)/i);
    expect(sql).toMatch(/UNIQUE INDEX[\s\S]+auth_user_id/i);
    expect(sql).toMatch(/ALTER COLUMN password DROP NOT NULL/i);
    expect(sql).toMatch(
      /CHECK\s*\(\s*password IS NOT NULL OR auth_user_id IS NOT NULL\s*\)/i,
    );
  });

  it("serializa la migración y restringe sus funciones al backend", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("reclamar_migracion_auth");
    expect(sql).toContain("completar_migracion_auth");
    expect(sql).toContain("liberar_migracion_auth");
    expect(sql).toMatch(/auth_migration_started_at[\s\S]+INTERVAL '10 minutes'/i);
    expect(sql).toMatch(/SET[\s\S]+password = NULL/i);
    expect(sql).toMatch(/SECURITY DEFINER/gi);
    expect(sql).toMatch(/REVOKE ALL[\s\S]+FROM PUBLIC, anon, authenticated/i);
    expect(sql).toMatch(/GRANT EXECUTE[\s\S]+TO service_role/i);
  });
});
