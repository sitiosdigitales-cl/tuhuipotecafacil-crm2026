import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function listUsers() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id,nombre,apellido,email,rol,estado");

  if (error) {
    console.log("Error:", error.message);
    return;
  }

  console.log("=== Usuarios en la base de datos ===\n");
  data?.forEach(u => {
    console.log(`${u.nombre} ${u.apellido}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Rol: ${u.rol}`);
    console.log(`  Estado: ${u.estado}`);
    console.log("");
  });
}

listUsers();
