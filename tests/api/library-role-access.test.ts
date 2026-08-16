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

import { GET, POST } from "@/app/api/biblioteca/route";
import { DELETE, PUT } from "@/app/api/biblioteca/[id]/route";

const TEST_SECRET = "library-role-test-secret-not-for-production";
const originalSecret = process.env.JWT_SECRET;
const ROLES_SIN_BIBLIOTECA: Rol[] = ["EJECUTIVO", "AGENTE", "CLIENTE"];
const params = { params: Promise.resolve({ id: "recurso-uno" }) };

function request(method: "GET" | "POST" | "PUT" | "DELETE", role: Rol) {
  const token = generarToken({
    email: `${role.toLowerCase()}@example.invalid`,
    rol: role,
    userId: `usuario-${role.toLowerCase()}`,
  });
  const detail = method === "PUT" || method === "DELETE";

  return new NextRequest(
    `http://localhost/api/biblioteca${detail ? "/recurso-uno" : ""}`,
    {
      body:
        method === "POST" || method === "PUT"
          ? JSON.stringify({ nombre: "Recurso de prueba" })
          : undefined,
      headers: {
        cookie: `crm_token=${token}`,
        "content-type": "application/json",
      },
      method,
    }
  );
}

describe("matriz de roles de biblioteca", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    from.mockReset();
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it.each(ROLES_SIN_BIBLIOTECA)("responde 403 al listar con rol %s", async (role) => {
    expect((await GET(request("GET", role))).status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });

  it.each(ROLES_SIN_BIBLIOTECA)("responde 403 al crear con rol %s", async (role) => {
    expect((await POST(request("POST", role))).status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });

  it.each(ROLES_SIN_BIBLIOTECA)("responde 403 al editar con rol %s", async (role) => {
    expect((await PUT(request("PUT", role), params)).status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });

  it.each(ROLES_SIN_BIBLIOTECA)("responde 403 al eliminar con rol %s", async (role) => {
    expect((await DELETE(request("DELETE", role), params)).status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });
});
