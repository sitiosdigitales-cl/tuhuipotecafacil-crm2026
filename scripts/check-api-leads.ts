import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function checkLeads() {
  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  console.log("Total leads in Supabase:", count);
  console.log("Error:", error);

  const { data } = await supabase
    .from("leads")
    .select("id,nombre,apellido,rut")
    .limit(10);

  console.log("\nFirst 10 leads:");
  data?.forEach((l, i) => {
    console.log(`  ${i + 1}. ${l.nombre} ${l.apellido} (${l.rut})`);
  });
}

checkLeads();
