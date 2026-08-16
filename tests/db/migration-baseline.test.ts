import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const baselinePath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260813000000_application_schema.sql",
);

const requiredTables = [
  "actividades",
  "auditoria",
  "bancos",
  "biblioteca",
  "campanas",
  "comisiones",
  "conversaciones",
  "documentos",
  "eventos",
  "flujo_ejecuciones",
  "flujos",
  "integraciones",
  "leads",
  "mensajes",
  "mensajes_whatsapp",
  "notificaciones",
  "pipeline_stages",
  "plantillas",
  "preferencias_notificacion",
  "recordatorios",
  "solicitudes",
  "tareas",
  "trigger_ejecuciones",
  "triggers",
  "usuarios",
  "whatsapp_estadisticas",
] as const;

describe("baseline de Supabase", () => {
  it("declara las tablas que usa la aplicación", () => {
    const sql = readFileSync(baselinePath, "utf8").toLowerCase();
    const missingTables = requiredTables.filter(
      (table) => !sql.includes(`create table public.${table} (`),
    );

    expect(missingTables).toEqual([]);
  });

  it("no incorpora políticas permisivas", () => {
    const sql = readFileSync(baselinePath, "utf8");

    expect(sql).not.toMatch(/create\s+policy/i);
    expect(sql).not.toMatch(/using\s*\(\s*true\s*\)/i);
    expect(sql).not.toMatch(/row\s+level\s+politics/i);
  });
});
