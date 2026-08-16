import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { generarToken } from "@/lib/jwt";
import { parseBoundedJson, RequestPayloadError } from "@/lib/request-json";
import {
  establecerCookiesSupabase,
  establecerCookieSesion,
} from "@/lib/session-cookie";
import {
  autenticarIdentidadSupabase,
  migrarIdentidadSupabase,
  obtenerModoSupabaseAuth,
  puenteSupabaseAuthVigente,
  revocarSesionSupabase,
} from "@/lib/supabase-auth";

const MAX_LOGIN_PAYLOAD_BYTES = 4 * 1024;
const LoginInputSchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(254)
      .email()
      .transform((email) => email.toLowerCase()),
    password: z.string().min(1).max(128),
  })
  .strict();

// Hash real de una contraseña que nadie usa. Sirve para gastar el mismo tiempo
// de bcrypt cuando el correo no existe, y así no delatar qué cuentas son
// válidas por la velocidad de la respuesta.
const HASH_DESCARTE = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

// El contador vive en la tabla porque las funciones serverless no comparten
// memoria: un contador en proceso se reinicia con cada instancia nueva y no
// frena nada.
async function registrarIntentoFallido(id: string) {
  const { error } = await supabase.rpc("registrar_intento_login_fallido", {
    p_usuario_id: id,
  });
  if (error) throw new Error(`No se pudo registrar el intento fallido: ${error.message}`);
}

async function limpiarIntentos(id: string) {
  const { error } = await supabase
    .from("usuarios")
    .update({ intentosfallidos: 0, suspendidohasta: null })
    .eq("id", id);
  if (error) throw new Error(`No se pudo limpiar el contador de acceso: ${error.message}`);
}

async function obtenerAuthUserId(id: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("auth_user_id")
    .eq("id", id)
    .single();
  if (error) throw new Error(`No se pudo consultar la identidad Auth: ${error.message}`);
  return typeof data?.auth_user_id === "string" ? data.auth_user_id : null;
}

