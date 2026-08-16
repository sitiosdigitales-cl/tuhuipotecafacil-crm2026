import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("alta de documentos", () => {
  it.each([
    "src/app/api/upload/route.ts",
    "src/app/api/portal/upload/route.ts",
  ])("%s siempre inicia el documento pendiente de revisión", (relativePath) => {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");

    expect(source).toMatch(/estado:\s*"PENDIENTE"/);
    expect(source).not.toMatch(/estado:\s*body\.estado/);
  });
});
