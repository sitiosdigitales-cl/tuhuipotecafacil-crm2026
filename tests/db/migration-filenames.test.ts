import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDirectory = join(process.cwd(), "supabase", "migrations");

describe("versiones de migraciones", () => {
  it("usa timestamps completos y únicos", () => {
    const migrationFiles = readdirSync(migrationsDirectory).filter((file) =>
      file.endsWith(".sql"),
    );
    const invalidNames = migrationFiles.filter(
      (file) => !/^\d{14}_[a-z0-9_]+\.sql$/.test(file),
    );
    const versions = migrationFiles.map((file) => file.split("_", 1)[0]);
    const duplicateVersions = versions.filter(
      (version, index) => versions.indexOf(version) !== index,
    );

    expect(invalidNames).toEqual([]);
    expect(duplicateVersions).toEqual([]);
  });
});
