import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { parseBoundedJson, RequestPayloadError } from "@/lib/request-json";
import {
  enlazarIdentidadRecuperada,
  resolverCuentaRecuperacion,
} from "@/lib/recuperacion-password";
import {
  eliminarCookiesSesion,
  RECUPERACION_COOKIE,
} from "@/lib/session-cookie";
import { actualizarIdentidadAdministrada } from "@/lib/supabase-auth-accounts";
import {
  createRequestAuthClient,
  revocarSesionesSupabase,
} from "@/lib/supabase-auth";
import { obtenerErrorPoliticaPassword } from "@/modulos/usuarios/politica-password";

const MAX_CONFIRMACION_PAYLOAD_BYTES = 4 * 1024;

const ConfirmacionSchema = z
  .object({
    password: z.string().superRefine((password, context) => {
      const error = obtenerErrorPoliticaPassword(password);
      if (error) context.addIssue({ code: "custom", message: error });
    }),
  })
  .strict();

function sinCache(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

/** Vencido, canjeado en otro navegador o manipulado: un solo desenlace. */
function enlaceNoVigente(): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      code: "RECUPERACION_NO_VIGENTE",
      error: "El enlace de recuperación ya no está vigente. Solicita uno nuevo.",
    },
    { status: 401 },
  );
  eliminarCookiesSesion(response);
  return sinCache(response);
}

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await parseBoundedJson(request, MAX_CONFIRMACION_PAYLOAD_BYTES);
  } catch (error) {
    const status = error instanceof RequestPayloadError ? error.status : 400;
    return sinCache(
      NextResponse.json({ success: false, error: "Solicitud inválida" }, { status }),
    );
  }

  const parsedBody = ConfirmacionSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return sinCache(
      NextResponse.json(
        {
          success: false,
          error:
            parsedBody.error.issues[0]?.message ?? "La contraseña no cumple la política",
        },
        { status: 400 },
      ),
    );
  }

  const accessToken = request.cookies.get(RECUPERACION_COOKIE)?.value;
  if (!accessToken) return enlaceNoVigente();

  try {
    const resolucion = await resolverCuentaRecuperacion({
      accessToken,
      authClient: createRequestAuthClient(),
    });
    if (resolucion.status !== "ok") return enlaceNoVigente();

    const actualizada = await actualizarIdentidadAdministrada({
      authUserId: resolucion.cuenta.authUserId,
      password: parsedBody.data.password,
    });
    if (actualizada.status === "weak_password") {
      // Supabase aplica su propia política además de la del CRM. El enlace
      // sigue vigente para reintentar con otra contraseña.
      return sinCache(
        NextResponse.json(
          {
            success: false,
            error: "Supabase Auth rechazó la contraseña. Elige una distinta.",
          },
          { status: 400 },
        ),
      );
    }
    if (actualizada.status !== "ok") {
      throw new Error("La identidad no aceptó la contraseña nueva");
    }

    if (resolucion.pendiente) {
      // Promover ANTES de enlazar. Al revés, un fallo intermedio dejaría la
      // cuenta con `auth_user_id` puesto, hash retirado y sin `crm_user_id`:
      // `validarSesionSupabase` la rechazaría y no quedaría ninguna credencial
      // utilizable.
      const promovida = await actualizarIdentidadAdministrada({
        authUserId: resolucion.cuenta.authUserId,
        appMetadata: { crm_user_id: resolucion.cuenta.id },
      });
      if (promovida.status !== "ok") {
        throw new Error("La identidad pendiente no aceptó su promoción");
      }

      const enlazada = await enlazarIdentidadRecuperada(
        resolucion.cuenta.id,
        resolucion.cuenta.authUserId,
      );
      if (!enlazada) {
        // El hash sigue en pie y la identidad ya tiene la contraseña nueva, así
        // que el reintento puede completar sin dejar la cuenta inutilizable.
        throw new Error("La cuenta no aceptó el enlace de la identidad");
      }
    }

    // Alcance global: quien haya entrado con la contraseña anterior queda
    // fuera, incluida esta misma sesión de recuperación. Va en su propio
    // try porque la contraseña YA cambió: si Supabase ya invalidó el token al
    // cambiarla, este error no puede convertir un éxito en un 500.
    try {
      await revocarSesionesSupabase(accessToken);
    } catch {
      console.error("[recuperacion] No se pudieron revocar las sesiones previas");
    }

    const response = NextResponse.json({
      success: true,
      mensaje: "Contraseña actualizada. Inicia sesión con la nueva.",
    });
    eliminarCookiesSesion(response);
    return sinCache(response);
  } catch (error) {
    console.error(
      "Error en POST /api/auth/recuperacion/confirmacion:",
      error instanceof Error ? error.message : "Error desconocido",
    );
    return sinCache(
      NextResponse.json(
        { success: false, error: "No se pudo actualizar la contraseña" },
        { status: 500 },
      ),
    );
  }
}
