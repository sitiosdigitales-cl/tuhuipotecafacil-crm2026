import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const pagePath = join(
  process.cwd(),
  "src/app/(dashboard)/integraciones/page.tsx"
);
const source = readFileSync(pagePath, "utf8");
const legacyConfiguratorPath = join(
  process.cwd(),
  "src/componentes/integraciones/WordPressIntegration.tsx"
);

describe("inventario de integraciones", () => {
  it("carga únicamente conexiones registradas en la API", () => {
    expect(source).toContain('fetch("/api/integraciones"');
    expect(source).toContain("Inventario persistido");
    expect(source).toContain("integracion.syncCount");
    expect(source).not.toMatch(/const INTEGRACIONES|conectada:\s*(?:true|false)/);
  });

  it("no recibe secretos ni confirma cambios solo locales", () => {
    expect(source).toContain("Inventario de solo lectura");
    expect(source).not.toMatch(
      /API Key|API Secret|type="password"|toggleConexion|toast\.success|Configuración guardada/
    );
    expect(source).not.toMatch(/method:\s*["'](?:POST|PUT|DELETE)["']/);
  });

  it("retira el configurador de prueba que podía crear datos operativos", () => {
    expect(source).not.toContain("WordPressIntegration");
    expect(existsSync(legacyConfiguratorPath)).toBe(false);
  });
});
