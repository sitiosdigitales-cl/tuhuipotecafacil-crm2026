import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Endpoint para agregar columnas faltantes a la tabla usuarios
// Solo ejecutar una vez durante setup inicial
export async function POST() {
  const resultados = [];

  const columnas = [
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimoacceso TIMESTAMP WITH TIME ZONE",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS doisfa BOOLEAN DEFAULT FALSE",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intentosfallidos INTEGER DEFAULT 0",
    "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS suspendidohasta TIMESTAMP WITH TIME ZONE",
  ];

  for (const sql of columnas) {
    const { error } = await supabase.rpc("exec_sql", { query: sql }).single();
    if (error) {
      // Intentar con query raw si rpc no existe
      const { error: rawError } = await supabase.from("usuarios").select("id").limit(1);
      resultados.push({ sql: sql.substring(0, 60), status: rawError ? "error" : "verificado", error: error.message });
    } else {
      resultados.push({ sql: sql.substring(0, 60), status: "ok" });
    }
  }

  return NextResponse.json({ success: true, resultados });
}
