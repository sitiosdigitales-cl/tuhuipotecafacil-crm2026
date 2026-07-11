import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function debug() {
  // Try to get any data
  const { data, error } = await supabase.from("pipeline_stages").select("*").limit(1);

  console.log("Error:", error?.message || "None");
  console.log("Data:", JSON.stringify(data, null, 2));

  // Try to insert one row
  const { error: insertError } = await supabase.from("pipeline_stages").insert({
    id: "TEST123",
    nombre: "Test Stage",
    color: "#FF0000",
    orden: 999,
    activa: true,
  });

  console.log("Insert error:", insertError?.message || "None");

  // Clean up
  if (!insertError) {
    await supabase.from("pipeline_stages").delete().eq("id", "TEST123");
    console.log("Cleaned up test row");
  }
}

debug();
