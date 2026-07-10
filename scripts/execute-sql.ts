import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Variables de entorno no configuradas");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Columnas a agregar
const columnas = [
  // Datos personales extendidos
  { nombre: "cargaslegales", tipo: "TEXT" },
  { nombre: "estadocivil", tipo: "TEXT" },
  { nombre: "regimenmatrimonial", tipo: "TEXT" },
  { nombre: "fechanacimiento", tipo: "TEXT" },
  { nombre: "estudios", tipo: "TEXT" },
  { nombre: "profesion", tipo: "TEXT" },
  { nombre: "domicilioparticular", tipo: "TEXT" },
  { nombre: "comunaciudad", tipo: "TEXT" },
  { nombre: "valorarriendo", tipo: "NUMERIC" },
  { nombre: "afp", tipo: "TEXT" },
  // Datos del empleador
  { nombre: "nombreempleador", tipo: "TEXT" },
  { nombre: "rutfactura", tipo: "TEXT" },
  { nombre: "fechaingreso", tipo: "TEXT" },
  { nombre: "cargo", tipo: "TEXT" },
  { nombre: "rentaliquida", tipo: "NUMERIC" },
  { nombre: "bancoabonorenta", tipo: "TEXT" },
  { nombre: "fechapago", tipo: "TEXT" },
  { nombre: "direccionlaboral", tipo: "TEXT" },
  { nombre: "comunaciudadlaboral", tipo: "TEXT" },
  { nombre: "telefonolaboralfijo", tipo: "TEXT" },
  { nombre: "emaillaboral", tipo: "TEXT" },
  { nombre: "otrosingresos", tipo: "TEXT" },
];

async function executeSQL() {
  console.log("=== Agregando columnas a la tabla leads ===\n");

  // Verificar columnas existentes primero
  const { data: existingColumns } = await supabase
    .from("leads")
    .select("*")
    .limit(1);

  const existingCols = existingColumns && existingColumns.length > 0
    ? Object.keys(existingColumns[0])
    : [];

  let agregadas = 0;
  let existentes = 0;
  let errores = 0;

  for (const col of columnas) {
    if (existingCols.includes(col.nombre)) {
      console.log(`  ⊘ ${col.nombre} - ya existe`);
      existentes++;
      continue;
    }

    // Intentar insertar un registro temporal para ver si la columna existe
    const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { error } = await supabase
      .from("leads")
      .insert({ id: testId, nombre: "test", apellido: "test", rut: `test-${Date.now()}`, [col.nombre]: null });

    if (error && error.message.includes("column")) {
      console.log(`  ✗ ${col.nombre} - NO EXISTE (necesita SQL manual)`);
      errores++;
    } else {
      // Si no hubo error de columna, la columna existe
      // Limpiar el registro de prueba
      if (!error) {
        await supabase.from("leads").delete().eq("id", testId);
      }
      console.log(`  ✓ ${col.nombre} - OK`);
      agregadas++;
    }
  }

  console.log(`\n=== Resultado ===`);
  console.log(`  Existentes: ${existentes}`);
  console.log(`  Funcionando: ${agregadas}`);
  console.log(`  Necesitan SQL: ${errores}`);

  if (errores > 0) {
    console.log(`\n  Las ${errores} columnas que faltan necesitan ejecutarse via SQL.`);
    console.log(`  Copia y pega este SQL en el SQL Editor de Supabase:\n`);
    console.log(`  -- Copiar desde aqui --`);
    for (const col of columnas) {
      if (!existingCols.includes(col.nombre)) {
        console.log(`  ALTER TABLE leads ADD COLUMN IF NOT EXISTS ${col.nombre} ${col.tipo};`);
      }
    }
    console.log(`  -- Hasta aqui --`);
  }
}

executeSQL().catch(console.error);
