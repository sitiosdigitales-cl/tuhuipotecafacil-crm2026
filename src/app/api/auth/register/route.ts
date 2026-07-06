import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generarToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, apellido, email, password, telefono, rol } = body;

    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Nombre, apellido, email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { success: false, error: "El email ya está registrado" },
        { status: 409 }
      );
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email: email.toLowerCase(),
        password: hashedPassword,
        telefono: telefono || null,
        rol: rol || "AGENTE",
      },
    });

    // Generar token
    const token = generarToken({
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

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
        },
      },
    }, { status: 201 });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
