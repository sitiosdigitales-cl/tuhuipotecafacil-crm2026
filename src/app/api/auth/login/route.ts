import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email y contraseña requeridos" }, { status: 400 });
    }

    // Buscar usuario por email
    const { data: user, error } = await supabase.from("usuarios").select("*").eq("email", email).single();

    if (error || !user) {
      return NextResponse.json({ success: false, error: "Credenciales inválidas" }, { status: 401 });
    }

    // En producción verificaría bcrypt. Por ahora comparación directa para demo
    if (password !== user.password) {
      return NextResponse.json({ success: false, error: "Credenciales inválidas" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        usuario: { id: user.id, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol },
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Error en login" }, { status: 500 });
  }
}
