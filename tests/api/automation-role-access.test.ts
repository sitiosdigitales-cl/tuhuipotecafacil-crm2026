import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { generarToken } from "@/lib/jwt";
import type { Rol } from "@/tipos";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  fromSupabaseArray: (rows: unknown) => rows,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { GET as getFlujos, POST as postFlujos } from "@/app/api/flujos/route";
import { DELETE as deleteFlujo, PUT as putFlujo } from "@/app/api/flujos/[id]/route";
import { GET as getFlujoHistorial, POST as postFlujoHistorial } from "@/app/api/flujos/[id]/historial/route";
import { GET as getPlantillas, POST as postPlantillas } from "@/app/api/plantillas/route";
import { DELETE as deletePlantilla, PUT as putPlantilla } from "@/app/api/plantillas/[id]/route";
import { GET as getTriggers, POST as postTriggers } from "@/app/api/triggers/route";
import { DELETE as deleteTrigger, PUT as putTrigger } from "@/app/api/triggers/[id]/route";
import { GET as getTriggerHistorial, POST as postTriggerHistorial } from "@/app/api/triggers/[id]/historial/route";

const TEST_SECRET = "automation-role-test-secret-not-for-production";
const originalSecret = process.env.JWT_SECRET;
const ROLES_SIN_AUTOMATIZACION: Rol[] = ["EJECUTIVO", "AGENTE", "CLIENTE"];
const params = { params: Promise.resolve({ id: "automatizacion-uno" }) };

type Method = "GET" | "POST" | "PUT" | "DELETE";

function request(path: string, method: Method, role: Rol) {
  const token = generarToken({
    email: `${role.toLowerCase()}@example.invalid`,
    rol: role,
    userId: `usuario-${role.toLowerCase()}`,
  });

  return new NextRequest(`http://localhost${path}`, {
    body: method === "POST" || method === "PUT" ? JSON.stringify({ nombre: "Prueba" }) : undefined,
    headers: {
      cookie: `crm_token=${token}`,
      "content-type": "application/json",
    },
    method,
  });
}

const operaciones = [
  { nombre: "listar flujos", ejecutar: (rol: Rol) => getFlujos(request("/api/flujos", "GET", rol)) },
  { nombre: "crear flujos", ejecutar: (rol: Rol) => postFlujos(request("/api/flujos", "POST", rol)) },
  { nombre: "editar flujos", ejecutar: (rol: Rol) => putFlujo(request("/api/flujos/uno", "PUT", rol), params) },
  { nombre: "eliminar flujos", ejecutar: (rol: Rol) => deleteFlujo(request("/api/flujos/uno", "DELETE", rol), params) },
  { nombre: "leer historial de flujos", ejecutar: (rol: Rol) => getFlujoHistorial(request("/api/flujos/uno/historial", "GET", rol), params) },
  { nombre: "registrar historial de flujos", ejecutar: (rol: Rol) => postFlujoHistorial(request("/api/flujos/uno/historial", "POST", rol), params) },
  { nombre: "listar triggers", ejecutar: (rol: Rol) => getTriggers(request("/api/triggers", "GET", rol)) },
  { nombre: "crear triggers", ejecutar: (rol: Rol) => postTriggers(request("/api/triggers", "POST", rol)) },
  { nombre: "editar triggers", ejecutar: (rol: Rol) => putTrigger(request("/api/triggers/uno", "PUT", rol), params) },
  { nombre: "eliminar triggers", ejecutar: (rol: Rol) => deleteTrigger(request("/api/triggers/uno", "DELETE", rol), params) },
  { nombre: "leer historial de triggers", ejecutar: (rol: Rol) => getTriggerHistorial(request("/api/triggers/uno/historial", "GET", rol), params) },
  { nombre: "registrar historial de triggers", ejecutar: (rol: Rol) => postTriggerHistorial(request("/api/triggers/uno/historial", "POST", rol), params) },
  { nombre: "listar plantillas", ejecutar: (rol: Rol) => getPlantillas(request("/api/plantillas", "GET", rol)) },
  { nombre: "crear plantillas", ejecutar: (rol: Rol) => postPlantillas(request("/api/plantillas", "POST", rol)) },
  { nombre: "editar plantillas", ejecutar: (rol: Rol) => putPlantilla(request("/api/plantillas/uno", "PUT", rol), params) },
  { nombre: "eliminar plantillas", ejecutar: (rol: Rol) => deletePlantilla(request("/api/plantillas/uno", "DELETE", rol), params) },
] as const;

describe("matriz de roles de automatización", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    from.mockReset();
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it.each(
    operaciones.flatMap((operacion) =>
      ROLES_SIN_AUTOMATIZACION.map((rol) => ({ ...operacion, rol }))
    )
  )("responde 403 al $nombre con rol $rol", async ({ ejecutar, rol }) => {
    expect((await ejecutar(rol)).status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });
});
