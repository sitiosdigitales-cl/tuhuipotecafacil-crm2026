import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { generarToken } from "@/lib/jwt";

const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;

// El contador vive en la tabla porque las funciones serverless no comparten
// memoria: un contador en proceso se reinicia con cada instancia nueva y no
// frena nada.
async function registrarIntentoFallido(id: string, intentosPrevios: number) {
  const intentos = intentosPrevios + 1;
  const bloqueo =
    intentos >= MAX_INTENTOS
      ? new Date(Date.now() + MINUTOS_BLOQUEO * 60_000).toISOString()
      : null;

  // Si las columnas aun no existen, el update falla y se ignora: nunca puede
  // impedir un login legitimo.
  await supabase
    .from("usuarios")
    .update({ intentosfallidos: intentos, suspendidohasta: bloqueo })
    .eq("id", id)
    .then(undefined, () => {});
}

async function limpiarIntentos(id: string) {
  await supabase
    .from("usuarios")
    .update({ intentosfallidos: 0, suspendidohasta: null })
    .eq("id", id)
    .then(undefined, () => {});
}

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

    // La cuenta bloqueada responde antes de comparar el hash. Si la columna no
    // existe todavia en la base, el valor es undefined y no bloquea a nadie:
    // degrada a lo que habia antes en vez de dejar fuera al equipo entero.
    if (user.suspendidohasta && new Date(user.suspendidohasta) > new Date()) {
      return NextResponse.json(
        { success: false, error: "Cuenta bloqueada temporalmente por intentos fallidos" },
        { status: 429 }
      );
    }

    const passwordValido = await bcrypt.compare(password, user.password);
    if (!passwordValido) {
      await registrarIntentoFallido(user.id, user.intentosfallidos ?? 0);
      return NextResponse.json({ success: false, error: "Credenciales inválidas" }, { status: 401 });
    }

    await limpiarIntentos(user.id);

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
