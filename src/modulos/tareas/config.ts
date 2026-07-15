/**
 * Configuración del módulo Tareas
 */

import type { Rol } from "@/tipos";

export const TAREAS_PERMISOS: Record<string, Rol[]> = {
  ver: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"],
  crear: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"],
  editar: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"],
  eliminar: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
  cambiarEstado: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"],
};

export const TAREAS_ESTADOS = [
  { id: "PENDIENTE", label: "Pendiente", color: "#F59E0B", icono: "Clock" },
  { id: "EN_PROGRESO", label: "En Progreso", color: "#3B82F6", icono: "Play" },
  { id: "COMPLETADA", label: "Completada", color: "#10B981", icono: "CheckCircle" },
  { id: "VENCIDA", label: "Vencida", color: "#EF4444", icono: "AlertTriangle" },
] as const;

export const TAREAS_TIPOS = [
  { id: "SEGUIMIENTO", label: "Seguimiento", icono: "Phone" },
  { id: "DOCUMENTACION", label: "Documentación", icono: "FileText" },
  { id: "REUNION", label: "Reunión", icono: "Users" },
  { id: "LLAMADA", label: "Llamada", icono: "PhoneCall" },
  { id: "OTRO", label: "Otro", icono: "MoreHorizontal" },
] as const;

export const TAREAS_PRIORIDADES = [
  { id: "BAJA", label: "Baja", color: "#64748B" },
  { id: "MEDIA", label: "Media", color: "#F59E0B" },
  { id: "ALTA", label: "Alta", color: "#F97316" },
  { id: "URGENTE", label: "Urgente", color: "#EF4444" },
] as const;

export function tienePermisoTarea(rol: string, accion: string): boolean {
  const permisos = TAREAS_PERMISOS[accion];
  if (!permisos) return false;
  return permisos.includes(rol as any);
}
