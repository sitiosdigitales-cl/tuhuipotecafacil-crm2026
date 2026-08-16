import { describe, expect, it, vi } from "vitest";

import { bootstrapAdmin } from "../../scripts/bootstrap-admin.mjs";

const AUTH_USER_ID = "10000000-0000-4000-8000-000000000001";
const BASE_ENV = {
  BOOTSTRAP_CONFIRM: "RESET_SUPER_ADMIN",
  NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.supabase.invalid",
  SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-role",
  BOOTSTRAP_ADMIN_EMAIL: "admin@example.invalid",
  BOOTSTRAP_ADMIN_PASSWORD: "Synthetic-Access-2026!",
  BOOTSTRAP_ADMIN_NAME: "Cuenta",
  BOOTSTRAP_ADMIN_LAST_NAME: "Administradora",
};

function lookupSource(result) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  return { source: { select }, select };
}

function insertSource(result = { error: null }) {
  const insert = vi.fn().mockResolvedValue(result);
  return { source: { insert }, insert };
}

function updateSource(result = { error: null }) {
  const eq = vi.fn().mockResolvedValue(result);
  const update = vi.fn(() => ({ eq }));
  return { source: { update }, update };
}

function authAdmin() {
  return {
    createUser: vi.fn().mockResolvedValue({
      data: { user: { id: AUTH_USER_ID } },
      error: null,
    }),
    updateUserById: vi.fn().mockResolvedValue({ error: null }),
    deleteUser: vi.fn().mockResolvedValue({ error: null }),
    listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
  };
}

describe("bootstrap administrativo por modo de autenticación", () => {
  it("conserva bcrypt y no consulta Auth en modo legacy", async () => {
    const lookup = lookupSource({ data: null, error: null });
    const inserted = insertSource();
    const admin = authAdmin();
    const client = {
      auth: { admin },
      from: vi.fn()
        .mockReturnValueOnce(lookup.source)
        .mockReturnValueOnce(inserted.source),
    };
    const clientFactory = vi.fn(() => client);
    const hashPassword = vi.fn().mockResolvedValue("synthetic-hash");

    await expect(
      bootstrapAdmin(BASE_ENV, { clientFactory, hashPassword }),
    ).resolves.toEqual({ created: true });

    expect(lookup.select).toHaveBeenCalledWith("id");
    expect(hashPassword).toHaveBeenCalledWith(BASE_ENV.BOOTSTRAP_ADMIN_PASSWORD);
    expect(admin.createUser).not.toHaveBeenCalled();
    expect(inserted.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        password: "synthetic-hash",
        rol: "SUPER_ADMIN",
        estado: "ACTIVO",
      }),
    );
    expect(inserted.insert.mock.calls[0][0]).not.toHaveProperty("auth_user_id");
  });

  it("crea y enlaza Auth sin duplicar el hash en bridge", async () => {
    const lookup = lookupSource({ data: null, error: null });
    const inserted = insertSource();
    const admin = authAdmin();
    const client = {
      auth: { admin },
      from: vi.fn()
        .mockReturnValueOnce(lookup.source)
        .mockReturnValueOnce(inserted.source),
    };
    const hashPassword = vi.fn();

    await expect(
      bootstrapAdmin(
        { ...BASE_ENV, SUPABASE_AUTH_MODE: "bridge" },
        { clientFactory: () => client, hashPassword },
      ),
    ).resolves.toEqual({ created: true });

    expect(lookup.select).toHaveBeenCalledWith("id,auth_user_id");
    expect(hashPassword).not.toHaveBeenCalled();
    expect(admin.createUser).toHaveBeenCalledWith({
      email: BASE_ENV.BOOTSTRAP_ADMIN_EMAIL,
      password: BASE_ENV.BOOTSTRAP_ADMIN_PASSWORD,
      email_confirm: true,
      app_metadata: { crm_user_id: expect.any(String) },
    });
    expect(inserted.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        password: null,
        auth_user_id: AUTH_USER_ID,
        auth_migrated_at: expect.any(String),
      }),
    );
  });

  it("reactiva la identidad enlazada y renueva su contraseña", async () => {
    const lookup = lookupSource({
      data: { id: "admin-crm", auth_user_id: AUTH_USER_ID },
      error: null,
    });
    const updated = updateSource();
    const admin = authAdmin();
    const client = {
      auth: { admin },
      from: vi.fn()
        .mockReturnValueOnce(lookup.source)
        .mockReturnValueOnce(updated.source),
    };

    await expect(
      bootstrapAdmin(
        { ...BASE_ENV, SUPABASE_AUTH_MODE: "required" },
        { clientFactory: () => client },
      ),
    ).resolves.toEqual({ created: false });

    expect(admin.updateUserById).toHaveBeenCalledWith(AUTH_USER_ID, {
      email: BASE_ENV.BOOTSTRAP_ADMIN_EMAIL,
      password: BASE_ENV.BOOTSTRAP_ADMIN_PASSWORD,
      email_confirm: true,
      ban_duration: "none",
      app_metadata: { crm_user_id: "admin-crm" },
    });
    expect(updated.update).toHaveBeenCalledWith(
      expect.objectContaining({
        password: null,
        auth_user_id: AUTH_USER_ID,
        estado: "ACTIVO",
      }),
    );
  });

  it("retira la identidad recién creada si falla la fila de negocio", async () => {
    const lookup = lookupSource({ data: null, error: null });
    const inserted = insertSource({ error: { message: "synthetic-db-error" } });
    const admin = authAdmin();
    const client = {
      auth: { admin },
      from: vi.fn()
        .mockReturnValueOnce(lookup.source)
        .mockReturnValueOnce(inserted.source),
    };

    await expect(
      bootstrapAdmin(
        { ...BASE_ENV, SUPABASE_AUTH_MODE: "bridge" },
        { clientFactory: () => client },
      ),
    ).rejects.toThrow("No se pudo preparar la cuenta");
    expect(admin.deleteUser).toHaveBeenCalledWith(AUTH_USER_ID);
  });
});
