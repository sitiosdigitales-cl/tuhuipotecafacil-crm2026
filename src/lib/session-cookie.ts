import type { NextResponse } from "next/server";

export const SESSION_COOKIE = "crm_token";
export const LEGACY_SESSION_COOKIE = "auth_token";
export const SESSION_MAX_AGE_SECONDS = 30 * 60;

function opcionesCookie(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
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

export function eliminarCookiesSesion(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", opcionesCookie(0));
  eliminarCookieSesionLegada(response);
}
