import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  canjearTokenRecuperacion,
  MAX_TOKEN_RECUPERACION,
  RECUPERACION_VENTANA_SEGUNDOS,
} from "@/lib/recuperacion-password";
import { parseBoundedJson, RequestPayloadError } from "@/lib/request-json";
import {
  eliminarCookiesSesion,
  establecerCookieRecuperacion,
} from "@/lib/session-cookie";
import { createRequestAuthClient } from "@/lib/supabase-auth";

const MAX_CANJE_PAYLOAD_BYTES = 2 * 1024;

const CanjeSchema = z
  .object({ token: z.string().min(1).max(MAX_TOKEN_RECUPERACION) })
  .strict();

/**
 * `no-store` mantiene el token fuera de cualquier caché intermedia y
 * `no-referrer` impide que la URL de la página del canje salga en el Referer
 * de cualquier petición que esa página dispare después.
 */
function sinRastro(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

/** Vencido, ya usado, inventado o ausente: un solo desenlace. */
function canjeRechazado(): NextResponse {
  const response = NextResponse.json(
    { success: false, error: "El enlace de recuperación ya no está vigente." },
    { status: 400 },
  );
  eliminarCookiesSesion(response);
  return sinRastro(response);
}

/**
 * Recibe el token en el CUERPO, nunca en la query: así no aparece en los logs
 * de acceso del alojamiento. Lo cambia por una cookie httpOnly acotada a este
 * flujo, y Supabase lo consume en el canje, de modo que un segundo intento con
 * el mismo enlace falla.
 *
 * No existe GET a propósito. Abrir este endpoint desde la barra de direcciones
 * responde 405 en vez de aceptar un `?token=`.
 */
export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await parseBoundedJson(request, MAX_CANJE_PAYLOAD_BYTES);
  } catch (error) {
    const status = error instanceof RequestPayloadError ? error.status : 400;
    return sinRastro(
      NextResponse.json({ success: false, error: "Solicitud inválida" }, { status }),
    );
  }

  const parsedBody = CanjeSchema.safeParse(rawBody);
  if (!parsedBody.success) return canjeRechazado();

  let accessToken: string | null = null;
  try {
    accessToken = await canjearTokenRecuperacion(
      parsedBody.data.token,
      createRequestAuthClient(),
    );
  } catch (error) {
    console.error(
      "Error en POST /api/auth/recuperacion/callback:",
      error instanceof Error ? error.message : "Error desconocido",
    );
  }

  if (!accessToken) return canjeRechazado();

  const response = NextResponse.json({ success: true });
  // Cualquier sesión abierta en este navegador se cierra antes de empezar: el
  // enlace prueba quién controla el buzón, no quién está usando el equipo.
  eliminarCookiesSesion(response);
  establecerCookieRecuperacion(
    response,
    accessToken,
    RECUPERACION_VENTANA_SEGUNDOS,
  );
  return sinRastro(response);
}
