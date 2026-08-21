import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const runbook = read("docs/staging-validacion.md");
const checklist = read("docs/CHECKLIST-CONFIGURACION.md");
const evidenceTemplate = read("docs/evidencia-staging-plantilla.md");
const backupRunbook = read("docs/respaldos-externos.md");
const workflow = read(".github/workflows/staging-validation.yml");
const emptyStagingGuard = read("scripts/ci/assert-empty-staging.mjs");
const recoveryIntegration = read("scripts/ci/recovery-integration.mjs");

const requiredGates = [
  "REL-01",
  "BAK-01",
  "BAK-02",
  "RES-01",
  "RES-02",
  "DB-01",
  "DB-02",
  "DB-03",
  "AUTH-01",
  "AUTH-02",
  "AUTH-04",
  "RLS-01",
  "STO-01",
  "APP-01",
  "APP-02",
  "MAIL-01",
  "WEB-01",
  "ADM-01",
  "SEC-01",
  "GO-01",
];

describe("contrato de evidencia de staging", () => {
  it("separa validación sintética de restauración con datos recuperados", () => {
    expect(runbook).toContain("`staging-validation`");
    expect(runbook).toContain("`staging-restore`");
    expect(runbook).toContain("puede contener temporalmente datos reales restaurados");
    expect(runbook).toContain("No reutilizar un mismo proyecto");
    expect(backupRunbook).toMatch(/no debe\s+reutilizarse como staging funcional/);
  });

  it.each(requiredGates)("define y registra el gate %s", (gate) => {
    expect(runbook).toContain(`\`${gate}\``);
    expect(evidenceTemplate).toContain(`\`${gate}\``);
  });

  it("vincula el checklist con el procedimiento y exige evidencia", () => {
    expect(checklist).toContain("docs/staging-validacion.md");
    expect(checklist).toContain("docs/evidencia-staging-plantilla.md");
    expect(checklist).toContain("no se marca solo por memoria");
  });

  it("mantiene la aplicación de migraciones fuera del workflow de validación", () => {
    expect(runbook.indexOf("db push --dry-run --linked")).toBeLessThan(
      runbook.indexOf("db push --linked"),
    );
    expect(runbook).toContain("No ejecutar `supabase config push`");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("environment: staging-validation");
    expect(workflow).toContain("VERIFY_SYNTHETIC_STAGING");
    expect(workflow).toContain("ENABLE_STAGING_VALIDATION");
    expect(workflow).toContain("assert-empty-staging.mjs");
    expect(workflow).toContain("auth-bridge-integration.mjs");
    expect(workflow).toContain("recovery-integration.mjs");
    expect(workflow).toContain("rls-domain-integration.mjs");
    expect(workflow.indexOf("assert-empty-staging.mjs")).toBeLessThan(
      workflow.indexOf("auth-bridge-integration.mjs"),
    );
    expect(workflow.indexOf("assert-empty-staging.mjs")).toBeLessThan(
      workflow.indexOf("recovery-integration.mjs"),
    );
    expect(workflow.indexOf("recovery-integration.mjs")).toBeLessThan(
      workflow.lastIndexOf("assert-empty-staging.mjs"),
    );
    expect(workflow).not.toContain("db push");
    expect(workflow).not.toContain("schedule:");
  });

  it("restringe la recuperación remota al staging sintético confirmado", () => {
    expect(recoveryIntegration).toContain("RECOVERY_INTEGRATION_TARGET");
    expect(recoveryIntegration).toContain("synthetic-staging");
    expect(recoveryIntegration).toContain("VERIFY_EMPTY_SYNTHETIC_STAGING");
    expect(recoveryIntegration).toContain("@example.invalid");
    expect(workflow).toContain(
      "RECOVERY_INTEGRATION_CONFIRMATION: VERIFY_EMPTY_SYNTHETIC_STAGING",
    );
    expect(runbook).toContain("once archivos");
  });

  it("documenta las variables y el corte seguro de required", () => {
    for (const variable of ["APP_URL", "RESEND_API_KEY", "FROM_EMAIL"]) {
      expect(checklist).toContain(`\`${variable}\``);
    }
    expect(checklist).toMatch(
      /No activar `SUPABASE_AUTH_MODE=required`[\s\S]+sin `auth_user_id`/,
    );
  });

  it("detiene la validación ante datos o identidades existentes", () => {
    for (const table of [
      "usuarios",
      "leads",
      "documentos",
      "tareas",
      "comisiones",
    ]) {
      expect(emptyStagingGuard).toContain(`\"${table}\"`);
    }
    expect(emptyStagingGuard).toContain("listUsers");
    expect(emptyStagingGuard).toContain("count !== 0");
    expect(emptyStagingGuard).not.toContain("console.log(authDirectory");
  });

  it("no solicita secretos ni datos personales en la plantilla", () => {
    expect(evidenceTemplate).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(evidenceTemplate).not.toContain("STAGING_SUPABASE_ANON_KEY");
    expect(evidenceTemplate).not.toMatch(/correo:\s*$/im);
    expect(evidenceTemplate).not.toMatch(/rut:\s*$/im);
  });
});
