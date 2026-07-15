/**
 * Configuración del módulo Automatización
 */

import type { Rol } from "@/tipos";

export const AUTOMATIZACION_PERMISOS: Record<string, Rol[]> = {
  ver: ["SUPER_ADMIN", "ADMIN"],
  crear: ["SUPER_ADMIN", "ADMIN"],
  editar: ["SUPER_ADMIN", "ADMIN"],
  eliminar: ["SUPER_ADMIN"],
  activar: ["SUPER_ADMIN", "ADMIN"],
};

export const FLUJOS_ESTADOS = [
  { id: "BORRADOR", label: "Borrador", color: "#64748B" },
  { id: "ACTIVO", label: "Activo", color: "#10B981" },
  { id: "PAUSADO", label: "Pausado", color: "#F59E0B" },
] as const;

export const TRIGGERS_TIPOS = [
  { id: "CAMBIO_ETAPA", label: "Cambio de Etapa" },
  { id: "DOCUMENTO_SUBIDO", label: "Documento Subido" },
  { id: "DOCUMENTO_APROBADO", label: "Documento Aprobado" },
  { id: "TAREA_CREADA", label: "Tarea Creada" },
  { id: "NUEVO_LEAD", label: "Nuevo Lead" },
] as const;

export function tienePermisoAutomatizacion(rol: string, accion: string): boolean {
  const permisos = AUTOMATIZACION_PERMISOS[accion];
  if (!permisos) return false;
  return permisos.includes(rol as any);
}
