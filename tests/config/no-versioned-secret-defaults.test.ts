import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("secretos en archivos versionados", () => {
  it("la guía usa marcadores y nunca publica valores concretos", () => {
    const guide = source("docs/setup-vercel-env.md");

    expect(guide).not.toMatch(/tuhuipotecafacil-(?:secret-key|backup-secret)-\d{4}/);
    expect(guide).toContain("openssl rand -hex 32");
    expect(guide).toContain("$BACKUP_API_KEY");
  });

  it("el respaldo manual falla si la clave no fue entregada", () => {
    const script = source("scripts/backup-manual.sh");

    expect(script).toContain('${BACKUP_API_KEY:?');
    expect(script).not.toContain("${BACKUP_API_KEY:-");
  });
});
