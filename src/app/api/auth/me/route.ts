import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verificarToken } from "@/lib/jwt";

function invalidarSesion(error: string) {
  const response = NextResponse.json(
    { success: false, error },
    { status: 401 }
  );

  for (const nombre of ["crm_token", "auth_token"]) {
    response.cookies.set(nombre, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  }

  return response;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("crm_token")?.value || request.cookies.get("auth_token")?.value;
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

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error de autenticación" }, { status: 500 });
  }
}
