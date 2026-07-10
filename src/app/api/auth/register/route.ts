import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { generarToken } from "@/lib/jwt";
import { requireAuth, unauthorized } from "@/lib/api-auth";

// Roles permitidos para crear usuarios (sin SUPER_ADMIN)
const ROLES_PERMITIDOS = ["AGENTE", "GERENTE", "ADMIN"];

export async function POST(request: NextRequest) {
  // Solo usuarios autenticados pueden crear nuevos usuarios
  const auth = requireAuth(request);
  if (!auth) return unauthorized();

  // Solo ADMIN y SUPER_ADMIN pueden crear usuarios
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.rol)) {
    return NextResponse.json({ success: false, error: "No tienes permisos para crear usuarios" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { nombre, apellido, email, password, telefono, rol } = body;
    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json({ success: false, error: "Campos requeridos faltantes" }, { status: 400 });
    }

    // Validar que el rol sea permitido (nunca SUPER_ADMIN desde aquí)
    const rolFinal = ROLES_PERMITIDOS.includes(rol) ? rol : "AGENTE";

    const { data: existente } = await supabase.from("usuarios").select("id").eq("email", email.toLowerCase()).single();
    if (existente) return NextResponse.json({ success: false, error: "Email ya registrado" }, { status: 409 });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const { data: usuario, error } = await supabase.from("usuarios").insert({
      nombre, apellido, email: email.toLowerCase(), password: hashedPassword,
      telefono: telefono || null, rol: rolFinal,
    }).select("id,nombre,email,rol").single();

    if (error) return NextResponse.json({ success: false, error: "Error al crear usuario" }, { status: 500 });

    const token = generarToken({ userId: usuario.id, email: usuario.email, rol: usuario.rol });
    const response = NextResponse.json({ success: true, data: { token, usuario } }, { status: 201 });
    response.cookies.set("auth_token", token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400, path: "/" });
    return response;
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
