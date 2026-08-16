import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20260816120000_domain_rls.sql"
);
const sql = readFileSync(migrationPath, "utf8");

describe("RLS de dominios", () => {
  it("expone solo lectura autenticada en los cuatro dominios", () => {
    expect(sql).toMatch(
      /GRANT SELECT ON TABLE[\s\S]+public\.leads[\s\S]+public\.documentos[\s\S]+public\.tareas[\s\S]+public\.comisiones[\s\S]+TO authenticated/i
    );
    expect(sql).toMatch(
      /REVOKE INSERT, UPDATE, DELETE ON TABLE[\s\S]+FROM authenticated/i
    );
    expect(sql).not.toMatch(/GRANT\s+(?:INSERT|UPDATE|DELETE)[^;]+authenticated/i);
  });

  it.each(["leads", "documentos", "tareas", "comisiones"])(
    "crea una política SELECT autenticada para %s",
    (table) => {
      expect(sql).toMatch(
        new RegExp(
          `CREATE POLICY crm_${table}_read[\\s\\S]+ON public\\.${table}[\\s\\S]+FOR SELECT[\\s\\S]+TO authenticated`,
          "i"
        )
      );
    }
  );

  it("resuelve la cuenta vigente fuera del esquema expuesto", () => {
    expect(sql).toContain("CREATE SCHEMA IF NOT EXISTS private");
    expect(sql).toMatch(/SECURITY DEFINER[\s\S]+SET search_path = pg_catalog/i);
    expect(sql).toMatch(/usuario\.auth_user_id = \(SELECT auth\.uid\(\)\)/i);
    expect(sql).toContain("usuario.estado = 'ACTIVO'");
    expect(sql).toMatch(/auth\.jwt\(\) ->> 'aal'[\s\S]+=\s*'aal2'/i);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION[\s\S]+FROM PUBLIC, anon, authenticated/i);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION[\s\S]+TO authenticated/i);
  });

  it("conserva la matriz de lectura del negocio", () => {
    expect(sql).toMatch(/crm_leads_read[\s\S]+SUPER_ADMIN[\s\S]+ADMIN[\s\S]+EJECUTIVO/i);
    expect(sql).toMatch(/crm_leads_read[\s\S]+AGENTE[\s\S]+asignadoa/i);
    expect(sql).toMatch(/crm_leads_read[\s\S]+CLIENTE[\s\S]+lower\(email\)/i);
    expect(sql).toMatch(/crm_documentos_read[\s\S]+lead_permitido\.id = documentos\.leadid/i);
    expect(sql).toMatch(/crm_tareas_read[\s\S]+AGENTE[\s\S]+asignadoa/i);
    expect(sql).toMatch(/crm_comisiones_read[\s\S]+SUPER_ADMIN[\s\S]+ADMIN/i);
    expect(sql).not.toMatch(/USING\s*\(\s*true\s*\)/i);
  });
});
