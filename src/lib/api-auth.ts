import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, TokenPayload } from "./jwt";

export function requireAuth(request: NextRequest): TokenPayload | null {
  return authenticateRequest(request);
}

export function requireRole(request: NextRequest, roles: string[]): TokenPayload | null {
  const auth = authenticateRequest(request);
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
