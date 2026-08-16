import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("recuperación de la cuenta administradora", () => {
  it("el seed no crea cuentas con contraseñas conocidas o hashes decorativos", () => {
    const seed = source("prisma/seed-usuarios.sql");

    expect(seed).not.toMatch(/admin123/i);
    expect(seed).not.toMatch(/INSERT\s+INTO\s+usuarios/i);
    expect(seed).not.toContain("GERENTE");
  });

  it("el bootstrap exige credenciales y confirmación explícitas", () => {
    const script = source("scripts/bootstrap-admin.mjs");

    expect(script).toContain("BOOTSTRAP_ADMIN_EMAIL");
    expect(script).toContain("BOOTSTRAP_ADMIN_PASSWORD");
    expect(script).toContain("BOOTSTRAP_CONFIRM");
    expect(script).not.toMatch(/admin123|password\s*:\s*["'][^"']+["']/i);
    expect(script).toContain('rol: "SUPER_ADMIN"');
    expect(script).toContain('estado: "ACTIVO"');
  });

  it("sincroniza la recuperación con Supabase Auth fuera del modo legado", () => {
    const script = source("scripts/bootstrap-admin.mjs");

    expect(script).toContain("SUPABASE_AUTH_MODE");
    expect(script).toContain("auth.admin.createUser");
    expect(script).toContain("auth.admin.updateUserById");
    expect(script).toContain("auth_user_id");
    expect(script).toContain("auth_migrated_at");
    expect(script).toContain("password: passwordHash");
  });
});
