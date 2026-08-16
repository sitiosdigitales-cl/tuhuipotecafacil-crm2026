import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const workflowPath = join(process.cwd(), ".github/workflows/restore-drill.yml");
const restoreScriptPath = join(
  process.cwd(),
  "scripts/backup/restore-external-backup.sh",
);
const restoreStoragePath = join(
  process.cwd(),
  "scripts/backup/restore-storage.mjs",
);

describe("ensayo de restauración", () => {
  it("solo se ejecuta manualmente y con aprobación de staging", () => {
    expect(existsSync(workflowPath)).toBe(true);
    expect(existsSync(restoreScriptPath)).toBe(true);
    expect(existsSync(restoreStoragePath)).toBe(true);

    const workflow = readFileSync(workflowPath, "utf8");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toContain("schedule:");
    expect(workflow).toContain("environment: staging-restore");
    expect(workflow).toContain("vars.ENABLE_RESTORE_DRILLS == 'true'");
    expect(workflow).toContain("inputs.confirmation == 'RESTORE_EMPTY_STAGING'");
  });

  it("rechaza una base con tablas de aplicación y mide el RTO", () => {
    const script = readFileSync(restoreScriptPath, "utf8");

    expect(script).toContain("TARGET_ENVIRONMENT");
    expect(script).toContain("CONFIRM_RESTORE");
    expect(script).toMatch(/pg_tables[\s\S]+schemaname = 'public'/);
    expect(script).toContain("--single-transaction");
    expect(script).toContain("restore-storage.mjs");
    expect(script).toContain("14400");
  });
});
