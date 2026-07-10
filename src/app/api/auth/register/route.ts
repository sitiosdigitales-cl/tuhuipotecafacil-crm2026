import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-static";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { generarToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, apellido, email, password, telefono, rol } = body;
    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json({ success: false, error: "Campos requeridos faltantes" }, { status: 400 });
    }
    const { data: existente } = await supabase.from("usuarios").select("id").eq("email", email.toLowerCase()).single();
    if (existente) return NextResponse.json({ success: false, error: "Email ya registrado" }, { status: 409 });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const { data: usuario, error } = await supabase.from("usuarios").insert({
      nombre, apellido, email: email.toLowerCase(), password: hashedPassword,
      telefono: telefono || null, rol: rol || "AGENTE",
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
