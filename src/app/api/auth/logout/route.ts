import { NextRequest, NextResponse } from "next/server";
import {
  eliminarCookiesSesion,
  SUPABASE_ACCESS_COOKIE,
} from "@/lib/session-cookie";
import { revocarSesionSupabase } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(SUPABASE_ACCESS_COOKIE)?.value;
  if (accessToken) {
    try {
      await revocarSesionSupabase(accessToken);
    } catch {
      console.error("No se pudo revocar la sesión remota durante el cierre");
    }
  }
  const response = NextResponse.json({ success: true });
  eliminarCookiesSesion(response);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
