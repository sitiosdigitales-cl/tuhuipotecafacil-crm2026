/**
 * Configuración del módulo Usuarios
 */

import type { Rol } from "@/tipos";

export const USUARIOS_PERMISOS: Record<string, Rol[]> = {
  ver: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
  crear: ["SUPER_ADMIN", "ADMIN"],
  editar: ["SUPER_ADMIN", "ADMIN"],
  eliminar: ["SUPER_ADMIN"],
  cambiarRol: ["SUPER_ADMIN"],
  suspender: ["SUPER_ADMIN", "ADMIN"],
  impersonar: ["SUPER_ADMIN"],
};

export const USUARIOS_ROLES = [
  { id: "SUPER_ADMIN", label: "Super Admin", color: "#EF4444", descripcion: "Acceso total al sistema" },
  { id: "ADMIN", label: "Administrador", color: "#8B5CF6", descripcion: "Gestión completa del CRM" },
  { id: "GERENTE", label: "Gerente", color: "#3B82F6", descripcion: "Supervisión y reportes" },
  { id: "AGENTE", label: "Agente", color: "#10B981", descripcion: "Gestión de leads asignados" },
  { id: "EJECUTIVO", label: "Ejecutivo", color: "#F59E0B", descripcion: "Ventas y seguimiento" },
  { id: "CLIENTE", label: "Cliente", color: "#64748B", descripcion: "Portal del cliente" },
] as const;

export const USUARIOS_ESTADOS = [
  { id: "ACTIVO", label: "Activo", color: "#10B981" },
  { id: "INACTIVO", label: "Inactivo", color: "#64748B" },
  { id: "SUSPENDIDO", label: "Suspendido", color: "#EF4444" },
] as const;

export function tienePermisoUsuario(rol: string, accion: string): boolean {
  const permisos = USUARIOS_PERMISOS[accion];
  if (!permisos) return false;
  return permisos.includes(rol as any);
}
