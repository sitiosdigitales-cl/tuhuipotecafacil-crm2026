/**
 * Configuración del módulo Comisiones
 */

import type { Rol } from "@/tipos";

export const COMISIONES_PERMISOS: Record<string, Rol[]> = {
  ver: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
  crear: ["SUPER_ADMIN", "ADMIN"],
  editar: ["SUPER_ADMIN", "ADMIN"],
  eliminar: ["SUPER_ADMIN"],
};

export const COMISIONES_ESTADOS = [
  { id: "PENDIENTE", label: "Pendiente", color: "#F59E0B" },
  { id: "APROBADA", label: "Aprobada", color: "#10B981" },
  { id: "PAGADA", label: "Pagada", color: "#3B82F6" },
] as const;

export function tienePermisoComision(rol: string, accion: string): boolean {
  const permisos = COMISIONES_PERMISOS[accion];
  if (!permisos) return false;
  return permisos.includes(rol as any);
}
