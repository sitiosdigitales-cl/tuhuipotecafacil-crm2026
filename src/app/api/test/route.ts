import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "no URL";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "no KEY";
  
  const { data, error } = await supabase.from("leads").select("id").limit(3);
  
  return NextResponse.json({
    envUrl: url.substring(0, 30) + "...",
    envKey: key.substring(0, 20) + "...",
    leadsCount: data?.length || 0,
    error: error?.message || null,
  });
}
