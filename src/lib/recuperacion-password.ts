import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { applicationBaseUrl } from "./application-url";
import { getSupabaseAdmin } from "./supabase-admin";

/**
 * Ventana propia de la recuperación, contada desde que el enlace del correo se
 * canjea. Supabase ya vence el token del correo por su cuenta, pero esa
 * caducidad es de la instalación y aquí no se puede leer: el token canjeado
 * produce una sesión de hasta una hora. Quince minutos es lo que tarda alguien
 * en escribir una contraseña nueva, y deja de ser útil para quien encuentre la
 * cookie más tarde.
 */
export const RECUPERACION_VENTANA_SEGUNDOS = 15 * 60;

/** Mínimo entre dos correos de recuperación de la misma cuenta. */
export const RECUPERACION_ESPERA_SEGUNDOS = 15 * 60;

/**
 * Piso de latencia para todo desenlace que dependa de la cuenta.
 *
 * El cuerpo de la respuesta ya es idéntico exista o no la cuenta, pero el
 * tiempo no lo era: una cuenta real gasta `generateLink` más el envío por
 * Resend, y una inventada respondía de inmediato. Esa diferencia basta para
 * averiguar qué correos pertenecen al equipo, que es justo lo que la respuesta
 * neutra intenta esconder.
 */
export const PISO_RESPUESTA_RECUPERACION_MS = 1_000;

/**
 * Espera hasta completar el piso, medido con reloj monotónico: `performance.now`
 * no salta si alguien corrige la hora del sistema, `Date.now` sí.
 */
export async function esperarPisoRespuesta(
  inicioMonotonico: number,
  pisoMs = PISO_RESPUESTA_RECUPERACION_MS,
): Promise<void> {
  const restante = pisoMs - (performance.now() - inicioMonotonico);
  if (restante <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, restante));
}

/**
 * La misma frase para todos los desenlaces de la solicitud: cuenta que no
 * existe, cuenta inhabilitada, cuenta sin identidad en Auth, espera vigente o
 * correo enviado. Cualquier diferencia convierte este formulario en un
 * detector de qué correos pertenecen al equipo.
 */
export const MENSAJE_NEUTRO_RECUPERACION =
  "Si el correo corresponde a una cuenta habilitada, enviamos las instrucciones para recuperarla.";

/**
 * El enlace del correo apunta a una PÁGINA, no al endpoint. El token viaja en
 * el fragmento, que el navegador nunca manda al servidor: no entra a los logs
 * de acceso, no viaja en Referer y no queda en la barra de direcciones una vez
 * que la página lo limpia. Desde ahí se postea al endpoint del canje.
 */
export const RUTA_CANJE_RECUPERACION = "/recuperar-contrasena/canje";

/** Tope del token en el cuerpo del canje. */
export const MAX_TOKEN_RECUPERACION = 512;

export interface CuentaRecuperacion {
  id: string;
  email: string;
  nombre: string;
  authUserId: string;
}

export type ResolucionRecuperacion =
  | { status: "ok"; cuenta: CuentaRecuperacion }
  | { status: "expired" }
  | { status: "invalid" };

interface CuentaSolicitud {
  id: string;
  nombre: string;
  email: string;
  estado: string;
  auth_user_id: string | null;
}

function funcionInexistente(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  // PGRST202: PostgREST no encuentra la función en el esquema expuesto.
  return error.code === "PGRST202";
}

function filaNoEncontrada(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "PGRST116",
  );
}

/** Instante de emisión del access token, en segundos. `null` si no se puede leer. */
export function emisionDelToken(accessToken: string): number | null {
  const payload = accessToken.split(".")[1];
  if (!payload) return null;
  try {
    const claims: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (!claims || typeof claims !== "object" || !("iat" in claims)) return null;
    const iat = (claims as { iat: unknown }).iat;
    return typeof iat === "number" && Number.isFinite(iat) ? iat : null;
  } catch {
    return null;
  }
}

export function urlCanjeRecuperacion(
  tokenHash: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const url = new URL(RUTA_CANJE_RECUPERACION, applicationBaseUrl(env));
  url.hash = `token=${encodeURIComponent(tokenHash)}`;
  return url.toString();
}

