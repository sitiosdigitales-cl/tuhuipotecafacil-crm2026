import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "src/app/(dashboard)/plantillas/page.tsx"),
  "utf8"
);

describe("catálogo de plantillas", () => {
  it("expone solo lectura hasta contar con un editor validado", () => {
    expect(source).toContain("Catálogo en solo lectura");
    expect(source).toContain('fetch("/api/plantillas"');
    expect(source).not.toMatch(/Nueva Plantilla|Editar Plantilla|Guardar Cambios/);
    expect(source).not.toMatch(/modalCrear|modalEditar|setPlantillas\(\(prev\)/);
    expect(source).not.toMatch(/method:\s*["'](?:POST|PUT|DELETE)["']/);
  });

  it("usa el contrato persistido y no métricas inexistentes", () => {
    expect(source).toMatch(/variables:\s*string\[\]/);
    expect(source).toMatch(/usos:\s*number/);
    expect(source).not.toMatch(/\bactiva:\s*boolean|\bflujos:\s*string\[\]|\buso:\s*number/);
  });
});
