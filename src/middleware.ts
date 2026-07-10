import { NextRequest, NextResponse } from "next/server";

const RUTAS_PROTEGIDAS = ["/dashboard", "/pipeline", "/leads", "/clientes", "/tareas", "/documentos", "/agenda", "/conversaciones", "/reportes", "/configuracion", "/usuarios", "/permisos", "/auditoria", "/bancos", "/cmf", "/simulador", "/comisiones", "/referidos", "/campanas", "/landings", "/biblioteca", "/flujos", "/plantillas", "/triggers", "/integraciones", "/portal", "/recordatorios", "/resumen", "/asistente"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar si la ruta está protegida
  const rutaProtegida = RUTAS_PROTEGIDAS.some(ruta => pathname.startsWith(ruta));

  if (!rutaProtegida) {
    return NextResponse.next();
  }

  // Buscar token en cookies
  const authToken = request.cookies.get("crm_token")?.value;

  if (!authToken) {
    // Sin token, redirigir a login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token existe, permitir (la validación real la hace el AuthContext)
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pipeline/:path*",
    "/leads/:path*",
    "/clientes/:path*",
    "/tareas/:path*",
    "/documentos/:path*",
    "/agenda/:path*",
    "/conversaciones/:path*",
    "/reportes/:path*",
    "/configuracion/:path*",
    "/usuarios/:path*",
    "/permisos/:path*",
    "/auditoria/:path*",
    "/bancos/:path*",
    "/cmf/:path*",
    "/simulador/:path*",
    "/comisiones/:path*",
    "/referidos/:path*",
    "/campanas/:path*",
    "/landings/:path*",
    "/biblioteca/:path*",
    "/flujos/:path*",
    "/plantillas/:path*",
    "/triggers/:path*",
    "/integraciones/:path*",
    "/portal/:path*",
    "/recordatorios/:path*",
    "/resumen/:path*",
    "/asistente/:path*",
  ],
};
