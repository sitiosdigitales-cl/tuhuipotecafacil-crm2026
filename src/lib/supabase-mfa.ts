import "server-only";

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "./supabase-admin";
import {
  SUPABASE_ACCESS_COOKIE,
  SUPABASE_REFRESH_COOKIE,
} from "./session-cookie";
import type { Rol } from "@/tipos";

const ROLES_CON_MFA = new Set<Rol>(["SUPER_ADMIN", "ADMIN"]);

export type RequisitoMfa = "satisfied" | "enroll" | "challenge";

export interface CuentaMfa {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  estado: string;
}

export type ContextoMfa =
  | {
      status: "authenticated";
      authClient: SupabaseClient;
      session: Session;
      cuenta: CuentaMfa;
    }
  | { status: "unauthenticated" }
  | { status: "invalid_account" };

function crearClienteMfa(): SupabaseClient {
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

export function rolRequiereMfa(rol: string): rol is "SUPER_ADMIN" | "ADMIN" {
  return ROLES_CON_MFA.has(rol as Rol);
}

export async function obtenerRequisitoMfaSupabase(
  accessToken: string,
  authClient = crearClienteMfa(),
): Promise<RequisitoMfa> {
  const { data, error } =
    await authClient.auth.mfa.getAuthenticatorAssuranceLevel(accessToken);
  if (error || !data) throw new Error("No se pudo comprobar el nivel MFA");
  if (data.currentLevel === "aal2") return "satisfied";
  return data.nextLevel === "aal2" ? "challenge" : "enroll";
}

export async function recuperarContextoMfa(
  request: NextRequest,
  {
    authClient = crearClienteMfa(),
    adminClient = getSupabaseAdmin(),
  }: {
    authClient?: SupabaseClient;
    adminClient?: SupabaseClient;
  } = {},
): Promise<ContextoMfa> {
  const accessToken = request.cookies.get(SUPABASE_ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(SUPABASE_REFRESH_COOKIE)?.value;
  if (!accessToken || !refreshToken) return { status: "unauthenticated" };

  const { data, error } = await authClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error || !data.session || !data.user) {
    return { status: "unauthenticated" };
  }

  const { data: cuenta, error: accountError } = await adminClient
    .from("usuarios")
    .select("id,nombre,apellido,email,rol,estado")
    .eq("auth_user_id", data.user.id)
    .single();
  if (accountError || !cuenta) return { status: "invalid_account" };
  if (cuenta.estado !== "ACTIVO" || !rolRequiereMfa(cuenta.rol)) {
    return { status: "invalid_account" };
  }

  return {
    status: "authenticated",
    authClient,
    session: data.session,
    cuenta: cuenta as CuentaMfa,
  };
}

export function sesionDesdeVerificacionMfa(data: {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  token_type: "bearer";
  user: Session["user"];
}): Session {
  return {
    ...data,
    expires_at: Math.floor(Date.now() / 1_000) + data.expires_in,
  };
}
