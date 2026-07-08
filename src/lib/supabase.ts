import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lvxdkoelmppyizvoztqp.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_JrPqarKB0kty4g0hgVxiuw_8pVB5E7n";

export const supabase = createClient(supabaseUrl, supabaseKey);
