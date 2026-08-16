import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const workflowPath = join(process.cwd(), ".github/workflows/external-backup.yml");
const exportScriptPath = join(
  process.cwd(),
  "scripts/backup/export-storage.mjs",
);
const verifyScriptPath = join(
  process.cwd(),
  "scripts/backup/verify-storage.mjs",
);

describe("respaldo externo restaurable", () => {
  it("genera cada hora las tres capas SQL y copia Storage", () => {
    expect(existsSync(workflowPath)).toBe(true);
    expect(existsSync(exportScriptPath)).toBe(true);
    expect(existsSync(verifyScriptPath)).toBe(true);

    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toMatch(/cron:\s*["']\d+ \* \* \* \*["']/);
    expect(workflow).toContain("vars.ENABLE_EXTERNAL_BACKUPS == 'true'");
    expect(workflow).toMatch(/supabase db dump[\s\S]+--role-only/);
    expect(workflow).toMatch(/supabase db dump[\s\S]+schema\.sql/);
    expect(workflow).toMatch(
      /supabase db dump[\s\S]+--data-only[\s\S]+--use-copy/,
    );
    expect(workflow).toContain("node scripts/backup/export-storage.mjs");
    expect(workflow).toContain("node scripts/backup/verify-storage.mjs");
  });

  it("cifra en R2 con Restic y no publica datos como artifact", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toContain("RESTIC_REPOSITORY");
    expect(workflow).toContain("RESTIC_PASSWORD");
    expect(workflow).toContain("AWS_ACCESS_KEY_ID");
    expect(workflow).toMatch(/restic backup/);
    expect(workflow).toMatch(/restic forget/);
    expect(workflow).not.toContain("actions/upload-artifact");
  });
});
