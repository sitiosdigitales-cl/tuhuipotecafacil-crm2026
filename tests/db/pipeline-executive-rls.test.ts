import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/20260822000000_ejecutivo_cartera_asignada.sql"),
  "utf8",
);

describe("RLS de cartera por ejecutivo", () => {
  it("mantiene visión global solo para administración", () => {
    expect(sql).toMatch(/crm_current_user_role\(\)\) IN \('SUPER_ADMIN', 'ADMIN'\)/i);
  });

  it("exige asignación tanto a EJECUTIVO como a AGENTE", () => {
    expect(sql).toMatch(/IN \('EJECUTIVO', 'AGENTE'\)[\s\S]+asignadoa\s*=\s*\(SELECT private\.crm_current_user_id\(\)\)/i);
  });

  it("conserva al cliente limitado por su correo", () => {
    expect(sql).toMatch(/crm_current_user_role\(\)\) = 'CLIENTE'[\s\S]+lower\(email\)/i);
  });
});
