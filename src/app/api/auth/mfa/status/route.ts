import { NextRequest, NextResponse } from "next/server";

import {
  obtenerRequisitoMfaSupabase,
  recuperarContextoMfa,
} from "@/lib/supabase-mfa";
import {
  eliminarCookiesSesion,
  establecerCookiesSupabase,
} from "@/lib/session-cookie";

function sinCache(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function GET(request: NextRequest) {
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

    const requisito = await obtenerRequisitoMfaSupabase(
      contexto.session.access_token,
      contexto.authClient,
    );
    const { data: factors, error } =
      await contexto.authClient.auth.mfa.listFactors();
    if (error || !factors) throw new Error("No se pudieron consultar los factores MFA");

    const factor = factors.totp[0];
    if (requisito === "challenge" && !factor) {
      throw new Error("La cuenta no tiene un factor TOTP compatible");
    }

    const response = NextResponse.json({
      success: true,
      data: {
        mode: requisito,
        ...(requisito === "challenge" && factor ? { factorId: factor.id } : {}),
      },
    });
    establecerCookiesSupabase(response, contexto.session);
    return sinCache(response);
  } catch {
    return sinCache(
      NextResponse.json(
        { success: false, error: "No se pudo comprobar MFA" },
        { status: 500 },
      ),
    );
  }
}
