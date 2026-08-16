import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

describe("acceso Supabase desde el navegador", () => {
  it("obliga a los client components a usar APIs del servidor", () => {
    const clientImports = sourceFiles(join(process.cwd(), "src"))
      .filter((path) => readFileSync(path, "utf8").startsWith('"use client"'))
      .filter((path) =>
        /from ["']@\/lib\/supabase["']/.test(readFileSync(path, "utf8"))
      )
      .map((path) => path.replace(process.cwd() + "/", ""));

    expect(clientImports).toEqual([]);
  });

  it("no conserva un hook genérico que pueda suscribirse a cualquier tabla", () => {
    expect(
      existsSync(join(process.cwd(), "src/lib/hooks/useRealtime.ts"))
    ).toBe(false);
  });
});
