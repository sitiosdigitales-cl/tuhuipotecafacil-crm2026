import { NextResponse } from "next/server";
import { eliminarCookiesSesion } from "@/lib/session-cookie";

export async function POST() {
  const response = NextResponse.json({ success: true });
  eliminarCookiesSesion(response);
  return response;
}
