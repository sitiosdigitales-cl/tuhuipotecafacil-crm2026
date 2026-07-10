import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rol = searchParams.get("rol");
    const estado = searchParams.get("estado");
    const busqueda = searchParams.get("busqueda");

    let query = supabase.from("usuarios").select("id,nombre,apellido,email,telefono,rol,estado,ultimoacceso,creadoen");

    if (rol) query = query.eq("rol", rol);
    if (estado) query = query.eq("estado", estado);
    if (busqueda) {
      query = query.or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,email.ilike.%${busqueda}%`);
    }

    query = query.order("creadoen", { ascending: false });

    const { data, error } = await query;
    if (error) return NextResponse.json({ success: true, data: [] });

    const usuarios = (data || []).map((u: any) => ({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      telefono: u.telefono,
      rol: u.rol,
      estado: u.estado,
      ultimoAcceso: u.ultimoacceso,
      creadoEn: u.creadoen,
    }));

    return NextResponse.json({ success: true, data: usuarios });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, apellido, email, password, telefono, rol } = body;

    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json({ success: false, error: "Campos requeridos faltantes" }, { status: 400 });
    }

    const { data: existente } = await supabase.from("usuarios").select("id").eq("email", email.toLowerCase()).single();
    if (existente) {
      return NextResponse.json({ success: false, error: "Email ya registrado" }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: usuario, error } = await supabase
      .from("usuarios")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        nombre,
        apellido,
        email: email.toLowerCase(),
        password: hashedPassword,
        telefono: telefono || null,
        rol: rol || "AGENTE",
        estado: "ACTIVO",
        creadoEn: new Date().toISOString(),
      }))
      .select("id,nombre,apellido,email,rol,estado,creadoen")
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error al crear usuario" }, { status: 500 });

    return NextResponse.json({ success: true, data: usuario }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
