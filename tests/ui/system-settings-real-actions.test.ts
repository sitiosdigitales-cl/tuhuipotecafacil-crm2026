import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(
    process.cwd(),
    "src/app/(dashboard)/configuracion/_components/tab-sistema.tsx"
  ),
  "utf8"
);

describe("configuracion del sistema", () => {
  it("dirige a la exportacion real y no confirma operaciones simuladas", () => {
    expect(source).toContain('href="/backups"');
    expect(source).toContain("PostgreSQL en Supabase");
    expect(source).not.toMatch(/setTimeout|Datos exportados correctamente|Respaldo creado correctamente/);
    expect(source).not.toMatch(/Limpiar Cache|Optimizar Base de Datos|Restablecer Todo/);
  });
});
