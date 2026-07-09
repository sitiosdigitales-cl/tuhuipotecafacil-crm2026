import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://larcrkislkrtpnhzofni.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_GuspM3K-3aOy2j7oWV4eWg_VPvGWSCj";

export const supabase = createClient(supabaseUrl, supabaseKey);
