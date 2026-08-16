import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const checklist = readFileSync(
  join(process.cwd(), "docs/CHECKLIST-CONFIGURACION.md"),
  "utf8",
);
const obsoleteGuide = readFileSync(
  join(process.cwd(), "docs/guia-ejecutar-sql-pendiente.md"),
  "utf8",
);
const obsoleteSql = readFileSync(
  join(process.cwd(), "prisma/run-all-pending.sql"),
  "utf8",
);

describe("procedimiento canónico de migraciones", () => {
  it("no ofrece instrucciones ejecutables para el SQL histórico", () => {
    expect(obsoleteGuide).not.toContain("## Pasos para ejecutar");
    expect(obsoleteGuide).not.toMatch(/Selecciona el proyecto:\s*`[^`]+`/);
    expect(obsoleteGuide).toContain("docs/supabase-migrations.md");
    expect(obsoleteSql).toMatch(/RAISE EXCEPTION 'SQL obsoleto/i);
  });

  it("dirige la operación a migraciones verificadas y recuperación", () => {
    expect(checklist).not.toMatch(
      /Copiar contenido de `prisma\/run-all-pending\.sql`/,
    );
    expect(checklist).toContain("npm run db:reset");
    expect(checklist).toContain("docs/supabase-migrations.md");
    expect(checklist).toContain("docs/respaldos-externos.md");
    expect(checklist).toMatch(/staging[\s\S]+producción/i);
  });
});
