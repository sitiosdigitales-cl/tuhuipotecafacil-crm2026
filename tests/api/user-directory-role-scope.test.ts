import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Rol } from "@/tipos";

const { eq, from, neq, requireAuth } = vi.hoisted(() => ({
  eq: vi.fn(),
  from: vi.fn(),
  neq: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  requireRole: vi.fn(),
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  limpiarParaFiltro: (value: string) => value,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { GET as getUsuarios } from "@/app/api/usuarios/route";
import { GET as getUsuario } from "@/app/api/usuarios/[id]/route";

const USUARIO = {
  apellido: "Soto",
  cargo: "Ejecutiva hipotecaria",
  creadoen: "2026-08-01T12:00:00.000Z",
  email: "elena@example.invalid",
  estado: "ACTIVO",
  id: "usuario-dos",
  nombre: "Elena",
  rol: "EJECUTIVO",
  telefono: "+56911111111",
};

function query() {
  const chain = {
    eq,
    neq,
    or: vi.fn(() => chain),
    order: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue({ data: USUARIO, error: null }),
    then: (resolve: (value: unknown) => void) =>
      resolve({ data: [USUARIO], error: null }),
  };
  eq.mockReturnValue(chain);
  neq.mockReturnValue(chain);
  return chain;
}

function setRole(rol: Rol, userId = "usuario-actual") {
  requireAuth.mockReturnValue({
    email: `${userId}@example.invalid`,
    rol,
    userId,
  });
}

function request(path: string) {
  return new NextRequest(`http://localhost${path}`);
}

describe("directorio de usuarios por rol", () => {
  beforeEach(() => {
    eq.mockReset();
    from.mockReset();
    neq.mockReset();
    requireAuth.mockReset();
    from.mockImplementation(() => query());
  });

  it("CLIENTE no consulta la colección ni perfiles arbitrarios", async () => {
    setRole("CLIENTE");

    const collection = await getUsuarios(request("/api/usuarios"));
    const detail = await getUsuario(
      request("/api/usuarios/usuario-dos"),
      { params: Promise.resolve({ id: "usuario-dos" }) }
    );

    expect(collection.status).toBe(403);
    expect(detail.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });

  it("AGENTE recibe solamente su propio perfil", async () => {
    setRole("AGENTE", "agente-uno");

    const collection = await getUsuarios(request("/api/usuarios"));
    const otherDetail = await getUsuario(
      request("/api/usuarios/usuario-dos"),
      { params: Promise.resolve({ id: "usuario-dos" }) }
    );

    expect(collection.status).toBe(200);
    expect(eq).toHaveBeenCalledWith("id", "agente-uno");
    expect(otherDetail.status).toBe(403);
  });

  it("EJECUTIVO recibe solo el directorio activo sin teléfonos", async () => {
    setRole("EJECUTIVO");

    const response = await getUsuarios(request("/api/usuarios"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(eq).toHaveBeenCalledWith("estado", "ACTIVO");
    expect(neq).toHaveBeenCalledWith("rol", "CLIENTE");
    expect(payload.data[0]).not.toHaveProperty("telefono");
  });

  it("ADMIN conserva la vista administrativa completa", async () => {
    setRole("ADMIN");

    const response = await getUsuarios(request("/api/usuarios"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data[0].telefono).toBe("+56911111111");
  });
});
