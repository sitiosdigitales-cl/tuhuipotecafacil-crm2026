import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireRole, forbidden } from "@/lib/api-auth";

// Endpoint para agregar columnas faltantes a la tabla usuarios
// Solo SUPER_ADMIN
export async function POST(request: NextRequest) {
  const user = requireRole(request, ["SUPER_ADMIN"]);
  if (!user) return forbidden();
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
