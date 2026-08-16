import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { enviarEmailRecuperacion } from "@/lib/email";
import { parseBoundedJson, RequestPayloadError } from "@/lib/request-json";
import {
  buscarCuentaRecuperable,
  emitirTokenRecuperacion,
  MENSAJE_NEUTRO_RECUPERACION,
  RECUPERACION_VENTANA_SEGUNDOS,
  reclamarEnvioRecuperacion,
  urlCallbackRecuperacion,
} from "@/lib/recuperacion-password";

const MAX_RECUPERACION_PAYLOAD_BYTES = 4 * 1024;

const SolicitudSchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(254)
      .email()
      .transform((email) => email.toLowerCase()),
  })
  .strict();

function sinCache(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function respuestaNeutra(): NextResponse {
  return sinCache(
    NextResponse.json({ success: true, mensaje: MENSAJE_NEUTRO_RECUPERACION }),
  );
}

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await parseBoundedJson(request, MAX_RECUPERACION_PAYLOAD_BYTES);
  } catch (error) {
    const status = error instanceof RequestPayloadError ? error.status : 400;
    return sinCache(
      NextResponse.json({ success: false, error: "Solicitud inválida" }, { status }),
    );
  }

  const parsedBody = SolicitudSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    // Un correo mal escrito no revela nada sobre qué cuentas existen, así que
    // aquí sí conviene decir que el formato está mal.
    return sinCache(
      NextResponse.json(
        { success: false, error: "Ingresa un correo electrónico válido" },
        { status: 400 },
      ),
    );
  }

  const { email } = parsedBody.data;

  try {
    const cuenta = await buscarCuentaRecuperable(email);

    // Las tres condiciones salen por la misma puerta que el envío exitoso.
    // Una cuenta sin `auth_user_id` todavía vive del hash legado y no tiene
    // identidad que recuperar en Supabase Auth.
    if (!cuenta || cuenta.estado !== "ACTIVO" || !cuenta.auth_user_id) {
      return respuestaNeutra();
    }

    if (!(await reclamarEnvioRecuperacion(cuenta.id))) {
      return respuestaNeutra();
    }

    const tokenHash = await emitirTokenRecuperacion(email);
    if (!tokenHash) return respuestaNeutra();

    await enviarEmailRecuperacion(
      cuenta.email,
      cuenta.nombre,
      urlCallbackRecuperacion(tokenHash),
      Math.round(RECUPERACION_VENTANA_SEGUNDOS / 60),
    );

    return respuestaNeutra();
  } catch (error) {
    // El fallo es de infraestructura y no depende del correo recibido, así que
    // contarlo no distingue una cuenta real de una inventada.
    console.error(
      "Error en POST /api/auth/recuperacion:",
      error instanceof Error ? error.message : "Error desconocido",
    );
    return sinCache(
      NextResponse.json(
        { success: false, error: "No se pudo procesar la solicitud" },
        { status: 500 },
      ),
    );
  }
}
