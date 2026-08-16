import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260816100000_atomic_login_attempts.sql",
);

describe("contador atómico de login", () => {
  it("bloquea la fila y restringe la función al backend", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toMatch(/for\s+update/i);
    expect(sql).toMatch(/security\s+definer/i);
    expect(sql).toMatch(/revoke\s+all[\s\S]+from\s+public\s*,\s*anon\s*,\s*authenticated/i);
    expect(sql).toMatch(/grant\s+execute[\s\S]+to\s+service_role/i);
  });
});
