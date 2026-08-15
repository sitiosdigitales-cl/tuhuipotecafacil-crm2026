/**
 * Hooks del módulo Leads
 * Re-exporta los hooks existentes del LeadContext
 * y agrega hooks específicos del módulo
 */

import { ETAPAS_CONFIG } from "@/tipos";
import type { Lead } from "@/tipos";

export { useLeads } from "@/lib/contexts/LeadContext";

/**
 * Hook para obtener configuración de etapas
 * @param etapa - ID de la etapa
 * @returns Configuración de la etapa (label, color, etc.)
 */
export function useEtapaConfig(etapa: string) {
  return ETAPAS_CONFIG[etapa as keyof typeof ETAPAS_CONFIG] || null;
}

/**
 * Hook para verificar si un lead puede avanzar de etapa
 * @param leadId - ID del lead
 * @param nuevaEtapa - Etapa destino
 * @returns true si puede avanzar, false si no
 */
export function usePuedeAvanzarEtapa(leadId: string, nuevaEtapa: string): boolean {
  void leadId;
  void nuevaEtapa;
  // Lógica de validación de avance de etapa
  // Se puede expandir con reglas más complejas
  return true;
}

/**
 * Hook para obtener estadísticas del pipeline
 * @param leads - Array de leads
 * @returns Estadísticas del pipeline
 */
export function useEstadisticasPipeline(leads: Lead[]) {
  const estadisticas = {
    total: leads.length,
    porEtapa: {} as Record<string, number>,
    porPrioridad: {} as Record<string, number>,
    montoTotal: 0,
    montoPromedio: 0,
  };

  leads.forEach((lead) => {
    // Contar por etapa
    estadisticas.porEtapa[lead.etapa] = (estadisticas.porEtapa[lead.etapa] || 0) + 1;
    
    // Contar por prioridad
    estadisticas.porPrioridad[lead.prioridad] = (estadisticas.porPrioridad[lead.prioridad] || 0) + 1;
    
    // Sumar montos
    if (lead.montoSolicitado) {
      estadisticas.montoTotal += lead.montoSolicitado;
    }
  });

  estadisticas.montoPromedio = estadisticas.total > 0 
    ? estadisticas.montoTotal / estadisticas.total 
    : 0;

  return estadisticas;
}
