/**
 * Configuración del módulo Reportes
 */

import type { Rol } from "@/tipos";

export const REPORTES_PERMISOS: Record<string, Rol[]> = {
  ver: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
  exportar: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
};

export const REPORTES_TIPOS = [
  { id: "PIPELINE", label: "Pipeline", icono: "GitBranch" },
  { id: "CONVERSION", label: "Conversión", icono: "TrendingUp" },
  { id: "EJECUTIVOS", label: "Rendimiento Ejecutivos", icono: "Users" },
  { id: "BANCOS", label: "Rendimiento Bancos", icono: "Building" },
  { id: "COMISIONES", label: "Comisiones", icono: "DollarSign" },
  { id: "DOCUMENTOS", label: "Documentos", icono: "FileText" },
] as const;

export function tienePermisoReporte(rol: string, accion: string): boolean {
  const permisos = REPORTES_PERMISOS[accion];
  if (!permisos) return false;
  return permisos.includes(rol as any);
}
