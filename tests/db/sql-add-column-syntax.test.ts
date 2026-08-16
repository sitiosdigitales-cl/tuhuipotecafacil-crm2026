import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function sqlFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory()
      ? sqlFiles(path)
      : path.endsWith(".sql")
        ? [path]
        : [];
  });
}

describe("sintaxis idempotente de migraciones SQL", () => {
  it("usa IF NOT EXISTS completo al agregar columnas", () => {
    const invalidFiles = ["prisma", "supabase"]
      .flatMap((directory) => sqlFiles(join(ROOT, directory)))
      .filter((path) =>
        /\bADD\s+COLUMN\s+IF\s+NOT\s+(?!EXISTS\b)/i.test(
          readFileSync(path, "utf8")
        )
      )
      .map((path) => relative(ROOT, path));

    expect(invalidFiles).toEqual([]);
  });
});
