import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generarToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    // Verificar estado del usuario
    if (usuario.estado !== "ACTIVO") {
      return NextResponse.json(
        { success: false, error: "Cuenta desactivada. Contacta al administrador." },
        { status: 403 }
      );
    }

    // Verificar si está suspendido
    if (usuario.suspendidoHasta && usuario.suspendidoHasta > new Date()) {
      return NextResponse.json(
        { success: false, error: "Cuenta suspendida temporalmente." },
        { status: 403 }
      );
    }

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      // Incrementar intentos fallidos
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { intentosFallidos: usuario.intentosFallidos + 1 },
      });

      return NextResponse.json(
        { success: false, error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    // Generar token JWT
    const token = generarToken({
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

    // Actualizar último acceso e intentos fallidos
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        ultimoAcceso: new Date(),
        intentosFallidos: 0,
      },
    });

    // Crear respuesta con cookie
    const response = NextResponse.json({
      success: true,
      data: {
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          rol: usuario.rol,
          avatar: usuario.avatar,
        },
      },
    });

    // Establecer cookie HttpOnly
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400, // 24 horas
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
