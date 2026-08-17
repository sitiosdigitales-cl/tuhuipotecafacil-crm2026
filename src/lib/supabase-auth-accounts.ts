import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getSupabaseAdmin } from "./supabase-admin";

const INACTIVE_BAN_DURATION = "876000h";

export type IdentityMutationResult =
  | { status: "ok" }
  | { status: "email_exists" }
  | { status: "weak_password" };

export type IdentityCreationResult =
  | { status: "created"; user: User }
  | { status: "email_exists" }
  | { status: "weak_password" };

type AdminUpdateAttributes = Parameters<
  SupabaseClient["auth"]["admin"]["updateUserById"]
>[1];

function authErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  return typeof error.code === "string" ? error.code : null;
}

function classifyMutationError(error: unknown): Exclude<IdentityMutationResult, { status: "ok" }> | null {
  const code = authErrorCode(error);
  if (code === "weak_password") return { status: "weak_password" };
  if (code === "email_exists" || code === "user_already_exists") {
    return { status: "email_exists" };
  }
  return null;
}

export async function crearIdentidadAdministrada({
  crmUserId,
  email,
  password,
  active = true,
  adminClient = getSupabaseAdmin(),
}: {
  crmUserId: string;
  email: string;
  password: string;
  active?: boolean;
  adminClient?: SupabaseClient;
}): Promise<IdentityCreationResult> {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { crm_user_id: crmUserId },
    ...(!active ? { ban_duration: INACTIVE_BAN_DURATION } : {}),
  });
  if (error) {
    const classified = classifyMutationError(error);
    if (classified) return classified;
    throw new Error("No se pudo crear la identidad de acceso");
  }
  if (!data.user) throw new Error("Supabase Auth no devolvió la identidad creada");
  return { status: "created", user: data.user };
}

export async function actualizarIdentidadAdministrada({
  authUserId,
  email,
  password,
  active,
  appMetadata,
  adminClient = getSupabaseAdmin(),
}: {
  authUserId: string;
  email?: string;
  password?: string;
  active?: boolean;
  /** Supabase combina estas claves con el `app_metadata` existente. */
  appMetadata?: Record<string, unknown>;
  adminClient?: SupabaseClient;
}): Promise<IdentityMutationResult> {
  const attributes: AdminUpdateAttributes = {};
  if (appMetadata !== undefined) attributes.app_metadata = appMetadata;
  if (email !== undefined) {
    attributes.email = email;
    attributes.email_confirm = true;
  }
  if (password !== undefined) attributes.password = password;
  if (active !== undefined) {
    attributes.ban_duration = active ? "none" : INACTIVE_BAN_DURATION;
  }
  if (Object.keys(attributes).length === 0) return { status: "ok" };

  const { error } = await adminClient.auth.admin.updateUserById(
    authUserId,
    attributes,
  );
  if (error) {
    const classified = classifyMutationError(error);
    if (classified) return classified;
    throw new Error("No se pudo actualizar la identidad de acceso");
  }
  return { status: "ok" };
}

export async function eliminarIdentidadAdministrada(
  authUserId: string,
  adminClient = getSupabaseAdmin(),
): Promise<void> {
  const { error } = await adminClient.auth.admin.deleteUser(authUserId);
  if (error) throw new Error("No se pudo retirar la identidad de acceso");
}
