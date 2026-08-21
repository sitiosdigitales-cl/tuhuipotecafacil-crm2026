import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function healthResponse(status: "ok" | "unavailable", httpStatus: number) {
  const response = NextResponse.json({ status }, { status: httpStatus });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export async function GET() {
  try {
    const { error } = await getSupabaseAdmin()
      .from("usuarios")
      .select("id")
      .limit(1);

    if (error) return healthResponse("unavailable", 503);
    return healthResponse("ok", 200);
  } catch {
    return healthResponse("unavailable", 503);
  }
}

