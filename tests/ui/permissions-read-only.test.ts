import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "src/app/(dashboard)/permisos/page.tsx"),
  "utf8"
);

describe("panel de roles", () => {
  it("no presenta una matriz editable sin persistencia", () => {
    expect(source).toContain("no existe un editor dinámico de permisos");
    expect(source).toContain('href="/usuarios"');
    expect(source).not.toMatch(/Guardar Cambios|togglePermiso|setTimeout/);
  });

  it("deriva el catálogo visible de ROLES_CONFIG", () => {
    expect(source).toMatch(/Object\.entries\(ROLES_CONFIG\)/);
    expect(source).not.toMatch(/GERENTE|VISOR/);
  });
});
