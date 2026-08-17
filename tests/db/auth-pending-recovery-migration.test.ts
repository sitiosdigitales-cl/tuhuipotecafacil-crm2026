import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationsDirectory = join(process.cwd(), "supabase/migrations");
const migrationNames = readdirSync(migrationsDirectory).filter((fileName) =>
  fileName.endsWith("_auth_identidad_pendiente.sql"),
);
const migrationPath = migrationNames[0]
  ? join(migrationsDirectory, migrationNames[0])
  : null;
const sql = migrationPath ? readFileSync(migrationPath, "utf8") : "";

describe("identidad pendiente para recuperación", () => {
  it("se entrega en una única migración aditiva e idempotente", () => {
    expect(migrationNames).toHaveLength(1);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS auth_pending_user_id UUID/i);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS auth_pending_desde TIMESTAMPTZ/i);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS auth_pending_turno UUID/i);
    expect(sql).toMatch(
      /tiene_password BOOLEAN GENERATED ALWAYS AS\s*\(\s*password IS NOT NULL\s*\) STORED/i,
    );
    expect(sql).toMatch(/DO\s+\$\$[\s\S]+IF NOT EXISTS/i);
  });

  it("impide estados pendientes imposibles y limpia al borrar Auth", () => {
    expect(sql).toMatch(
      /UNIQUE INDEX IF NOT EXISTS[\s\S]+auth_pending_user_id[\s\S]+WHERE auth_pending_user_id IS NOT NULL/i,
    );
    expect(sql).toMatch(
      /FOREIGN KEY\s*\(\s*auth_pending_user_id\s*\)[\s\S]+REFERENCES auth\.users\s*\(\s*id\s*\)[\s\S]+ON DELETE SET NULL/i,
    );
    expect(sql).toMatch(
      /CHECK\s*\(\s*auth_pending_user_id IS NULL OR auth_user_id IS NULL\s*\)/i,
    );
    expect(sql).toMatch(
      /CHECK[\s\S]+auth_pending_turno IS NULL[\s\S]+auth_pending_desde IS NULL/i,
    );
    expect(sql).toMatch(
      /CHECK[\s\S]+auth_pending_user_id IS NULL[\s\S]+auth_pending_turno IS NOT NULL/i,
    );
  });

  it("define reservas exclusivas y un enlace atómico e idempotente", () => {
    for (const functionName of [
      "reservar_identidad_pendiente",
      "registrar_identidad_pendiente",
      "liberar_identidad_pendiente",
      "enlazar_identidad_recuperada",
    ]) {
      expect(sql).toContain(`FUNCTION public.${functionName}`);
    }

    const linkFunction =
      sql.match(
        /CREATE OR REPLACE FUNCTION public\.enlazar_identidad_recuperada[\s\S]+?\$\$;/i,
      )?.[0] ?? "";
    expect(linkFunction).toMatch(/SET[\s\S]+auth_user_id = p_auth_user_id/i);
    expect(linkFunction).toMatch(/password = NULL/i);
    expect(linkFunction).toMatch(/auth_pending_user_id = NULL/i);
    expect(linkFunction).toMatch(
      /auth_pending_user_id = p_auth_user_id[\s\S]+auth_user_id = p_auth_user_id/i,
    );

    for (const functionName of [
      "reservar_identidad_pendiente",
      "registrar_identidad_pendiente",
      "liberar_identidad_pendiente",
    ]) {
      const functionBody =
        sql.match(
          new RegExp(
            `CREATE OR REPLACE FUNCTION public\\.${functionName}[\\s\\S]+?\\$\\$;`,
            "i",
          ),
        )?.[0] ?? "";
      expect(functionBody).not.toMatch(/password\s*=\s*NULL/i);
    }

    const bridgeCompletion =
      sql.match(
        /CREATE OR REPLACE FUNCTION public\.completar_migracion_auth[\s\S]+?\$\$;/i,
      )?.[0] ?? "";
    expect(bridgeCompletion).toMatch(/auth_pending_user_id = NULL/i);
    expect(bridgeCompletion).toMatch(/auth_pending_desde = NULL/i);
    expect(bridgeCompletion).toMatch(/auth_pending_turno = NULL/i);
  });

  it("limita las RPC al backend y abre el turno a cuentas legadas", () => {
    for (const functionName of [
      "reservar_identidad_pendiente",
      "registrar_identidad_pendiente",
      "liberar_identidad_pendiente",
      "enlazar_identidad_recuperada",
    ]) {
      expect(sql).toMatch(
        new RegExp(
          `REVOKE ALL ON FUNCTION public\\.${functionName}[\\s\\S]+FROM PUBLIC, anon, authenticated`,
          "i",
        ),
      );
      expect(sql).toMatch(
        new RegExp(
          `GRANT EXECUTE ON FUNCTION public\\.${functionName}[\\s\\S]+TO service_role`,
          "i",
        ),
      );
    }

    expect(sql.match(/SECURITY DEFINER/gi)?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(
      sql.match(/SET search_path = pg_catalog, public/g)?.length ?? 0,
    ).toBeGreaterThanOrEqual(5);
    expect(sql).toMatch(
      /reclamar_recuperacion_password[\s\S]+AND\s*\(\s*auth_user_id IS NOT NULL OR password IS NOT NULL\s*\)/i,
    );
  });
});
