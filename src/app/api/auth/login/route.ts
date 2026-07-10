import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { generarToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email y contraseña requeridos" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !user) {
      return NextResponse.json({ success: false, error: "Credenciales inválidas" }, { status: 401 });
    }

    const passwordValido = await bcrypt.compare(password, user.password);
    if (!passwordValido) {
      return NextResponse.json({ success: false, error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = generarToken({ userId: user.id, email: user.email, rol: user.rol });

    const response = NextResponse.json({
      success: true,
      data: {
        usuario: { id: user.id, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol },
        token,
      },
    });

    response.cookies.set("crm_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    // Compatibilidad con cookie antigua
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, error: "Error en login" }, { status: 500 });
  }
}
