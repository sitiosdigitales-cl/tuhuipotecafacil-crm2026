import type { NextResponse } from "next/server";
import type { Session } from "@supabase/supabase-js";

export const SESSION_COOKIE = "crm_token";
export const LEGACY_SESSION_COOKIE = "auth_token";
export const SUPABASE_ACCESS_COOKIE = "crm_sb_access";
export const SUPABASE_REFRESH_COOKIE = "crm_sb_refresh";
export const SESSION_MAX_AGE_SECONDS = 30 * 60;
const SUPABASE_ACCESS_MAX_AGE_SECONDS = 60 * 60;
const SUPABASE_REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function opcionesCookie(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    priority: "high" as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function establecerCookiesSupabase(
  response: NextResponse,
  session: Session,
): void {
  const remainingSeconds = session.expires_at
    ? session.expires_at - Math.floor(Date.now() / 1_000)
    : session.expires_in;
  const accessMaxAge = Math.max(
    60,
    Math.min(remainingSeconds, SUPABASE_ACCESS_MAX_AGE_SECONDS),
  );
  response.cookies.set(
    SUPABASE_ACCESS_COOKIE,
    session.access_token,
    opcionesCookie(accessMaxAge),
  );
  response.cookies.set(
    SUPABASE_REFRESH_COOKIE,
    session.refresh_token,
    opcionesCookie(SUPABASE_REFRESH_MAX_AGE_SECONDS),
  );
}

export function establecerCookieSesion(
  response: NextResponse,
  token: string
): void {
  response.cookies.set(
    SESSION_COOKIE,
    token,
    opcionesCookie(SESSION_MAX_AGE_SECONDS)
  );
}

export function eliminarCookieSesionLegada(response: NextResponse): void {
  response.cookies.set(
    LEGACY_SESSION_COOKIE,
    "",
    opcionesCookie(0)
  );
}

export function eliminarCookiesCrm(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", opcionesCookie(0));
  eliminarCookieSesionLegada(response);
}

export function eliminarCookiesSesion(response: NextResponse): void {
  eliminarCookiesCrm(response);
  response.cookies.set(SUPABASE_ACCESS_COOKIE, "", opcionesCookie(0));
  response.cookies.set(SUPABASE_REFRESH_COOKIE, "", opcionesCookie(0));
}
