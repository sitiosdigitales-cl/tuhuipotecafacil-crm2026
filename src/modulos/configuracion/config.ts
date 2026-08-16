/**
 * Configuración del módulo Configuración
 */

import type { Rol } from "@/tipos";

export const CONFIG_PERMISOS: Record<string, Rol[]> = {
  ver: ["SUPER_ADMIN", "ADMIN"],
  editar: ["SUPER_ADMIN"],
  gestionarIntegraciones: ["SUPER_ADMIN", "ADMIN"],
};

export function tienePermisoConfig(rol: string, accion: string): boolean {
  const permisos = CONFIG_PERMISOS[accion];
  if (!permisos) return false;
  return permisos.some((permiso) => permiso === rol);
}
