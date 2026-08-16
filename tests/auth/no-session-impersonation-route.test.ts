import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("sesión sin cambio de identidad", () => {
  it("no expone un endpoint que reemplace la identidad de la sesión", () => {
    expect(
      existsSync(resolve(ROOT, "src/app/api/auth/switch-user/route.ts"))
    ).toBe(false);
  });

  it("el contexto no ofrece cambio rápido de usuario", () => {
    const source = readFileSync(
      resolve(ROOT, "src/lib/contexts/UserContext.tsx"),
      "utf8"
    );

    expect(source).not.toContain("/api/auth/switch-user");
    expect(source).not.toContain("cambiarUsuario");
  });
});
