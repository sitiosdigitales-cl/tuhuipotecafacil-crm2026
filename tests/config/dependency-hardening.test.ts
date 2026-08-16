import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

type PackageManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), "package.json"), "utf8")
) as PackageManifest;
const workflow = readFileSync(
  join(process.cwd(), ".github/workflows/ci.yml"),
  "utf8"
);

function versionAtLeast(current: string, minimum: string) {
  const currentParts = current.match(/\d+/g)?.slice(0, 3).map(Number) ?? [];
  const minimumParts = minimum.split(".").map(Number);

  for (let index = 0; index < minimumParts.length; index += 1) {
    const currentPart = currentParts[index] ?? 0;
    const minimumPart = minimumParts[index] ?? 0;

    if (currentPart !== minimumPart) {
      return currentPart > minimumPart;
    }
  }

  return true;
}

describe("dependencias y CI defensivos", () => {
  it("mantiene Next en una versión que contiene las correcciones vigentes", () => {
    const nextVersion = packageJson.dependencies?.next;

    expect(nextVersion).toBeDefined();
    expect(versionAtLeast(nextVersion ?? "0.0.0", "16.3.1")).toBe(true);
  });

  it("no instala herramientas de desarrollo en producción", () => {
    expect(packageJson.dependencies?.shadcn).toBeUndefined();
    expect(packageJson.dependencies?.["@capacitor/android"]).toBeUndefined();
    expect(packageJson.dependencies?.["@capacitor/core"]).toBeUndefined();
    expect(packageJson.dependencies?.["@capacitor/cli"]).toBeUndefined();
    expect(packageJson.dependencies?.["@types/bcryptjs"]).toBeUndefined();
    expect(packageJson.dependencies?.["@types/jsonwebtoken"]).toBeUndefined();

    expect(packageJson.devDependencies?.shadcn).toBeDefined();
    expect(packageJson.devDependencies?.["@capacitor/cli"]).toBeUndefined();
    expect(packageJson.devDependencies?.["@types/bcryptjs"]).toBeUndefined();
  });

  it("rechaza avisos de dependencias desde GitHub Actions", () => {
    expect(workflow).toContain("npm audit --omit=dev --audit-level=moderate");
    expect(workflow).toContain("npm audit --audit-level=high");
  });
});
