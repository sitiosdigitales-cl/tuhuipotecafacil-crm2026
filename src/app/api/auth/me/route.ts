import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { supabase } from "@/lib/supabase";
import { generarToken } from "@/lib/jwt";
import { renovarSesionSupabaseSolicitud } from "@/lib/request-session";
import {
  eliminarCookieSesionLegada,
  eliminarCookiesSesion,
  establecerCookiesSupabase,
  establecerCookieSesion,
  LEGACY_SESSION_COOKIE,
  SUPABASE_ACCESS_COOKIE,
  SUPABASE_REFRESH_COOKIE,
} from "@/lib/session-cookie";
import { obtenerModoSupabaseAuth } from "@/lib/supabase-auth";

function invalidarSesion(error: string) {
  const response = NextResponse.json(
    { success: false, error },
    { status: 401 }
  );

  eliminarCookiesSesion(response);

  return response;
}

export async function GET(request: NextRequest) {
  try {
    const authMode = obtenerModoSupabaseAuth();
    const hasSupabaseAccess = request.cookies.has(SUPABASE_ACCESS_COOKIE);
    const hasSupabaseRefresh = request.cookies.has(SUPABASE_REFRESH_COOKIE);
    const usesSupabaseSession = authMode !== "legacy" && hasSupabaseRefresh;
    if (authMode !== "legacy" && hasSupabaseAccess && !hasSupabaseRefresh) {
      return invalidarSesion("La sesión de acceso está incompleta");
    }

    const renewed = usesSupabaseSession
      ? await renovarSesionSupabaseSolicitud(request)
      : null;
    if (usesSupabaseSession && !renewed) {
      return invalidarSesion("La sesión ya no está vigente");
    }
    const payload = renewed?.payload ?? await requireAuth(request);
    if (!payload) {
      return invalidarSesion("Token inválido o expirado");
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select("id,nombre,apellido,email,rol,estado")
      .eq("id", payload.userId)
      .single();

    if (error || !data) {
      return invalidarSesion("Usuario no encontrado");
    }

    if (data.estado !== "ACTIVO" || data.rol !== payload.rol) {
      return invalidarSesion("La sesión ya no está vigente");
    }

    const response = NextResponse.json({ success: true, data });
    const tokenRenovado = generarToken({
      userId: data.id,
      email: data.email,
      rol: data.rol,
    });
    establecerCookieSesion(response, tokenRenovado);
    if (renewed) establecerCookiesSupabase(response, renewed.session);
    if (request.cookies.has(LEGACY_SESSION_COOKIE)) {
      eliminarCookieSesionLegada(response);
    }
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch {
    return NextResponse.json({ success: false, error: "Error de autenticación" }, { status: 500 });
  }
}
