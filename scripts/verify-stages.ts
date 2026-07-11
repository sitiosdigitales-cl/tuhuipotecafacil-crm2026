import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function verify() {
  const { data, error } = await supabase
    .from("pipeline_stages")
    .select("*")
    .order("orden", { ascending: true });

  if (error) {
    console.log("Error:", error.message);
    return;
  }

  console.log("Etapas en la base de datos:", data ? data.length : 0);
  data?.forEach(e => console.log("  " + e.orden + ". " + e.nombre + " (" + e.color + ")"));
}

verify();
