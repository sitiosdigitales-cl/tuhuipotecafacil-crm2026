import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const pagePath = join(
  process.cwd(),
  "src/app/(dashboard)/usuarios/[id]/page.tsx"
);
const pageSource = readFileSync(pagePath, "utf8");
const legacyProfilePath = join(
  process.cwd(),
  "src/componentes/usuarios/PerfilProfesional.tsx"
);

describe("detalle operativo de usuario", () => {
  it("calcula la cartera desde la relación persistida por identificador", () => {
    expect(pageSource).toContain("lead.asignadoA === usuario.id");
    expect(pageSource).toContain("ETAPAS_APROBADAS");
    expect(pageSource).toContain("montoSolicitado");
    expect(pageSource).not.toMatch(/nombreEjecutivo\s*===/);
  });

  it("no presenta actividad, rendimiento ni estados escritos en el código", () => {
    expect(pageSource).not.toMatch(
      /generarActividadUsuario|RENDIMIENTO_MENSUAL|Actividad Reciente|Rendimiento Mensual/
    );
    expect(pageSource).not.toMatch(/esSuperAdmin\s*=\s*true|dosFA|ultimoAcceso/);
    expect(pageSource).not.toContain("recharts");
  });

  it("expone solo lectura hasta contar con una edición respaldada", () => {
    expect(pageSource).toContain("Vista informativa");
    expect(pageSource).toContain("fetch(`/api/usuarios/${id}`");
    expect(pageSource).not.toMatch(
      /toast\.success|Guardar Configuración|Cambiar Contraseña|Editar Perfil/
    );
    expect(pageSource).not.toContain("PerfilProfesional");
    expect(existsSync(legacyProfilePath)).toBe(false);
  });
});
