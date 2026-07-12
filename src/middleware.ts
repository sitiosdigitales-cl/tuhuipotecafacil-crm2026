import { NextRequest, NextResponse } from "next/server";

const RUTAS_PROTEGIDAS = ["/dashboard", "/pipeline", "/leads", "/clientes", "/tareas", "/documentos", "/agenda", "/conversaciones", "/reportes", "/configuracion", "/usuarios", "/permisos", "/auditoria", "/bancos", "/cmf", "/simulador", "/comisiones", "/referidos", "/campanas", "/landings", "/biblioteca", "/flujos", "/plantillas", "/triggers", "/integraciones", "/portal", "/recordatorios", "/resumen", "/asistente"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo proteger rutas del dashboard (el matcher ya excluye /api/ y /_next/)
  const rutaProtegida = RUTAS_PROTEGIDAS.some(ruta => pathname.startsWith(ruta));

  if (!rutaProtegida) {
    return NextResponse.next();
  }

  // Buscar token en cookies (compatibilidad con ambos nombres)
  const authToken = request.cookies.get("crm_token")?.value || request.cookies.get("auth_token")?.value;

  if (!authToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Excluir /api/, /_next/, /favicon, /portal-cliente y /login
    "/((?!api/|_next/|favicon|portal-cliente|login|register).*)",
  ],
};
