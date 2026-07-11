import { NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import bcrypt from "bcryptjs";

const USUARIOS_SEED = [
  { id: "u1", nombre: "Super", apellido: "Admin", email: "admin@tuhipotecafacil.cl", telefono: "+56 9 9999 9999", rol: "SUPER_ADMIN" },
  { id: "u2", nombre: "Andrés", apellido: "Pérez", email: "andres.perez@tuhipotecafacil.cl", telefono: "+56 9 1234 5678", rol: "ADMIN" },
  { id: "u3", nombre: "Carolina", apellido: "Muñoz", email: "carolina.munoz@tuhipotecafacil.cl", telefono: "+56 9 2345 6789", rol: "GERENTE" },
  { id: "u4", nombre: "Diego", apellido: "Silva", email: "diego.silva@tuhipotecafacil.cl", telefono: "+56 9 3456 7890", rol: "AGENTE" },
  { id: "u5", nombre: "Valentina", apellido: "Torres", email: "valentina.torres@tuhipotecafacil.cl", telefono: "+56 9 4567 8901", rol: "AGENTE" },
  { id: "u6", nombre: "Javier", apellido: "Morales", email: "javier.morales@tuhipotecafacil.cl", telefono: "+56 9 5678 9012", rol: "AGENTE" },
];

const PASSWORD_DEFAULT = "admin123";

export async function POST() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(PASSWORD_DEFAULT, salt);

    const resultados = [];

    for (const usuario of USUARIOS_SEED) {
      // Verificar si ya existe
      const { data: existente } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", usuario.email)
        .single();

      if (existente) {
        resultados.push({ email: usuario.email, status: "ya existe" });
        continue;
      }

      const { error } = await supabase
        .from("usuarios")
        .insert(toSupabaseColumns({
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          password: hashedPassword,
          telefono: usuario.telefono,
          rol: usuario.rol,
          estado: "ACTIVO",
          creadoEn: new Date().toISOString(),
        }));

      if (error) {
        resultados.push({ email: usuario.email, status: "error", error: error.message });
      } else {
        resultados.push({ email: usuario.email, status: "creado" });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Seed completado",
      password: PASSWORD_DEFAULT,
      resultados,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al ejecutar seed" },
      { status: 500 }
    );
  }
}
