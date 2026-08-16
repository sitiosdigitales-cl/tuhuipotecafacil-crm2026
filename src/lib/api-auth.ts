import { NextRequest, NextResponse } from "next/server";
import type { TokenPayload } from "./jwt";
import { validarSesionSolicitud } from "./request-session";

const requestAuthCache = new WeakMap<NextRequest, Promise<TokenPayload | null>>();

function obtenerSesion(request: NextRequest): Promise<TokenPayload | null> {
  const cached = requestAuthCache.get(request);
  if (cached) return cached;
  const validation = validarSesionSolicitud(request);
  requestAuthCache.set(request, validation);
  return validation;
}

export function requireAuth(request: NextRequest): Promise<TokenPayload | null> {
  return obtenerSesion(request);
}

export async function requireRole(
  request: NextRequest,
  roles: string[],
): Promise<TokenPayload | null> {
  const auth = await obtenerSesion(request);
  if (!auth) return null;
  if (!roles.includes(auth.rol)) return null;
  return auth;
}

export function unauthorized() {
  return NextResponse.json(
    { success: false, error: "No autenticado" },
    { status: 401 }
  );
}

export function forbidden() {
  return NextResponse.json(
    { success: false, error: "No tienes permisos para realizar esta acción" },
    { status: 403 }
  );
}
