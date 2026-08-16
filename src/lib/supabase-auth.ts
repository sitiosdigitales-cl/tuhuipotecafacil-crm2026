import "server-only";

import { randomUUID } from "node:crypto";

import {
  createClient,
  type Session,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

import { getSupabaseAdmin } from "./supabase-admin";

export type SupabaseAuthMode = "legacy" | "bridge" | "required";

export type SupabaseAuthenticationResult =
  | { status: "authenticated"; authUserId: string; session: Session }
  | { status: "invalid" };

export type SupabaseMigrationResult =
  | { status: "authenticated"; authUserId: string; session: Session }
  | { status: "busy" }
  | { status: "password_upgrade_required" }
  | { status: "identity_conflict" };

interface LegacyIdentity {
  id: string;
  email: string;
}

function authErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  return typeof error.code === "string" ? error.code : null;
}

function createRequestAuthClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL no configurada");
  if (!anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada");

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function obtenerModoSupabaseAuth(): SupabaseAuthMode {
  const configuredMode = process.env.SUPABASE_AUTH_MODE;
  if (!configuredMode) return "legacy";
  if (
    configuredMode !== "legacy" &&
    configuredMode !== "bridge" &&
    configuredMode !== "required"
  ) {
    throw new Error("SUPABASE_AUTH_MODE no es válido");
  }
  return configuredMode;
}

export function puenteSupabaseAuthVigente(now = new Date()): boolean {
  const rawDeadline = process.env.SUPABASE_AUTH_BRIDGE_DEADLINE;
  if (!rawDeadline) {
    throw new Error("SUPABASE_AUTH_BRIDGE_DEADLINE no configurada");
  }

  const deadline = new Date(rawDeadline);
  if (Number.isNaN(deadline.getTime())) {
    throw new Error("SUPABASE_AUTH_BRIDGE_DEADLINE no es una fecha válida");
  }
  const maxDeadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000);
  if (deadline > maxDeadline) {
    throw new Error("SUPABASE_AUTH_BRIDGE_DEADLINE no puede superar 30 días");
  }
  return now < deadline;
}

export async function autenticarIdentidadSupabase({
  email,
  password,
  expectedAuthUserId,
  authClient = createRequestAuthClient(),
}: {
  email: string;
  password: string;
  expectedAuthUserId: string;
  authClient?: SupabaseClient;
}): Promise<SupabaseAuthenticationResult> {
  const { data, error } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (authErrorCode(error) === "invalid_credentials") {
      return { status: "invalid" };
    }
    throw new Error("Supabase Auth no pudo validar la identidad");
  }
  if (!data.user || !data.session || data.user.id !== expectedAuthUserId) {
    throw new Error("La identidad autenticada no coincide con la cuenta CRM");
  }

  return {
    status: "authenticated",
    authUserId: data.user.id,
    session: data.session,
  };
}

async function findAuthUserByEmail(
  adminClient: SupabaseClient,
  email: string,
): Promise<User | null> {
  const normalizedEmail = email.toLowerCase();
  const perPage = 1_000;

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw new Error("No se pudo reconciliar la identidad existente");

    const found = data.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail,
    );
    if (found) return found;
    if (data.users.length < perPage) return null;
  }

  throw new Error("El directorio de Auth excede el límite de reconciliación");
}

async function releaseClaim(
  adminClient: SupabaseClient,
  identity: LegacyIdentity,
  claimToken: string,
) {
  try {
    await adminClient.rpc("liberar_migracion_auth", {
      p_usuario_id: identity.id,
      p_token: claimToken,
    });
  } catch {
    // El claim vence en diez minutos. Una limpieza fallida no debe ocultar el
    // resultado original ni permitir un segundo claim inmediatamente.
  }
}

export async function revocarSesionSupabase(
  accessToken: string,
  adminClient = getSupabaseAdmin(),
): Promise<void> {
  const { error } = await adminClient.auth.admin.signOut(accessToken, "global");
  if (error) throw new Error("No se pudo revocar la sesión de Supabase Auth");
}

export async function migrarIdentidadSupabase({
  identity,
  password,
  adminClient = getSupabaseAdmin(),
  authClient = createRequestAuthClient(),
  tokenFactory = randomUUID,
}: {
  identity: LegacyIdentity;
  password: string;
  adminClient?: SupabaseClient;
  authClient?: SupabaseClient;
  tokenFactory?: () => string;
}): Promise<SupabaseMigrationResult> {
  const claimToken = tokenFactory();
  const { data: claimed, error: claimError } = await adminClient.rpc(
    "reclamar_migracion_auth",
    {
      p_usuario_id: identity.id,
      p_token: claimToken,
    },
  );
  if (claimError) throw new Error("No se pudo reclamar la migración de identidad");
  if (claimed !== true) return { status: "busy" };

  let authUser: User | null = null;
  let createdByThisRequest = false;
  let completed = false;

  try {
    const created = await adminClient.auth.admin.createUser({
      email: identity.email,
      password,
      email_confirm: true,
      app_metadata: { crm_user_id: identity.id },
    });

    if (created.error) {
      const code = authErrorCode(created.error);
      if (code === "weak_password") {
        return { status: "password_upgrade_required" };
      }
      if (code !== "email_exists" && code !== "user_already_exists") {
        throw new Error("No se pudo crear la identidad en Supabase Auth");
      }

      authUser = await findAuthUserByEmail(adminClient, identity.email);
      if (authUser?.app_metadata?.crm_user_id !== identity.id) {
        return { status: "identity_conflict" };
      }
    } else {
      authUser = created.data.user;
      createdByThisRequest = true;
    }

    if (!authUser) throw new Error("Supabase Auth no devolvió la identidad creada");

    const authenticated = await autenticarIdentidadSupabase({
      email: identity.email,
      password,
      expectedAuthUserId: authUser.id,
      authClient,
    });
    if (authenticated.status !== "authenticated") {
      throw new Error("La identidad creada no aceptó la credencial verificada");
    }

    const { error: completionError } = await adminClient.rpc(
      "completar_migracion_auth",
      {
        p_usuario_id: identity.id,
        p_token: claimToken,
        p_auth_user_id: authUser.id,
      },
    );
    if (completionError) {
      throw new Error("No se pudo completar la migración de identidad");
    }

    completed = true;
    return authenticated;
  } catch (error) {
    if (createdByThisRequest && authUser) {
      try {
        await adminClient.auth.admin.deleteUser(authUser.id);
      } catch {
        // Un siguiente intento reconcilia por crm_user_id. El error original
        // conserva prioridad y el claim expira aunque falle esta limpieza.
      }
    }
    throw error;
  } finally {
    if (!completed) {
      await releaseClaim(adminClient, identity, claimToken);
    }
  }
}
