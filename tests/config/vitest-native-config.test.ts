import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), "package.json"), "utf8")
) as { devDependencies?: Record<string, string> };

describe("configuración futura de Vitest", () => {
  it("usa un módulo ESM y resolución nativa de alias", () => {
    const legacyConfig = join(process.cwd(), "vitest.config.ts");
    const moduleConfig = join(process.cwd(), "vitest.config.mts");

    expect(existsSync(legacyConfig)).toBe(false);
    expect(existsSync(moduleConfig)).toBe(true);

    const config = readFileSync(moduleConfig, "utf8");
    expect(config).toContain("tsconfigPaths: true");
    expect(config).not.toContain("vite-tsconfig-paths");
    expect(
      packageJson.devDependencies?.["vite-tsconfig-paths"]
    ).toBeUndefined();
  });
});
