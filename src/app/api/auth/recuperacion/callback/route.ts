import { NextRequest, NextResponse } from "next/server";

import {
  canjearTokenRecuperacion,
  RECUPERACION_VENTANA_SEGUNDOS,
} from "@/lib/recuperacion-password";
import {
  eliminarCookiesSesion,
  establecerCookieRecuperacion,
} from "@/lib/session-cookie";
import { createRequestAuthClient } from "@/lib/supabase-auth";

const MAX_TOKEN_LENGTH = 512;
const DESTINO_FORMULARIO = "/recuperar-contrasena/nueva";
const DESTINO_SOLICITUD = "/recuperar-contrasena";

function redirigir(request: NextRequest, ruta: string): NextResponse {
  const respuesta = NextResponse.redirect(new URL(ruta, request.url), 303);
  respuesta.headers.set("Cache-Control", "no-store, max-age=0");
  return respuesta;
}

/**
 * Canjea el token que llega por correo. El destino nunca lleva el token en la
 * URL: se cambia por una cookie httpOnly acotada a este flujo, y Supabase lo
 * consume en el canje, así que un segundo intento con el mismo enlace falla.
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token");
  if (!tokenHash || tokenHash.length > MAX_TOKEN_LENGTH) {
    return redirigir(request, `${DESTINO_SOLICITUD}?estado=invalido`);
  }

  let accessToken: string | null = null;
  try {
    accessToken = await canjearTokenRecuperacion(
      tokenHash,
      createRequestAuthClient(),
    );
  } catch (error) {
    console.error(
      "Error en GET /api/auth/recuperacion/callback:",
      error instanceof Error ? error.message : "Error desconocido",
    );
  }

  if (!accessToken) {
    // Vencido, ya usado o inventado: el mismo destino para los tres. Distinguir
    // "vencido" de "inválido" le diría a quien pruebe tokens cuándo acertó.
    const respuesta = redirigir(request, `${DESTINO_SOLICITUD}?estado=invalido`);
    eliminarCookiesSesion(respuesta);
    return respuesta;
  }

  const respuesta = redirigir(request, DESTINO_FORMULARIO);
  // Cualquier sesión abierta en este navegador se cierra antes de empezar: el
  // enlace prueba quién controla el buzón, no quién está usando el equipo.
  eliminarCookiesSesion(respuesta);
  establecerCookieRecuperacion(
    respuesta,
    accessToken,
    RECUPERACION_VENTANA_SEGUNDOS,
  );
  return respuesta;
}
