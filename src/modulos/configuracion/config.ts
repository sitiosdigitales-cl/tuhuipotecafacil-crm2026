/**
 * Configuración del módulo Configuración
 */

import type { Rol } from "@/tipos";

export const CONFIG_PERMISOS: Record<string, Rol[]> = {
  ver: ["SUPER_ADMIN", "ADMIN"],
  editar: ["SUPER_ADMIN"],
  gestionarIntegraciones: ["SUPER_ADMIN", "ADMIN"],
};

export const CONFIG_SECCIONES = [
  { id: "general", label: "General", icono: "Settings" },
  { id: "notificaciones", label: "Notificaciones", icono: "Bell" },
  { id: "integraciones", label: "Integraciones", icono: "Link" },
  { id: "emails", label: "Emails", icono: "Mail" },
  { id: "pipeline", label: "Pipeline", icono: "GitBranch" },
  { id: "seguridad", label: "Seguridad", icono: "Shield" },
] as const;

export function tienePermisoConfig(rol: string, accion: string): boolean {
  const permisos = CONFIG_PERMISOS[accion];
  if (!permisos) return false;
  return permisos.includes(rol as any);
}
