import "server-only";

import { randomBytes, randomUUID } from "node:crypto";

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
  | {
      status: "ok";
      cuenta: CuentaRecuperacion;
      /** `true` cuando la identidad todavía no está enlazada a la cuenta. */
      pendiente: boolean;
    }
  | { status: "expired" }
  | { status: "invalid" };

interface CuentaSolicitud {
  id: string;
  nombre: string;
  email: string;
  estado: string;
  auth_user_id: string | null;
  auth_pending_user_id: string | null;
  /** Derivada en la base. Evita traer el hash a memoria solo para decidir. */
  tiene_password: boolean;
}

/** Columnas que la recuperación necesita de la cuenta. Nunca `password`. */
const COLUMNAS_CUENTA =
  "id,nombre,email,estado,auth_user_id,auth_pending_user_id,tiene_password";

function authErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  return typeof error.code === "string" ? error.code : null;
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
    .select(COLUMNAS_CUENTA)
    .eq("email", email)
    .single();
  if (error) {
    if (filaNoEncontrada(error)) return null;
    throw new Error("No se pudo consultar la cuenta solicitada");
  }
  return (data as CuentaSolicitud | null) ?? null;
}

export interface TurnoRecuperacion {
  concedido: boolean;
  /** `null` cuando el turno no se registró y por lo tanto no hay qué liberar. */
  identificador: string | null;
}

/**
 * Reserva el turno de envío. No lo concede cuando la cuenta ya recibió un
 * correo dentro de la ventana, para que un tercero no pueda inundar el buzón
 * de alguien del equipo repitiendo el formulario.
 *
 * El identificador que devuelve es lo que permite soltarlo después sin pisar
 * el turno de otra solicitud.
 */
export async function reclamarEnvioRecuperacion(
  usuarioId: string,
  adminClient: SupabaseClient = getSupabaseAdmin(),
  esperaSegundos = RECUPERACION_ESPERA_SEGUNDOS,
  identificador: string = randomUUID(),
): Promise<TurnoRecuperacion> {
  const { data, error } = await adminClient.rpc(
    "reclamar_recuperacion_password",
    {
      p_usuario_id: usuarioId,
      p_espera_segundos: esperaSegundos,
      p_turno: identificador,
    },
  );
  if (error) {
    // La migración puede no estar aplicada todavía. Degradar sin espera deja
    // el envío disponible; degradar bloqueando dejaría al equipo sin forma de
    // recuperar su cuenta, que es peor.
    if (funcionInexistente(error)) {
      console.warn("[recuperacion] Sin control de frecuencia: falta la migración");
      return { concedido: true, identificador: null };
    }
    throw new Error("No se pudo registrar la solicitud de recuperación");
  }
  return {
    concedido: data === true,
    identificador: data === true ? identificador : null,
  };
}

/**
 * Suelta el turno para que la persona pueda reintentar de inmediato cuando el
 * correo no llegó a salir. Nunca lanza: se llama en caminos donde el error ya
 * ocurrió y la respuesta pública tiene que seguir siendo la neutra de siempre.
 */
export async function liberarEnvioRecuperacion(
  usuarioId: string,
  identificador: string | null,
  adminClient: SupabaseClient = getSupabaseAdmin(),
): Promise<void> {
  if (!identificador) return;
  try {
    const { error } = await adminClient.rpc("liberar_recuperacion_password", {
      p_usuario_id: usuarioId,
      p_turno: identificador,
    });
    if (error) throw error;
  } catch {
    // El turno vence solo al cumplirse la ventana. Una liberación fallida
    // retrasa el reintento, no lo impide, y no debe cambiar la respuesta.
    console.error("[recuperacion] No se pudo liberar el turno tras un envío fallido");
  }
}

/** Ventana de la reserva de creación de identidad pendiente. */
export const RECUPERACION_PENDIENTE_SEGUNDOS = 15 * 60;

export interface IdentidadPendiente {
  authUserId: string;
  /** Turno que hay que devolver para soltar la reserva. */
  turno: string;
  /** `true` solo si esta solicitud la creó: decide si se puede borrar. */
  creada: boolean;
}

function claimPendiente(usuario: { app_metadata?: Record<string, unknown> } | null) {
  return usuario?.app_metadata?.crm_pending_user_id;
}

function claimEnlazado(usuario: { app_metadata?: Record<string, unknown> } | null) {
  return usuario?.app_metadata?.crm_user_id;
}

