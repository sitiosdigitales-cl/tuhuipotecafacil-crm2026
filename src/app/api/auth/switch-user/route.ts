import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generarToken } from "@/lib/jwt";
import { requireRole, forbidden } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  // Solo SUPER_ADMIN y ADMIN pueden cambiar de usuario
  const auth = requireRole(request, ["SUPER_ADMIN", "ADMIN"]);
  if (!auth) return forbidden();

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId requerido" }, { status: 400 });
    }

    // Buscar el usuario destino
    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("id, nombre, apellido, email, rol")
      .eq("id", userId)
      .single();

    if (error || !usuario) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar que el usuario esté activo
    const { data: usuarioCompleto } = await supabase
      .from("usuarios")
      .select("estado")
      .eq("id", userId)
      .single();

    if (usuarioCompleto?.estado !== "ACTIVO") {
      return NextResponse.json({ success: false, error: "Usuario inactivo" }, { status: 400 });
    }

    // Generar nuevo token para el usuario destino
    const token = generarToken({
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

    // Crear respuesta con nueva cookie
    const response = NextResponse.json({
      success: true,
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          rol: usuario.rol,
        },
        token,
      },
    });

    // Actualizar cookies
    response.cookies.set("crm_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