export async function buscarCuentaRecuperable(
  email: string,
  adminClient: SupabaseClient = getSupabaseAdmin(),
): Promise<CuentaSolicitud | null> {
  const { data, error } = await adminClient
    .from("usuarios")
    .select("id,nombre,email,estado,auth_user_id")
    .eq("email", email)
    .single();
  if (error) {
    if (filaNoEncontrada(error)) return null;
    throw new Error("No se pudo consultar la cuenta solicitada");
  }
  return (data as CuentaSolicitud | null) ?? null;
}

/**
 * Reserva el turno de envío. Devuelve `false` cuando la cuenta ya recibió un
 * correo dentro de la ventana, para que un tercero no pueda inundar el buzón
 * de alguien del equipo repitiendo el formulario.
 */
export async function reclamarEnvioRecuperacion(
  usuarioId: string,
  adminClient: SupabaseClient = getSupabaseAdmin(),
  esperaSegundos = RECUPERACION_ESPERA_SEGUNDOS,
): Promise<boolean> {
  const { data, error } = await adminClient.rpc(
    "reclamar_recuperacion_password",
    { p_usuario_id: usuarioId, p_espera_segundos: esperaSegundos },
  );
  if (error) {
    // La migración puede no estar aplicada todavía. Degradar sin espera deja
    // el envío disponible; degradar bloqueando dejaría al equipo sin forma de
    // recuperar su cuenta, que es peor.
    if (funcionInexistente(error)) {
      console.warn("[recuperacion] Sin control de frecuencia: falta la migración");
      return true;
    }
    throw new Error("No se pudo registrar la solicitud de recuperación");
  }
  return data === true;
}

/**
 * Pide a Supabase Auth el token de recuperación sin usar su servicio de correo:
 * la entrega es de Resend, que es por donde sale el resto del correo del CRM.
 */
export async function emitirTokenRecuperacion(
  email: string,
  adminClient: SupabaseClient = getSupabaseAdmin(),
): Promise<string | null> {
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  if (error) {
    console.error("[recuperacion] Supabase Auth no emitió el enlace");
    return null;
  }
  const tokenHash = data?.properties?.hashed_token;
  return typeof tokenHash === "string" && tokenHash ? tokenHash : null;
}

/** Canjea el token del correo. Supabase lo consume: no sirve dos veces. */
export async function canjearTokenRecuperacion(
  tokenHash: string,
  authClient: SupabaseClient,
): Promise<string | null> {
  const { data, error } = await authClient.auth.verifyOtp({
    type: "recovery",
    token_hash: tokenHash,
  });
  if (error || !data.session) return null;
  return data.session.access_token;
}

/**
 * Comprueba que la cookie de recuperación siga sirviendo y a qué cuenta del CRM
 * corresponde. El token va firmado por Supabase, así que su `iat` no se puede
 * adelantar sin que `getUser` lo rechace.
 */
export async function resolverCuentaRecuperacion({
  accessToken,
  authClient,
  adminClient = getSupabaseAdmin(),
  ahora = Date.now(),
  ventanaSegundos = RECUPERACION_VENTANA_SEGUNDOS,
}: {
  accessToken: string;
  authClient: SupabaseClient;
  adminClient?: SupabaseClient;
  ahora?: number;
  ventanaSegundos?: number;
}): Promise<ResolucionRecuperacion> {
  const emitido = emisionDelToken(accessToken);
  if (emitido === null) return { status: "invalid" };
  if (Math.floor(ahora / 1_000) - emitido > ventanaSegundos) {
    return { status: "expired" };
  }

  const { data, error } = await authClient.auth.getUser(accessToken);
  if (error || !data.user) return { status: "invalid" };

  const { data: cuenta, error: cuentaError } = await adminClient
    .from("usuarios")
    .select("id,nombre,email,estado,auth_user_id")
    .eq("auth_user_id", data.user.id)
    .single();
  if (cuentaError || !cuenta) return { status: "invalid" };

  const fila = cuenta as CuentaSolicitud;
  if (fila.estado !== "ACTIVO" || !fila.auth_user_id) return { status: "invalid" };
  if (data.user.app_metadata?.crm_user_id !== fila.id) return { status: "invalid" };
  if (data.user.email?.toLowerCase() !== fila.email.toLowerCase()) {
    return { status: "invalid" };
  }

  return {
    status: "ok",
    cuenta: {
      id: fila.id,
      email: fila.email,
      nombre: fila.nombre,
      authUserId: fila.auth_user_id,
    },
  };
}
