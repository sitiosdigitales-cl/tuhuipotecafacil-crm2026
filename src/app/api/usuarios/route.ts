import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { requireRole, forbidden } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const rol = searchParams.get("rol");
    const estado = searchParams.get("estado");
    const busqueda = searchParams.get("busqueda");

    // Seleccionar solo columnas que sabemos que existen
    let query = supabase.from("usuarios").select("id,nombre,apellido,email,telefono,rol,estado,cargo,creadoen");

    if (id) query = query.eq("id", id);
    if (rol) query = query.eq("rol", rol);
    if (estado) query = query.eq("estado", estado);
    if (busqueda) {
      // Dividir la búsqueda en palabras para buscar en nombre y apellido
      const palabras = busqueda.split(' ').filter(p => p.length > 0);
      const condiciones = palabras.map(p => `nombre.ilike.%${p}%`).join(',');
      const condicionesApellido = palabras.map(p => `apellido.ilike.%${p}%`).join(',');
      query = query.or(`${condiciones},${condicionesApellido},email.ilike.%${busqueda}%`);
    }

    query = query.order("creadoen", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error al consultar usuarios:", error.message, error.details);
      return NextResponse.json({ success: true, data: [], error: error.message });
    }

    const usuarios = (data || []).map((u: any) => ({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      telefono: u.telefono,
      rol: u.rol,
      estado: u.estado,
      cargo: u.cargo || null,
      ultimoAcceso: null,
      creadoEn: u.creadoen,
    }));

    return NextResponse.json({ success: true, data: usuarios });
  } catch (e) {
    console.error("Error interno en GET /api/usuarios:", e);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  // Solo ADMIN y SUPER_ADMIN pueden crear usuarios
  if (!requireRole(request, ["ADMIN", "SUPER_ADMIN"])) return forbidden();
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
