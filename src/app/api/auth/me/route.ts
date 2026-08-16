import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generarToken, verificarToken } from "@/lib/jwt";
import {
  eliminarCookieSesionLegada,
  eliminarCookiesSesion,
  establecerCookieSesion,
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
} from "@/lib/session-cookie";

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
    const token =
      request.cookies.get(SESSION_COOKIE)?.value ||
      request.cookies.get(LEGACY_SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const payload = verificarToken(token);
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
    if (request.cookies.has(LEGACY_SESSION_COOKIE)) {
      eliminarCookieSesionLegada(response);
    }
    return response;
  } catch {
    return NextResponse.json({ success: false, error: "Error de autenticación" }, { status: 500 });
  }
}
