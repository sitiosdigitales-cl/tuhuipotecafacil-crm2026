/**
 * Configuración del módulo Marketing
 */

import type { Rol } from "@/tipos";

export const MARKETING_PERMISOS: Record<string, Rol[]> = {
  ver: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
  crear: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
  editar: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
  eliminar: ["SUPER_ADMIN", "ADMIN"],
};

export const CAMPANAS_ESTADOS = [
  { id: "PROGRAMADA", label: "Programada", color: "#64748B" },
  { id: "ACTIVA", label: "Activa", color: "#10B981" },
  { id: "PAUSADA", label: "Pausada", color: "#F59E0B" },
  { id: "FINALIZADA", label: "Finalizada", color: "#64748B" },
] as const;

export const CAMPANAS_TIPOS = [
  { id: "EMAIL", label: "Email" },
  { id: "REDES_SOCIALES", label: "Redes Sociales" },
  { id: "WHATSAPP", label: "WhatsApp" },
  { id: "SMS", label: "SMS" },
] as const;

export const LANDINGS_ESTADOS = [
  { id: "BORRADOR", label: "Borrador", color: "#64748B" },
  { id: "PUBLICADA", label: "Publicada", color: "#10B981" },
  { id: "PAUSADA", label: "Pausada", color: "#F59E0B" },
] as const;

export function tienePermisoMarketing(rol: string, accion: string): boolean {
  const permisos = MARKETING_PERMISOS[accion];
  if (!permisos) return false;
  return permisos.includes(rol as any);
}
