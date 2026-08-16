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
  { prefijo: "/campanas", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefijo: "/biblioteca", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefijo: "/flujos", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefijo: "/plantillas", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefijo: "/triggers", roles: ["SUPER_ADMIN", "ADMIN"] },

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

/**
 * Dónde mandar a cada rol cuando pide una ruta que no le corresponde.
 *
 * No puede ser un destino fijo: /dashboard está restringido al equipo
 * comercial, así que enviar ahí a un AGENTE o a un CLIENTE los dejaba
 * rebotando contra la misma regla, redirección tras redirección.
 */
const INICIO_POR_ROL: Record<Rol, string> = {
  SUPER_ADMIN: "/dashboard",
  ADMIN: "/dashboard",
  EJECUTIVO: "/dashboard",
  AGENTE: "/documentos",
  CLIENTE: "/portal-cliente",
};

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

  const rol = sesion.rol as Rol;

  if (!permitidos.includes(rol)) {
    // Sesión válida pero sin permiso: a su pantalla de inicio, no al login.
    // Mandarlo a iniciar sesión sugeriría que el problema es la sesión.
    const inicio = INICIO_POR_ROL[rol];

    // Si su propio inicio es la ruta que se le está negando, o el rol no
    // figura en la tabla, no hay a dónde mandarlo sin volver a caer acá.
    if (!inicio || pathname.startsWith(inicio)) {
      return new NextResponse("No tienes acceso a esta sección", { status: 403 });
    }

    return NextResponse.redirect(new URL(inicio, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Excluir /api/, /_next/, /favicon y las páginas públicas.
    "/((?!api/|_next/|favicon|simulador-publico|login|register).*)",
  ],
};
