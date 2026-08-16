import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generarToken } from "@/lib/jwt";
import { parseBoundedJson, RequestPayloadError } from "@/lib/request-json";
import {
  obtenerRequisitoMfaSupabase,
  recuperarContextoMfa,
  sesionDesdeVerificacionMfa,
} from "@/lib/supabase-mfa";
import {
  eliminarCookieSesionLegada,
  eliminarCookiesSesion,
  establecerCookieSesion,
  establecerCookiesSupabase,
} from "@/lib/session-cookie";

const MAX_MFA_PAYLOAD_BYTES = 2 * 1024;
const VerifyInputSchema = z
  .object({
    factorId: z.string().uuid(),
    code: z.string().regex(/^\d{6}$/),
  })
  .strict();

function sinCache(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await parseBoundedJson(request, MAX_MFA_PAYLOAD_BYTES);
  } catch (error) {
    const status = error instanceof RequestPayloadError ? error.status : 400;
    return sinCache(
      NextResponse.json(
        { success: false, error: "Código MFA inválido" },
        { status },
      ),
    );
  }

  const parsedBody = VerifyInputSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return sinCache(
      NextResponse.json(
        { success: false, error: "Código MFA inválido" },
        { status: 400 },
      ),
    );
  }

  try {
    const contexto = await recuperarContextoMfa(request);
    if (contexto.status !== "authenticated") {
      const response = NextResponse.json(
        { success: false, error: "La sesión MFA no está vigente" },
        { status: contexto.status === "unauthenticated" ? 401 : 403 },
      );
      eliminarCookiesSesion(response);
      return sinCache(response);
    }

    const { data: factors, error: factorsError } =
      await contexto.authClient.auth.mfa.listFactors();
    const factor = factors?.all.find(
      (candidate) =>
        candidate.id === parsedBody.data.factorId &&
        candidate.factor_type === "totp",
    );
    if (factorsError || !factor) {
      return sinCache(
        NextResponse.json(
          { success: false, error: "Código MFA inválido" },
          { status: 400 },
        ),
      );
    }

    const { data, error } =
      await contexto.authClient.auth.mfa.challengeAndVerify(parsedBody.data);
    if (error || !data || data.user.id !== contexto.session.user.id) {
      const response = NextResponse.json(
        { success: false, error: "Código inválido o vencido" },
        { status: 401 },
      );
      establecerCookiesSupabase(response, contexto.session);
      return sinCache(response);
    }

    const session = sesionDesdeVerificacionMfa(data);
    const requisito = await obtenerRequisitoMfaSupabase(
      session.access_token,
      contexto.authClient,
    );
    if (requisito !== "satisfied") {
      throw new Error("Supabase Auth no elevó la sesión a AAL2");
    }

    const token = generarToken({
      userId: contexto.cuenta.id,
      email: contexto.cuenta.email,
      rol: contexto.cuenta.rol,
    });
    const response = NextResponse.json({
      success: true,
      data: {
        usuario: {
          id: contexto.cuenta.id,
          nombre: contexto.cuenta.nombre,
          apellido: contexto.cuenta.apellido,
          email: contexto.cuenta.email,
          rol: contexto.cuenta.rol,
        },
      },
    });
    eliminarCookieSesionLegada(response);
    establecerCookieSesion(response, token);
    establecerCookiesSupabase(response, session);
    return sinCache(response);
  } catch {
    return sinCache(
      NextResponse.json(
        { success: false, error: "No se pudo verificar MFA" },
        { status: 500 },
      ),
    );
  }
}
