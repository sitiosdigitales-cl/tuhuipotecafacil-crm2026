import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  actualizarIdentidadAdministrada,
  crearIdentidadAdministrada,
  eliminarIdentidadAdministrada,
  from,
  hash,
  obtenerModoSupabaseAuth,
  requireRole,
} = vi.hoisted(() => ({
  actualizarIdentidadAdministrada: vi.fn(),
  crearIdentidadAdministrada: vi.fn(),
  eliminarIdentidadAdministrada: vi.fn(),
  from: vi.fn(),
  hash: vi.fn(),
  obtenerModoSupabaseAuth: vi.fn(),
  requireRole: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("bcryptjs", () => ({
  default: { hash },
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => Response.json({ success: false }, { status: 403 }),
  requireAuth: vi.fn(),
  requireRole,
  unauthorized: () => Response.json({ success: false }, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  limpiarParaFiltro: (value: string) => value,
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));
vi.mock("@/lib/supabase-auth", () => ({ obtenerModoSupabaseAuth }));
vi.mock("@/lib/supabase-auth-accounts", () => ({
  actualizarIdentidadAdministrada,
  crearIdentidadAdministrada,
  eliminarIdentidadAdministrada,
}));

import { POST } from "@/app/api/usuarios/route";
import { DELETE, PUT } from "@/app/api/usuarios/[id]/route";

const validUser = {
  apellido: "Pérez",
  email: "Persona@Example.invalid",
  nombre: "Persona",
  password: "Una-frase-segura-2026!",
  rol: "EJECUTIVO",
};

function jsonRequest(path: string, method: "POST" | "PUT", body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method,
  });
}

describe("escritura de usuarios", () => {
  beforeEach(() => {
    from.mockReset();
    hash.mockReset();
    obtenerModoSupabaseAuth.mockReset();
    requireRole.mockReset();
    actualizarIdentidadAdministrada.mockReset();
    crearIdentidadAdministrada.mockReset();
    eliminarIdentidadAdministrada.mockReset();
    obtenerModoSupabaseAuth.mockReturnValue("legacy");
    requireRole.mockReturnValue({ rol: "SUPER_ADMIN", userId: "admin-uno" });
  });

  it.each([
    { body: { ...validUser, password: "muy-corta" }, caseName: "contraseña corta" },
    { body: { ...validUser, password: "solo-minusculas-2026!" }, caseName: "contraseña sin mayúscula" },
    { body: { ...validUser, password: "SOLO-MAYUSCULAS-2026!" }, caseName: "contraseña sin minúscula" },
    { body: { ...validUser, password: "Sin-numeros-suficiente!" }, caseName: "contraseña sin número" },
    { body: { ...validUser, password: "SinSimboloSeguro2026" }, caseName: "contraseña sin símbolo" },
    { body: { ...validUser, rol: "GERENTE" }, caseName: "rol fuera del catálogo" },
    { body: { ...validUser, email: "correo-invalido" }, caseName: "email inválido" },
  ])("rechaza creación con $caseName", async ({ body }) => {
    const response = await POST(jsonRequest("/api/usuarios", "POST", body));

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
    expect(hash).not.toHaveBeenCalled();
  });

  it.each([
    { body: { password: "muy-corta" }, caseName: "contraseña corta" },
    { body: { rol: "GERENTE" }, caseName: "rol fuera del catálogo" },
    { body: { estado: "ELIMINADO" }, caseName: "estado fuera del catálogo" },
    { body: {}, caseName: "cuerpo vacío" },
  ])("rechaza actualización con $caseName", async ({ body }) => {
    const response = await PUT(
      jsonRequest("/api/usuarios/usuario-uno", "PUT", body),
      { params: Promise.resolve({ id: "usuario-uno" }) }
    );

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
    expect(hash).not.toHaveBeenCalled();
  });

  it("exige JSON en la creación", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/usuarios", {
        body: JSON.stringify(validUser),
        method: "POST",
      })
    );

    expect(response.status).toBe(415);
    expect(from).not.toHaveBeenCalled();
  });

  it.each([
    { body: { rol: "ADMIN" }, caseName: "degradar su rol" },
    { body: { estado: "SUSPENDIDO" }, caseName: "suspender su cuenta" },
    { body: { estado: "INACTIVO" }, caseName: "inhabilitar su cuenta" },
  ])("impide al SUPER_ADMIN $caseName", async ({ body }) => {
    const response = await PUT(
      jsonRequest("/api/usuarios/admin-uno", "PUT", body),
      { params: Promise.resolve({ id: "admin-uno" }) }
    );

    expect(response.status).toBe(409);
    expect(from).not.toHaveBeenCalled();
  });

  it("impide al SUPER_ADMIN eliminar su propia cuenta", async () => {
    const response = await DELETE(
      new NextRequest("http://localhost/api/usuarios/admin-uno", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "admin-uno" }) }
    );

    expect(response.status).toBe(409);
    expect(from).not.toHaveBeenCalled();
  });

  it("rechaza un cuerpo mayor a 8 KiB antes de consultar datos", async () => {
    const response = await POST(
      jsonRequest("/api/usuarios", "POST", {
        ...validUser,
        nombre: "x".repeat(9 * 1024),
      })
    );

    expect(response.status).toBe(413);
    expect(from).not.toHaveBeenCalled();
  });

  it("normaliza y guarda una creación válida con costo 12", async () => {
    const lookupSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const insertSingle = vi.fn().mockResolvedValue({
      data: {
        apellido: "Pérez",
        email: "persona@example.invalid",
        estado: "ACTIVO",
        id: "usuario-nuevo",
        nombre: "Persona",
        rol: "EJECUTIVO",
      },
      error: null,
    });
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({ single: insertSingle })),
    }));
    from
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: lookupSingle })),
        })),
      })
      .mockReturnValueOnce({ insert });
    hash.mockResolvedValue("hash-seguro");

    const response = await POST(
      jsonRequest("/api/usuarios", "POST", validUser)
    );

    expect(response.status).toBe(201);
    expect(hash).toHaveBeenCalledWith(validUser.password, 12);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "persona@example.invalid",
        password: "hash-seguro",
        rol: "EJECUTIVO",
      })
    );
  });
});
