import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function createTable() {
  console.log("=== Creando tabla pipeline_stages ===\n");

  // Intentar crear la tabla mediante una inserción de prueba
  const { error } = await supabase
    .from("pipeline_stages")
    .insert({
      id: "TEST_STAGE",
      nombre: "Test",
      color: "#64748B",
      orden: 999,
      activa: true,
    });

  if (error) {
    console.log("Error al crear tabla:", error.message);
    console.log("\nNecesitas crear la tabla manualmente en Supabase:");
    console.log("1. Ve a https://supabase.com/dashboard");
    console.log("2. Selecciona tu proyecto");
    console.log("3. Ve a SQL Editor");
    console.log("4. Ejecuta el siguiente SQL:\n");
    console.log(`CREATE TABLE IF NOT EXISTS pipeline_stages (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  color TEXT DEFAULT '#64748B',
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);`);
    return;
  }

  // Si se creó, eliminar el registro de prueba
  await supabase.from("pipeline_stages").delete().eq("id", "TEST_STAGE");
  console.log("Tabla creada exitosamente");
}

createTable();
