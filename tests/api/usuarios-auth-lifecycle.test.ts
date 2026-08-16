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
vi.mock("bcryptjs", () => ({ default: { hash } }));
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

const AUTH_USER_ID = "10000000-0000-4000-8000-000000000001";
const CURRENT = {
  id: "usuario-uno",
  nombre: "Persona",
  apellido: "Ejemplo",
  email: "persona@example.invalid",
  telefono: null,
  rol: "EJECUTIVO",
  estado: "ACTIVO",
  cargo: null,
  creadoen: "2026-08-16T00:00:00.000Z",
  password: null,
  auth_user_id: AUTH_USER_ID,
  auth_migrated_at: "2026-08-16T00:00:00.000Z",
};

function request(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    ...(body === undefined
      ? {}
      : {
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        }),
  });
}

function selectSingle(result: unknown) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue(result) })),
    })),
  };
}

function selectMaybeSingle(result: unknown) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue(result) })),
    })),
  };
}

function updateResult(result: unknown = { data: null, error: null }) {
  const update = vi.fn(() => ({ eq: vi.fn().mockResolvedValue(result) }));
  return { update, source: { update } };
}

beforeEach(() => {
  actualizarIdentidadAdministrada.mockReset();
  crearIdentidadAdministrada.mockReset();
  eliminarIdentidadAdministrada.mockReset();
  from.mockReset();
  hash.mockReset();
  obtenerModoSupabaseAuth.mockReset();
  requireRole.mockReset();
  obtenerModoSupabaseAuth.mockReturnValue("bridge");
  requireRole.mockReturnValue({ rol: "SUPER_ADMIN", userId: "admin-uno" });
  actualizarIdentidadAdministrada.mockResolvedValue({ status: "ok" });
  crearIdentidadAdministrada.mockResolvedValue({
    status: "created",
    user: { id: AUTH_USER_ID },
  });
  eliminarIdentidadAdministrada.mockResolvedValue(undefined);
});

