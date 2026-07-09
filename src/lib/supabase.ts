import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dcoyjvbhrkarrmetrhiv.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_hEiOOmx4G4nXXpa7pA7nLg_N3bOxPSw";

export const supabase = createClient(supabaseUrl, supabaseKey);
