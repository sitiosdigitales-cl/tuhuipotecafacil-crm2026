const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://larcrkislkrtpnhzofni.supabase.co",
  "sb_publishable_GuspM3K-3aOy2j7oWV4eWg_VPvGWSCj"
);

async function verify() {
  const { data, error } = await supabase.from("leads").select("id").limit(1);
  console.log("Leads:", data ? data.length : 0);
  if (error) console.log("Error:", error.message);
}

verify();
