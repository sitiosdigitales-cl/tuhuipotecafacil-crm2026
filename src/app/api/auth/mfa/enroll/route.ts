import { NextRequest, NextResponse } from "next/server";

import { recuperarContextoMfa } from "@/lib/supabase-mfa";
import {
  eliminarCookiesSesion,
  establecerCookiesSupabase,
} from "@/lib/session-cookie";

function sinCache(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function POST(request: NextRequest) {
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
    if (factorsError || !factors) {
      throw new Error("No se pudieron consultar los factores MFA");
    }
    if (factors.totp.length > 0) {
      const response = NextResponse.json(
        {
          success: false,
          code: "MFA_CHALLENGE_REQUIRED",
          error: "La cuenta ya tiene un autenticador configurado",
        },
        { status: 409 },
      );
      establecerCookiesSupabase(response, contexto.session);
      return sinCache(response);
    }

    const staleFactors = factors.all.filter(
      (factor) => factor.factor_type === "totp" && factor.status === "unverified",
    );
    for (const factor of staleFactors) {
      const { error } = await contexto.authClient.auth.mfa.unenroll({
        factorId: factor.id,
      });
      if (error) throw new Error("No se pudo renovar el enrolamiento MFA");
    }

    const { data, error } = await contexto.authClient.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "TuHipotecaFacil CRM",
      issuer: "TuHipotecaFacil.cl",
    });
    if (error || !data || data.type !== "totp") {
      throw new Error("No se pudo crear el factor MFA");
    }

    const response = NextResponse.json({
      success: true,
      data: {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      },
    });
    establecerCookiesSupabase(response, contexto.session);
    return sinCache(response);
  } catch {
    return sinCache(
      NextResponse.json(
        { success: false, error: "No se pudo configurar MFA" },
        { status: 500 },
      ),
    );
  }
}
