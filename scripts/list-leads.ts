import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function listLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select("id,nombre,apellido,rut,email,telefono,etapa,prioridad,banco,creadoen")
    .order("creadoen", { ascending: false })
    .limit(10);

  if (error) {
    console.log("Error:", error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log("No hay leads en la base de datos");
    console.log("\nPuedes crear uno desde: http://localhost:3000/leads");
    return;
  }

  console.log("=== Leads en la base de datos ===\n");
  data.forEach((l, i) => {
    console.log(`${i + 1}. ${l.nombre} ${l.apellido}`);
    console.log(`   RUT: ${l.rut}`);
    console.log(`   Email: ${l.email || "Sin email"}`);
    console.log(`   Teléfono: ${l.telefono || "Sin teléfono"}`);
    console.log(`   Etapa: ${l.etapa}`);
    console.log(`   Banco: ${l.banco || "Sin banco"}`);
    console.log(`   Creado: ${new Date(l.creadoen).toLocaleDateString("es-CL")}`);
    console.log("");
  });

  console.log(`Total: ${data.length} leads`);
  console.log("\nPara ver el detalle, ve a: http://localhost:3000/clientes/[id]");
}

listLeads();
