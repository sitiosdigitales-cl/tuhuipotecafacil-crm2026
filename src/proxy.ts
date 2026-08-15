import { NextRequest, NextResponse } from "next/server";
import { verificarToken } from "@/lib/jwt";
import type { Rol } from "@/tipos";

/**
 * Proxy (antes middleware). Desde Next 16 corre en runtime Node por defecto,
 * que es lo que permite verificar la firma del token acá: `jsonwebtoken` usa
 * el crypto de Node y no funcionaba en el runtime Edge del middleware.
 *
 * Antes esto solo comprobaba que la cookie EXISTIERA. Cualquiera con
 * `crm_token=loquesea` entraba a todas las pantallas del panel.
 */

/** Rutas del panel y qué roles pueden abrirlas. */
const ACCESO: Array<{ prefijo: string; roles: Rol[] }> = [
  // Administración de cuentas y roles: solo SUPER_ADMIN.
  { prefijo: "/usuarios", roles: ["SUPER_ADMIN"] },
  { prefijo: "/permisos", roles: ["SUPER_ADMIN"] },

  // Configuración del sistema y rastro de auditoría.
  { prefijo: "/auditoria", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefijo: "/backups", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefijo: "/configuracion", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefijo: "/integraciones", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefijo: "/comisiones", roles: ["SUPER_ADMIN", "ADMIN"] },

  // El portal es del cliente; el resto del equipo no lo necesita.
  { prefijo: "/portal-cliente", roles: ["CLIENTE", "SUPER_ADMIN", "ADMIN"] },

  // Trabajo del día a día. AGENTE es la contraparte del banco: entra a
  // documentos y solicitudes de los leads que le asignaron, y a nada más.
  { prefijo: "/documentos", roles: ["SUPER_ADMIN", "ADMIN", "EJECUTIVO", "AGENTE"] },
  { prefijo: "/solicitudes", roles: ["SUPER_ADMIN", "ADMIN", "EJECUTIVO", "AGENTE"] },
  { prefijo: "/leads", roles: ["SUPER_ADMIN", "ADMIN", "EJECUTIVO", "AGENTE"] },
  { prefijo: "/clientes", roles: ["SUPER_ADMIN", "ADMIN", "EJECUTIVO", "AGENTE"] },
];

/** Resto del panel: equipo comercial. Ni CLIENTE ni AGENTE. */
const ROLES_PANEL: Rol[] = ["SUPER_ADMIN", "ADMIN", "EJECUTIVO"];

const RUTAS_PANEL = [
  "/dashboard", "/pipeline", "/leads", "/clientes", "/solicitudes",
  "/centro-actividad", "/tareas", "/actividades", "/documentos", "/agenda",
  "/conversaciones", "/reportes", "/configuracion", "/usuarios", "/permisos",
  "/auditoria", "/backups", "/bancos", "/cmf", "/simulador", "/comisiones",
  "/referidos", "/campanas", "/biblioteca", "/flujos", "/plantillas",
  "/triggers", "/integraciones", "/portal", "/portal-cliente",
  "/recordatorios", "/resumen", "/asistente",
];

function alLogin(request: NextRequest, pathname: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("redirect", pathname);
  const respuesta = NextResponse.redirect(url);
  // Un token inválido o vencido se borra en vez de dejarlo dando vueltas para
  // que el navegador lo reintente en cada navegación.
  respuesta.cookies.delete("crm_token");
  respuesta.cookies.delete("auth_token");
  return respuesta;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!RUTAS_PANEL.some((ruta) => pathname.startsWith(ruta))) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get("crm_token")?.value ||
    request.cookies.get("auth_token")?.value;

  if (!token) return alLogin(request, pathname);

  // Verificación real de la firma, no solo presencia de la cookie.
  const sesion = verificarToken(token);
  if (!sesion) return alLogin(request, pathname);

  const regla = ACCESO.find((r) => pathname.startsWith(r.prefijo));
  const permitidos = regla ? regla.roles : ROLES_PANEL;

  if (!permitidos.includes(sesion.rol as Rol)) {
    // Sesión válida pero sin permiso: al panel, no al login. Mandarlo a
    // iniciar sesión sugeriría que el problema es la sesión.
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Excluir /api/, /_next/, /favicon y las páginas públicas.
    "/((?!api/|_next/|favicon|simulador-publico|login|register).*)",
  ],
};
