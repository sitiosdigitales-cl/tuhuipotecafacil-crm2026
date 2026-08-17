import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { enviarEmailRecuperacion } from "@/lib/email";
import { parseBoundedJson, RequestPayloadError } from "@/lib/request-json";
import {
  buscarCuentaRecuperable,
  emitirTokenRecuperacion,
  esperarPisoRespuesta,
  type IdentidadPendiente,
  liberarEnvioRecuperacion,
  liberarIdentidadPendiente,
  MENSAJE_NEUTRO_RECUPERACION,
  prepararIdentidadPendiente,
  RECUPERACION_VENTANA_SEGUNDOS,
  reclamarEnvioRecuperacion,
  retirarIdentidadPendiente,
  urlCanjeRecuperacion,
} from "@/lib/recuperacion-password";
import { obtenerModoSupabaseAuth } from "@/lib/supabase-auth";

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

/**
 * Todo desenlace que dependa de la cuenta pasa por acá, y todos esperan el
 * mismo piso antes de responder. Sin eso, el cuerpo idéntico no sirve de nada:
 * la latencia delata igual qué correos existen.
 */
async function respuestaNeutra(inicio: number): Promise<NextResponse> {
  await esperarPisoRespuesta(inicio);
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
  // El reloj arranca DESPUÉS de validar el formato: un correo mal escrito no
  // depende de que la cuenta exista, así que retrasarlo solo castigaría a quien
  // se equivocó escribiendo.
  const inicio = performance.now();
  // Fuera del try para que el catch pueda soltarlo: si algo revienta después de
  // reclamarlo, quien pidió la recuperación no puede quedar esperando quince
  // minutos por un correo que nunca salió.
  let cuentaId: string | null = null;
  let turno: string | null = null;
  let pendiente: IdentidadPendiente | null = null;

  // Deshace todo lo reservado en esta solicitud. La identidad solo se retira de
  // Auth si la creó este mismo intento: una preexistente puede estar sirviendo
  // a un enlace ya enviado.
  const compensar = async () => {
    if (pendiente) {
      await liberarIdentidadPendiente(cuentaId!, pendiente.turno);
      if (pendiente.creada) await retirarIdentidadPendiente(pendiente.authUserId);
    }
    if (cuentaId) await liberarEnvioRecuperacion(cuentaId, turno);
  };

  try {
    const cuenta = await buscarCuentaRecuperable(email);

    // Cuenta inexistente o inhabilitada sale por la misma puerta que el envío
    // exitoso, con el mismo cuerpo y el mismo piso de tiempo.
    if (!cuenta || cuenta.estado !== "ACTIVO") return respuestaNeutra(inicio);

    const reserva = await reclamarEnvioRecuperacion(cuenta.id);
    if (!reserva.concedido) return respuestaNeutra(inicio);
    cuentaId = cuenta.id;
    turno = reserva.identificador;

    let authUserId = cuenta.auth_user_id;

    if (!authUserId) {
      // Cuenta legada: todavía vive del hash heredado. Se le prepara una
      // identidad pendiente, que no llena `auth_user_id` y por lo tanto no
      // resuelve sesión del CRM hasta que la confirmación la enlace.
      if (!cuenta.tiene_password || obtenerModoSupabaseAuth() === "legacy") {
        // En `legacy` no hay a dónde migrar, y sin hash no hay nada que
        // conservar: en ambos casos la cuenta necesita intervención humana.
        await compensar();
        return respuestaNeutra(inicio);
      }

      pendiente = await prepararIdentidadPendiente(cuenta);
      if (!pendiente) {
        await compensar();
        return respuestaNeutra(inicio);
      }
      authUserId = pendiente.authUserId;
    }

    const tokenHash = await emitirTokenRecuperacion(email);
    if (!tokenHash) {
      // Nada salió, así que ni el turno ni la identidad pueden quedar tomados.
      await compensar();
      console.error(
        "[recuperacion] Supabase Auth no emitió el enlace; turno liberado para reintento",
      );
      return respuestaNeutra(inicio);
    }

    const entregado = await enviarEmailRecuperacion(
      cuenta.email,
      cuenta.nombre,
      urlCanjeRecuperacion(tokenHash),
      Math.round(RECUPERACION_VENTANA_SEGUNDOS / 60),
    );

    if (!entregado) {
      // Resend rechazó, o no hay `RESEND_API_KEY`. La respuesta pública sigue
      // siendo la neutra —no hay forma de avisar sin delatar que la cuenta
      // existe—, así que la única señal posible es esta, y va sin correo, sin
      // nombre y sin identificador de la persona.
      await compensar();
      console.error(
        "[recuperacion] El proveedor no aceptó la entrega; turno liberado para reintento",
      );
    }

    return respuestaNeutra(inicio);
  } catch (error) {
    // El fallo es de infraestructura y no depende del correo recibido, así que
    // contarlo no distingue una cuenta real de una inventada. Aun así espera el
    // piso: este catch cubre todo lo posterior a la consulta, y ahí el momento
    // en que falla sí depende de la cuenta.
    console.error(
      "Error en POST /api/auth/recuperacion:",
      error instanceof Error ? error.message : "Error desconocido",
    );
    await compensar();
    await esperarPisoRespuesta(inicio);
    return sinCache(
      NextResponse.json(
        { success: false, error: "No se pudo procesar la solicitud" },
        { status: 500 },
      ),
    );
  }
}
