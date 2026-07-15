/**
 * Types del módulo Leads
 * Re-exporta types existentes + types específicos del módulo
 */

// Re-exportar types de @/tipos
export type {
  Lead,
  Etapa,
  Prioridad,
  SituacionLaboral,
  OrigenLead,
  DocumentoLead,
  TipoDocumento,
} from "@/tipos";

// Re-exportar configs de @/tipos
export {
  ETAPAS_CONFIG,
  ORIGEN_LABELS,
  ROLES_CONFIG,
  SITUACION_LABORAL_CONFIG,
  RENTAS_MENSUALES,
} from "@/tipos";

// ─── Types específicos del módulo Leads ───

export interface FiltrosLead {
  busqueda?: string;
  etapa?: string;
  prioridad?: string;
  situacionLaboral?: string;
  asignadoA?: string;
  origen?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface EstadisticasPipeline {
  total: number;
  porEtapa: Record<string, number>;
  porPrioridad: Record<string, number>;
  montoTotal: number;
  montoPromedio: number;
}

export interface EjecutivoAsignado {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  cargo?: string;
  rol?: string;
}

export interface LeadConEjecutivo {
  lead: any; // Lead type
  ejecutivo: EjecutivoAsignado | null;
}