export async function POST(request: NextRequest) {
  let issuedAuthSession: Session | null = null;
  let rawBody: unknown;
  try {
    rawBody = await parseBoundedJson(request, MAX_LOGIN_PAYLOAD_BYTES);
  } catch (error) {
    if (error instanceof RequestPayloadError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: "Solicitud inválida" },
      { status: 400 }
    );
  }

  const parsedBody = LoginInputSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      { success: false, error: "Email o contraseña inválidos" },
      { status: 400 }
    );
  }

  const { email, password } = parsedBody.data;

  try {
    const authMode = obtenerModoSupabaseAuth();
    // Solo las columnas necesarias. select("*") traía también el hash de todas
    // las demás columnas a memoria sin motivo.
    const { data: user, error } = await supabase
      .from("usuarios")
      .select("id, nombre, apellido, email, password, rol, estado, suspendidohasta")
      .eq("email", email)
      .single();

    if (error || !user) {
      // Se compara igual contra un hash de descarte. Sin esto, un correo
      // inexistente responde en milisegundos y uno real tarda lo que tarda
      // bcrypt: esa diferencia basta para averiguar qué cuentas existen, y con
      // el directorio del equipo eso es la mitad de un ataque dirigido.
      await bcrypt.compare(password, HASH_DESCARTE);
      return NextResponse.json({ success: false, error: "Credenciales inválidas" }, { status: 401 });
    }

    // La cuenta bloqueada responde antes de comparar el hash. Si la columna no
    // existe todavia en la base, el valor es undefined y no bloquea a nadie:
    // degrada a lo que habia antes en vez de dejar fuera al equipo entero.
    if (user.suspendidohasta && new Date(user.suspendidohasta) > new Date()) {
      return NextResponse.json(
        { success: false, error: "Cuenta bloqueada temporalmente por intentos fallidos" },
        { status: 429 }
      );
    }

    let authSession: Session | null = null;
    let authUserId: string | null = null;
    if (authMode !== "legacy" || user.password == null) {
      authUserId = await obtenerAuthUserId(user.id);
    }

    if (authUserId) {
      const authenticated = await autenticarIdentidadSupabase({
        email,
        password,
        expectedAuthUserId: authUserId,
      });
      if (authenticated.status !== "authenticated") {
        await registrarIntentoFallido(user.id);
        return NextResponse.json(
          { success: false, error: "Credenciales inválidas" },
          { status: 401 },
        );
      }
      authSession = authenticated.session;
      issuedAuthSession = authenticated.session;
    } else {
      if (typeof user.password !== "string") {
        throw new Error("La cuenta no conserva una credencial utilizable");
      }

      const passwordValido = await bcrypt.compare(password, user.password);
      if (!passwordValido) {
        await registrarIntentoFallido(user.id);
        return NextResponse.json({ success: false, error: "Credenciales inválidas" }, { status: 401 });
      }

      // La contraseña ya fue validada, por lo que esta respuesta no permite
      // distinguir correos existentes. Una cuenta inactiva no debe crear una
      // identidad nueva ni retirar su hash durante el puente.
      if (user.estado !== "ACTIVO") {
        return NextResponse.json(
          { success: false, error: "Esta cuenta no está habilitada. Habla con un administrador." },
          { status: 403 },
        );
      }

      if (authMode === "required") {
        return NextResponse.json(
          {
            success: false,
            code: "AUTH_MIGRATION_REQUIRED",
            error: "Esta cuenta requiere recuperación antes de iniciar sesión.",
          },
          { status: 403 },
        );
      }

      if (authMode === "bridge") {
        if (!puenteSupabaseAuthVigente()) {
          return NextResponse.json(
            {
              success: false,
              code: "AUTH_MIGRATION_EXPIRED",
              error: "El período de migración terminó. Solicita recuperación de cuenta.",
            },
            { status: 403 },
          );
        }

        const migrated = await migrarIdentidadSupabase({
          identity: { id: user.id, email: user.email },
          password,
        });
        if (migrated.status === "busy") {
          return NextResponse.json(
            { success: false, error: "La cuenta se está actualizando. Intenta nuevamente." },
            { status: 503 },
          );
        }
        if (migrated.status === "password_upgrade_required") {
          return NextResponse.json(
            {
              success: false,
              code: "PASSWORD_UPGRADE_REQUIRED",
              error: "La contraseña debe actualizarse antes de migrar la cuenta.",
            },
            { status: 409 },
          );
        }
        if (migrated.status === "identity_conflict") {
          return NextResponse.json(
            {
              success: false,
              code: "AUTH_IDENTITY_CONFLICT",
              error: "La identidad requiere revisión administrativa.",
            },
            { status: 409 },
          );
        }
        authSession = migrated.session;
        issuedAuthSession = migrated.session;
      }
    }

    // Solo entra una cuenta ACTIVA. El estado se leía y no se usaba, así que
    // alguien dado de baja seguía iniciando sesión con su contraseña de
    // siempre: inhabilitar la cuenta no hacía nada.
    //
    // Se comprueba DESPUÉS de la contraseña a propósito: si respondiera antes,
    // el mensaje distinto delataría qué correos existen en el sistema.
    if (user.estado !== "ACTIVO") {
      if (authSession) await revocarSesionSupabase(authSession.access_token);
      return NextResponse.json(
        { success: false, error: "Esta cuenta no está habilitada. Habla con un administrador." },
        { status: 403 }
      );
    }

    await limpiarIntentos(user.id);

    const token = generarToken({ userId: user.id, email: user.email, rol: user.rol });

    const response = NextResponse.json({
      success: true,
      data: {
        usuario: { id: user.id, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol },
      },
    });

    establecerCookieSesion(response, token);
    if (authSession) establecerCookiesSupabase(response, authSession);

    return response;
  } catch (error) {
    if (issuedAuthSession) {
      try {
        await revocarSesionSupabase(issuedAuthSession.access_token);
      } catch {
        // No se devuelve ni se registra el token. El error original conserva
        // prioridad y la falta de cookie impide reutilizar esta sesión.
      }
    }
    console.error(
      "Error en POST /api/auth/login:",
      error instanceof Error ? error.message : "Error desconocido"
    );
    return NextResponse.json({ success: false, error: "Error en login" }, { status: 500 });
  }
}
