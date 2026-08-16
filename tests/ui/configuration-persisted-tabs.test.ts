import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const configurationPath = join(
  process.cwd(),
  "src/app/(dashboard)/configuracion"
);
const pageSource = readFileSync(join(configurationPath, "page.tsx"), "utf8");
const sidebarSource = readFileSync(
  join(process.cwd(), "src/componentes/layout/BarraLateral.tsx"),
  "utf8"
);
const configurationServiceSource = readFileSync(
  join(process.cwd(), "src/modulos/configuracion/servicios.ts"),
  "utf8"
);

describe("configuración operativa", () => {
  it("muestra solo secciones con persistencia o información verificable", () => {
    expect(pageSource).toContain('type TabConfig = "notificaciones" | "pipeline" | "sistema"');
    expect(pageSource).toContain("<TabNotificaciones />");
    expect(pageSource).toContain("<TabPipeline");
    expect(pageSource).toContain("<TabSistema />");
    expect(pageSource).not.toMatch(/\/api\/configuracion|Guardar Cambios/);
    expect(configurationServiceSource).not.toContain("/api/configuracion");
  });

  it.each([
    "tab-general.tsx",
    "tab-documentos.tsx",
    "tab-email.tsx",
    "tab-integraciones.tsx",
    "tab-asistente-ia.tsx",
    "tab-seguridad.tsx",
  ])("retira el control local %s", (fileName) => {
    expect(
      existsSync(join(configurationPath, "_components", fileName))
    ).toBe(false);
  });

  it("envía al asistente real en vez de un formulario de claves local", () => {
    expect(sidebarSource).toContain('href: "/asistente"');
    expect(sidebarSource).not.toContain("/configuracion?tab=asistente-ia");
  });
});
