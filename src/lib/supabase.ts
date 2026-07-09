import { createClient } from "@supabase/supabase-js";

// Hardcoded fallback para确保 que siempre funcione
const supabaseUrl = "https://larcrkislkrtpnhzofni.supabase.co";
const supabaseKey = "sb_publishable_GuspM3K-3aOy2j7oWV4eWg_VPvGWSCj";

export const supabase = createClient(supabaseUrl, supabaseKey);