describe("ciclo de cuentas con Supabase Auth", () => {
  it("crea Auth primero y guarda la cuenta sin hash duplicado", async () => {
    const lookup = selectMaybeSingle({ data: null, error: null });
    const insertSingle = vi.fn().mockResolvedValue({
      data: { id: "usuario-nuevo", email: "nueva@example.invalid" },
      error: null,
    });
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({ single: insertSingle })),
    }));
    from.mockReturnValueOnce(lookup).mockReturnValueOnce({ insert });

    const response = await POST(
      request("/api/usuarios", "POST", {
        nombre: "Cuenta",
        apellido: "Nueva",
        email: "Nueva@Example.invalid",
        password: "Nueva-password-2026!",
        rol: "EJECUTIVO",
      }),
    );

    expect(response.status).toBe(201);
    expect(hash).not.toHaveBeenCalled();
    expect(crearIdentidadAdministrada).toHaveBeenCalledWith({
      crmUserId: expect.any(String),
      email: "nueva@example.invalid",
      password: "Nueva-password-2026!",
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        auth_user_id: AUTH_USER_ID,
        password: null,
      }),
    );
  });

  it("retira la identidad nueva si la fila CRM no se crea", async () => {
    const lookup = selectMaybeSingle({ data: null, error: null });
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: { code: "db_error" } }),
      })),
    }));
    from.mockReturnValueOnce(lookup).mockReturnValueOnce({ insert });

    const response = await POST(
      request("/api/usuarios", "POST", {
        nombre: "Cuenta",
        apellido: "Nueva",
        email: "nueva@example.invalid",
        password: "Nueva-password-2026!",
        rol: "EJECUTIVO",
      }),
    );

    expect(response.status).toBe(500);
    expect(eliminarIdentidadAdministrada).toHaveBeenCalledWith(AUTH_USER_ID);
  });

  it("retira la identidad y responde conflicto si otro alta gana el correo", async () => {
    const lookup = selectMaybeSingle({ data: null, error: null });
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "23505" },
        }),
      })),
    }));
    from.mockReturnValueOnce(lookup).mockReturnValueOnce({ insert });

    const response = await POST(
      request("/api/usuarios", "POST", {
        nombre: "Cuenta",
        apellido: "Nueva",
        email: "nueva@example.invalid",
        password: "Nueva-password-2026!",
        rol: "EJECUTIVO",
      }),
    );

    expect(response.status).toBe(409);
    expect(eliminarIdentidadAdministrada).toHaveBeenCalledWith(AUTH_USER_ID);
  });

  it("no crea Auth si no puede comprobar el correo existente", async () => {
    from.mockReturnValueOnce(
      selectMaybeSingle({ data: null, error: { code: "synthetic_lookup_error" } }),
    );

    const response = await POST(
      request("/api/usuarios", "POST", {
        nombre: "Cuenta",
        apellido: "Nueva",
        email: "nueva@example.invalid",
        password: "Nueva-password-2026!",
        rol: "EJECUTIVO",
      }),
    );

    expect(response.status).toBe(500);
    expect(crearIdentidadAdministrada).not.toHaveBeenCalled();
  });

  it("sincroniza correo y contraseña de una identidad enlazada", async () => {
    const update = updateResult();
    const final = selectSingle({
      data: { ...CURRENT, email: "actualizada@example.invalid" },
      error: null,
    });
    from
      .mockReturnValueOnce(selectSingle({ data: CURRENT, error: null }))
      .mockReturnValueOnce(update.source)
      .mockReturnValueOnce(final);

    const response = await PUT(
      request("/api/usuarios/usuario-uno", "PUT", {
        email: "actualizada@example.invalid",
        password: "Actualizada-password-2026!",
      }),
      { params: Promise.resolve({ id: "usuario-uno" }) },
    );

    expect(response.status).toBe(200);
    expect(hash).not.toHaveBeenCalled();
    expect(actualizarIdentidadAdministrada).toHaveBeenCalledWith({
      authUserId: AUTH_USER_ID,
      email: "actualizada@example.invalid",
      password: "Actualizada-password-2026!",
      active: undefined,
    });
  });

  it("migra una cuenta sin enlace cuando administración cambia su contraseña", async () => {
    const update = updateResult();
    const final = selectSingle({ data: { ...CURRENT }, error: null });
    from
      .mockReturnValueOnce(selectSingle({
        data: { ...CURRENT, auth_user_id: null, password: "hash-legado" },
        error: null,
      }))
      .mockReturnValueOnce(update.source)
      .mockReturnValueOnce(final);

    const response = await PUT(
      request("/api/usuarios/usuario-uno", "PUT", {
        password: "Migrada-password-2026!",
      }),
      { params: Promise.resolve({ id: "usuario-uno" }) },
    );

    expect(response.status).toBe(200);
    expect(crearIdentidadAdministrada).toHaveBeenCalledWith({
      crmUserId: "usuario-uno",
      email: CURRENT.email,
      password: "Migrada-password-2026!",
      active: true,
    });
    expect(update.update).toHaveBeenCalledWith(
      expect.objectContaining({ auth_user_id: AUTH_USER_ID, password: null }),
    );
  });

  it("revierte el correo CRM si Auth rechaza la actualización", async () => {
    actualizarIdentidadAdministrada.mockResolvedValue({ status: "email_exists" });
    const update = updateResult();
    const rollback = updateResult();
    from
      .mockReturnValueOnce(selectSingle({ data: CURRENT, error: null }))
      .mockReturnValueOnce(update.source)
      .mockReturnValueOnce(rollback.source);

    const response = await PUT(
      request("/api/usuarios/usuario-uno", "PUT", {
        email: "ocupada@example.invalid",
      }),
      { params: Promise.resolve({ id: "usuario-uno" }) },
    );

    expect(response.status).toBe(409);
    expect(rollback.update).toHaveBeenCalledWith({ email: CURRENT.email });
  });

  it("responde conflicto sin tocar Auth si el correo CRM ya existe", async () => {
    const update = updateResult({ data: null, error: { code: "23505" } });
    from
      .mockReturnValueOnce(selectSingle({ data: CURRENT, error: null }))
      .mockReturnValueOnce(update.source);

    const response = await PUT(
      request("/api/usuarios/usuario-uno", "PUT", {
        email: "ocupada@example.invalid",
      }),
      { params: Promise.resolve({ id: "usuario-uno" }) },
    );

    expect(response.status).toBe(409);
    expect(actualizarIdentidadAdministrada).not.toHaveBeenCalled();
  });

  it("reactiva la fila y retira la suspensión de Auth", async () => {
    const update = updateResult();
    const final = selectSingle({
      data: { ...CURRENT, estado: "ACTIVO" },
      error: null,
    });
    from
      .mockReturnValueOnce(selectSingle({
        data: { ...CURRENT, estado: "INACTIVO" },
        error: null,
      }))
      .mockReturnValueOnce(update.source)
      .mockReturnValueOnce(final);

    const response = await PUT(
      request("/api/usuarios/usuario-uno", "PUT", { estado: "ACTIVO" }),
      { params: Promise.resolve({ id: "usuario-uno" }) },
    );

    expect(response.status).toBe(200);
    expect(actualizarIdentidadAdministrada).toHaveBeenCalledWith({
      authUserId: AUTH_USER_ID,
      email: undefined,
      password: undefined,
      active: true,
    });
  });

  it("desactiva la fila y bloquea la identidad enlazada", async () => {
    const update = updateResult();
    from
      .mockReturnValueOnce(selectSingle({ data: CURRENT, error: null }))
      .mockReturnValueOnce(update.source);

    const response = await DELETE(
      request("/api/usuarios/usuario-uno", "DELETE"),
      { params: Promise.resolve({ id: "usuario-uno" }) },
    );

    expect(response.status).toBe(200);
    expect(update.update).toHaveBeenCalledWith({ estado: "INACTIVO" });
    expect(actualizarIdentidadAdministrada).toHaveBeenCalledWith({
      authUserId: AUTH_USER_ID,
      active: false,
    });
  });

  it("bloquea la eliminación directa de una identidad enlazada", async () => {
    from.mockReturnValueOnce(selectSingle({ data: CURRENT, error: null }));

    const response = await DELETE(
      request("/api/usuarios/usuario-uno?hard=true", "DELETE"),
      { params: Promise.resolve({ id: "usuario-uno" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.code).toBe("AUTH_HARD_DELETE_UNAVAILABLE");
    expect(actualizarIdentidadAdministrada).not.toHaveBeenCalled();
  });
});
