import type { SupabaseClient, User } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  actualizarIdentidadAdministrada,
  crearIdentidadAdministrada,
  eliminarIdentidadAdministrada,
} from "@/lib/supabase-auth-accounts";

const AUTH_USER = {
  id: "10000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "persona@example.invalid",
  app_metadata: { crm_user_id: "usuario-uno" },
  user_metadata: {},
  created_at: "2026-08-16T00:00:00.000Z",
} as User;

function adminClient({
  createResult = { data: { user: AUTH_USER }, error: null },
  updateResult = { data: { user: AUTH_USER }, error: null },
  deleteResult = { data: { user: null }, error: null },
}: {
  createResult?: unknown;
  updateResult?: unknown;
  deleteResult?: unknown;
} = {}) {
  const createUser = vi.fn().mockResolvedValue(createResult);
  const updateUserById = vi.fn().mockResolvedValue(updateResult);
  const deleteUser = vi.fn().mockResolvedValue(deleteResult);
  return {
    client: {
      auth: { admin: { createUser, updateUserById, deleteUser } },
    } as unknown as SupabaseClient,
    createUser,
    updateUserById,
    deleteUser,
  };
}

describe("ciclo de identidades Supabase Auth", () => {
  it("crea una identidad enlazada y confirmada", async () => {
    const admin = adminClient();

    await expect(
      crearIdentidadAdministrada({
        crmUserId: "usuario-uno",
        email: "persona@example.invalid",
        password: "Synthetic-password-2026!",
        adminClient: admin.client,
      }),
    ).resolves.toEqual({ status: "created", user: AUTH_USER });
    expect(admin.createUser).toHaveBeenCalledWith({
      email: "persona@example.invalid",
      password: "Synthetic-password-2026!",
      email_confirm: true,
      app_metadata: { crm_user_id: "usuario-uno" },
    });
  });

  it.each([
    ["weak_password", "weak_password"],
    ["email_exists", "email_exists"],
    ["user_already_exists", "email_exists"],
  ] as const)("clasifica %s sin filtrar detalles del proveedor", async (code, status) => {
    const admin = adminClient({
      createResult: { data: { user: null }, error: { code } },
    });

    await expect(
      crearIdentidadAdministrada({
        crmUserId: "usuario-uno",
        email: "persona@example.invalid",
        password: "Synthetic-password-2026!",
        adminClient: admin.client,
      }),
    ).resolves.toEqual({ status });
  });

  it("sincroniza correo, contraseña y suspensión en una sola mutación", async () => {
    const admin = adminClient();

    await expect(
      actualizarIdentidadAdministrada({
        authUserId: AUTH_USER.id,
        email: "actualizada@example.invalid",
        password: "Updated-password-2026!",
        active: false,
        adminClient: admin.client,
      }),
    ).resolves.toEqual({ status: "ok" });
    expect(admin.updateUserById).toHaveBeenCalledWith(AUTH_USER.id, {
      email: "actualizada@example.invalid",
      email_confirm: true,
      password: "Updated-password-2026!",
      ban_duration: "876000h",
    });
  });

  it("reactiva una identidad con el valor admitido por Auth", async () => {
    const admin = adminClient();

    await actualizarIdentidadAdministrada({
      authUserId: AUTH_USER.id,
      active: true,
      adminClient: admin.client,
    });

    expect(admin.updateUserById).toHaveBeenCalledWith(AUTH_USER.id, {
      ban_duration: "none",
    });
  });

  it("retira la identidad por su UUID", async () => {
    const admin = adminClient();

    await eliminarIdentidadAdministrada(AUTH_USER.id, admin.client);

    expect(admin.deleteUser).toHaveBeenCalledWith(AUTH_USER.id);
  });
});