/**
 * Contraseña de relleno de la identidad pendiente. Nadie la conoce ni la usa:
 * la cuenta solo queda utilizable cuando la confirmación fija una elegida por
 * su dueño. Aun así se genera con entropía real, porque mientras tanto es la
 * única credencial de esa identidad.
 */
function passwordDeRelleno(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Reserva el derecho a crear la identidad pendiente. Es un paso aparte del
 * registro porque el turno se gana antes de que exista el UUID de Auth.
 */
export async function reservarIdentidadPendiente(
  usuarioId: string,
  adminClient: SupabaseClient = getSupabaseAdmin(),
  ventanaSegundos = RECUPERACION_PENDIENTE_SEGUNDOS,
  turno: string = randomUUID(),
): Promise<string | null> {
  const { data, error } = await adminClient.rpc("reservar_identidad_pendiente", {
    p_usuario_id: usuarioId,
    p_turno: turno,
    p_ventana_segundos: ventanaSegundos,
  });
  if (error) throw new Error("No se pudo reservar la identidad pendiente");
  return data === true ? turno : null;
}

export async function registrarIdentidadPendiente(
  usuarioId: string,
  turno: string,
  authUserId: string,
  adminClient: SupabaseClient = getSupabaseAdmin(),
): Promise<boolean> {
  const { data, error } = await adminClient.rpc("registrar_identidad_pendiente", {
    p_usuario_id: usuarioId,
    p_turno: turno,
    p_auth_user_id: authUserId,
  });
  if (error) throw new Error("No se pudo registrar la identidad pendiente");
  return data === true;
}

/** Nunca lanza: se llama en caminos de compensación donde ya hubo un error. */
export async function liberarIdentidadPendiente(
  usuarioId: string,
  turno: string,
  adminClient: SupabaseClient = getSupabaseAdmin(),
): Promise<void> {
  try {
    const { error } = await adminClient.rpc("liberar_identidad_pendiente", {
      p_usuario_id: usuarioId,
      p_turno: turno,
    });
    if (error) throw error;
  } catch {
    console.error("[recuperacion] No se pudo liberar la identidad pendiente");
  }
}

/**
 * Deja lista una identidad pendiente para la cuenta: reutiliza la registrada,
 * reconcilia una huérfana con el mismo correo, o crea una nueva.
 *
 * La identidad lleva `crm_pending_user_id` y **nunca** `crm_user_id`: es lo que
 * impide que cualquier camino existente la confunda con una identidad enlazada
 * y le entregue sesión del CRM.
 */
export async function prepararIdentidadPendiente(
  cuenta: { id: string; email: string; auth_pending_user_id: string | null },
  adminClient: SupabaseClient = getSupabaseAdmin(),
): Promise<IdentidadPendiente | null> {
  const turno = await reservarIdentidadPendiente(cuenta.id, adminClient);
  // Otra solicitud de la misma cuenta va en vuelo. No se crea una segunda
  // identidad ni se toca la suya.
  if (!turno) return null;

  let authUserId = cuenta.auth_pending_user_id;
  let creada = false;

  try {
    if (!authUserId) {
      const creacion = await adminClient.auth.admin.createUser({
        email: cuenta.email,
        password: passwordDeRelleno(),
        email_confirm: true,
        app_metadata: { crm_pending_user_id: cuenta.id },
      });

      if (creacion.error) {
        const code = authErrorCode(creacion.error);
        if (code !== "email_exists" && code !== "user_already_exists") {
          await liberarIdentidadPendiente(cuenta.id, turno, adminClient);
          console.error("[recuperacion] Supabase Auth no creó la identidad pendiente");
          return null;
        }

        // Quedó una identidad de un intento anterior. Solo se adopta si declara
        // esta misma cuenta; si es de otra, la recuperación se detiene y queda
        // para revisión administrativa.
        const existente = await buscarIdentidadPorCorreo(cuenta.email, adminClient);
        const suya =
          claimPendiente(existente) === cuenta.id ||
          claimEnlazado(existente) === cuenta.id;
        if (!existente || !suya) {
          await liberarIdentidadPendiente(cuenta.id, turno, adminClient);
          console.error("[recuperacion] El correo pertenece a otra identidad de Auth");
          return null;
        }
        authUserId = existente.id;
      } else {
        if (!creacion.data.user) {
          await liberarIdentidadPendiente(cuenta.id, turno, adminClient);
          return null;
        }
        authUserId = creacion.data.user.id;
        creada = true;
      }
    }

    const registrada = await registrarIdentidadPendiente(
      cuenta.id,
      turno,
      authUserId,
      adminClient,
    );
    if (!registrada) {
      await liberarIdentidadPendiente(cuenta.id, turno, adminClient);
      if (creada) await retirarIdentidadPendiente(authUserId, adminClient);
      return null;
    }

    return { authUserId, turno, creada };
  } catch (error) {
    await liberarIdentidadPendiente(cuenta.id, turno, adminClient);
    if (creada && authUserId) {
      await retirarIdentidadPendiente(authUserId, adminClient);
    }
    throw error;
  }
}

/** Retira de Auth una identidad pendiente que esta solicitud creó. */
export async function retirarIdentidadPendiente(
  authUserId: string,
  adminClient: SupabaseClient = getSupabaseAdmin(),
): Promise<void> {
  try {
    const { error } = await adminClient.auth.admin.deleteUser(authUserId);
    if (error) throw error;
  } catch {
    // Queda huérfana en Auth, pero sin registro en `usuarios` no da acceso a
    // nada. El siguiente intento la reconcilia por correo.
    console.error("[recuperacion] No se pudo retirar la identidad pendiente");
  }
}

async function buscarIdentidadPorCorreo(
  email: string,
  adminClient: SupabaseClient,
): Promise<{ id: string; app_metadata?: Record<string, unknown> } | null> {
  const normalizado = email.toLowerCase();
  const porPagina = 1_000;

  for (let pagina = 1; pagina <= 100; pagina += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page: pagina,
      perPage: porPagina,
    });
    if (error) return null;

    const encontrada = data.users.find(
      (usuario) => usuario.email?.toLowerCase() === normalizado,
    );
    if (encontrada) return encontrada;
    if (data.users.length < porPagina) return null;
  }
  return null;
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

