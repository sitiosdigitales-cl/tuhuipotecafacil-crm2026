import "server-only";

import {
  createClient,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { authenticateRequest, type TokenPayload } from "./jwt";
import { getSupabaseAdmin } from "./supabase-admin";
import { obtenerModoSupabaseAuth, type SupabaseAuthMode } from "./supabase-auth";
import { obtenerRequisitoMfaSupabase, rolRequiereMfa } from "./supabase-mfa";
import {
  SUPABASE_ACCESS_COOKIE,
  SUPABASE_REFRESH_COOKIE,
} from "./session-cookie";

interface CuentaSesion {
  id: string;
  email: string;
  rol: string;
  estado: string;
  auth_user_id?: string | null;
}

interface SessionValidationDependencies {
  mode?: SupabaseAuthMode;
  authClient?: SupabaseClient;
  adminClient?: SupabaseClient;
}

export interface SesionSolicitudRenovada {
  payload: TokenPayload;
  session: Session;
}

function crearClienteValidacion(): SupabaseClient {
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

function errorDeSesionInvalida(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("status" in error)) return false;
  return typeof error.status === "number" && error.status >= 400 && error.status < 500;
}

function filaNoEncontrada(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "PGRST116",
  );
}

function payloadCuenta(cuenta: CuentaSesion): TokenPayload | null {
  if (
    cuenta.estado !== "ACTIVO" ||
    typeof cuenta.id !== "string" ||
    typeof cuenta.email !== "string" ||
    typeof cuenta.rol !== "string"
  ) {
    return null;
  }
  return { userId: cuenta.id, email: cuenta.email, rol: cuenta.rol };
}

async function obtenerCuenta(
  adminClient: SupabaseClient,
  column: "id" | "auth_user_id",
  value: string,
): Promise<CuentaSesion | null> {
  const { data, error } = await adminClient
    .from("usuarios")
    .select("id,email,rol,estado,auth_user_id")
    .eq(column, value)
    .single();
  if (error) {
    if (filaNoEncontrada(error)) return null;
    throw new Error("No se pudo validar la cuenta de la sesión");
  }
  return data as CuentaSesion | null;
}

async function validarSesionSupabase(
  accessToken: string,
  authClient: SupabaseClient,
  adminClient: SupabaseClient,
): Promise<TokenPayload | null> {
  const { data, error } = await authClient.auth.getUser(accessToken);
  if (error) {
    if (errorDeSesionInvalida(error)) return null;
    throw new Error("Supabase Auth no pudo validar la sesión");
  }
  if (!data.user) return null;

  const cuenta = await obtenerCuenta(adminClient, "auth_user_id", data.user.id);
  const payload = cuenta ? payloadCuenta(cuenta) : null;
  if (!cuenta || !payload) return null;
  if (data.user.app_metadata?.crm_user_id !== cuenta.id) return null;
  if (data.user.email?.toLowerCase() !== cuenta.email.toLowerCase()) return null;

  if (rolRequiereMfa(cuenta.rol)) {
    const requisito = await obtenerRequisitoMfaSupabase(accessToken, authClient);
    if (requisito !== "satisfied") return null;
  }

  return payload;
}

export async function validarSesionSolicitud(
  request: NextRequest,
  dependencies: SessionValidationDependencies = {},
): Promise<TokenPayload | null> {
  const mode = dependencies.mode ?? obtenerModoSupabaseAuth();
  if (mode === "legacy") return authenticateRequest(request);

  const accessToken = request.cookies.get(SUPABASE_ACCESS_COOKIE)?.value;
  if (accessToken) {
    return validarSesionSupabase(
      accessToken,
      dependencies.authClient ?? crearClienteValidacion(),
      dependencies.adminClient ?? getSupabaseAdmin(),
    );
  }
  if (mode === "required") return null;

  const legacyPayload = authenticateRequest(request);
  if (!legacyPayload) return null;
  const cuenta = await obtenerCuenta(
    dependencies.adminClient ?? getSupabaseAdmin(),
    "id",
    legacyPayload.userId,
  );
  const payload = cuenta ? payloadCuenta(cuenta) : null;
  if (!cuenta || !payload || cuenta.auth_user_id) return null;
  if (rolRequiereMfa(cuenta.rol)) return null;
  return payload;
}

export async function renovarSesionSupabaseSolicitud(
  request: NextRequest,
  dependencies: SessionValidationDependencies = {},
): Promise<SesionSolicitudRenovada | null> {
  const mode = dependencies.mode ?? obtenerModoSupabaseAuth();
  if (mode === "legacy") return null;

  const refreshToken = request.cookies.get(SUPABASE_REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;
  const authClient = dependencies.authClient ?? crearClienteValidacion();
  const adminClient = dependencies.adminClient ?? getSupabaseAdmin();
  const { data, error } = await authClient.auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (error) {
    if (errorDeSesionInvalida(error)) return null;
    throw new Error("Supabase Auth no pudo renovar la sesión");
  }
  if (!data.session) return null;

  const payload = await validarSesionSupabase(
    data.session.access_token,
    authClient,
    adminClient,
  );
  return payload ? { payload, session: data.session } : null;
}
