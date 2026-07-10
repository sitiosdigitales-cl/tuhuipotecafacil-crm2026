import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function cleanLeads() {
  console.log("=== Eliminando leads excepto Jorge Naranjo ===\n");

  // Buscar el lead de Jorge Naranjo
  const { data: jorge } = await supabase
    .from("leads")
    .select("id")
    .eq("rut", "18.211.210-0")
    .single();

  if (!jorge) {
    console.log("No se encontró Jorge Naranjo");
    return;
  }

  console.log("Jorge Naranjo encontrado:", jorge.id);

  // Eliminar todos excepto Jorge
  const { error, count } = await supabase
    .from("leads")
    .delete()
    .neq("id", jorge.id);

  if (error) {
    console.log("Error:", error.message);
    return;
  }

  // Verificar
  const { data: remaining } = await supabase
    .from("leads")
    .select("id,nombre,apellido");

  console.log(`\nLeads eliminados: ${count || "todos menos Jorge"}`);
  console.log(`\nLeads restantes:`);
  remaining?.forEach(l => console.log(`  - ${l.nombre} ${l.apellido}`));
}

cleanLeads();
