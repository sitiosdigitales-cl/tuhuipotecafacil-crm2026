import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const anonClient = createClient(url || "", anonKey || "");
  const { data: anonTest, error: anonError } = await anonClient
    .from("leads")
    .select("id")
    .limit(1);

  const serviceClient = createClient(url || "", serviceKey || anonKey || "");
  const { data: serviceTest, error: serviceError } = await serviceClient
    .from("leads")
    .select("id")
    .limit(1);

  return NextResponse.json({
    config: {
      url: url ? "configured" : "MISSING",
      anonKey: anonKey ? "configured" : "MISSING",
      serviceKey: serviceKey ? "configured" : "MISSING",
    },
    anonQuery: { success: !anonError, error: anonError?.message, data: anonTest },
    serviceQuery: { success: !serviceError, error: serviceError?.message, data: serviceTest },
  });
}
