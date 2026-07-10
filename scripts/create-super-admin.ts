import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function createSuperAdmin() {
  console.log("=== Creando Super Admin ===\n");

  const email = "sitiosdigitales.cl@gmail.com";
  const password = "Af91504290";
  const nombre = "Admin";
  const apellido = "Sistema";

  // Verificar si ya existe
  const { data: existente } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .single();

  if (existente) {
    console.log("El usuario ya existe:", existente.id);
    console.log("Actualizando contraseña...");
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { error } = await supabase
      .from("usuarios")
      .update({ password: hashedPassword })
      .eq("email", email);

    if (error) {
      console.error("Error al actualizar:", error.message);
      return;
    }

    console.log("Contraseña actualizada correctamente");
    return;
  }

  // Crear usuario
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const { data: usuario, error } = await supabase
    .from("usuarios")
    .insert({
      id: crypto.randomUUID(),
      nombre,
      apellido,
      email,
      password: hashedPassword,
      rol: "SUPER_ADMIN",
      estado: "ACTIVO",
    })
    .select("id,nombre,apellido,email,rol")
    .single();

  if (error) {
    console.error("Error al crear usuario:", error.message);
    return;
  }

  console.log("Usuario creado exitosamente:");
  console.log("  ID:", usuario.id);
  console.log("  Nombre:", usuario.nombre, usuario.apellido);
  console.log("  Email:", usuario.email);
  console.log("  Rol:", usuario.rol);
  console.log("\nCredenciales:");
  console.log("  Email:", email);
  console.log("  Password:", password);
}

createSuperAdmin();