/**
 * Enlace atómico de la identidad recuperada. Es la única operación autorizada a
 * retirar el hash heredado, y lo hace en la misma sentencia que fija
 * `auth_user_id`. Devuelve `false` si la identidad no corresponde a la cuenta.
 */
export async function enlazarIdentidadRecuperada(
  usuarioId: string,
  authUserId: string,
  adminClient: SupabaseClient = getSupabaseAdmin(),
): Promise<boolean> {
  const { data, error } = await adminClient.rpc("enlazar_identidad_recuperada", {
    p_usuario_id: usuarioId,
    p_auth_user_id: authUserId,
  });
  if (error) throw new Error("No se pudo enlazar la identidad recuperada");
  return data === true;
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

  const { data: enlazada, error: enlazadaError } = await adminClient
    .from("usuarios")
    .select(COLUMNAS_CUENTA)
    .eq("auth_user_id", data.user.id)
    .single();
  if (enlazadaError && !filaNoEncontrada(enlazadaError)) {
    return { status: "invalid" };
  }

  let fila = enlazada as CuentaSolicitud | null;
  let pendiente = false;

  if (!fila) {
    // La identidad todavía no está enlazada. Puede ser una pendiente creada por
    // la solicitud de esta misma cuenta.
    const { data: reservada, error: reservadaError } = await adminClient
      .from("usuarios")
      .select(COLUMNAS_CUENTA)
      .eq("auth_pending_user_id", data.user.id)
      .single();
    if (reservadaError || !reservada) return { status: "invalid" };
    fila = reservada as CuentaSolicitud;
    pendiente = true;
  }

  if (fila.estado !== "ACTIVO") return { status: "invalid" };
  if (data.user.email?.toLowerCase() !== fila.email.toLowerCase()) {
    return { status: "invalid" };
  }

  if (pendiente) {
    if (fila.auth_pending_user_id !== data.user.id) return { status: "invalid" };
    // Se acepta el claim ya promovido porque una confirmación anterior pudo
    // fallar entre la promoción y el enlace. Nunca el claim de otra cuenta.
    const suya =
      claimPendiente(data.user) === fila.id || claimEnlazado(data.user) === fila.id;
    if (!suya) return { status: "invalid" };
  } else {
    if (!fila.auth_user_id) return { status: "invalid" };
    if (claimEnlazado(data.user) !== fila.id) return { status: "invalid" };
  }

  return {
    status: "ok",
    pendiente,
    cuenta: {
      id: fila.id,
      email: fila.email,
      nombre: fila.nombre,
      authUserId: data.user.id,
    },
  };
}
