import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDirectory = join(process.cwd(), "supabase", "migrations");

describe("migraciones canónicas", () => {
  it("no siembra cuentas ni hashes de contraseña", () => {
    const unsafeMigrations = readdirSync(migrationsDirectory)
      .filter((file) => file.endsWith(".sql"))
      .map((file) => ({
        file,
        sql: readFileSync(join(migrationsDirectory, file), "utf8"),
      }))
      .filter(
        ({ sql }) =>
          /insert\s+into\s+(?:public\.)?usuarios\b/i.test(sql) ||
          /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/.test(sql),
      )
      .map(({ file }) => file);

    expect(unsafeMigrations).toEqual([]);
  });
});
