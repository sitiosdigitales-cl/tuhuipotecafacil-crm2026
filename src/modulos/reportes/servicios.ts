/**
 * Servicios del módulo Reportes
 */

import { obtenerLeads } from "../leads/servicios";

export async function generarReportePipeline() {
  const result = await obtenerLeads();
  const leads = result.data || [];
  
  const porEtapa: Record<string, number> = {};
  const porOrigen: Record<string, number> = {};
  let montoTotal = 0;
  
  leads.forEach((lead: any) => {
    porEtapa[lead.etapa] = (porEtapa[lead.etapa] || 0) + 1;
    porOrigen[lead.origen] = (porOrigen[lead.origen] || 0) + 1;
    if (lead.montoSolicitado) montoTotal += lead.montoSolicitado;
  });
  
  return {
    totalLeads: leads.length,
    porEtapa,
    porOrigen,
    montoTotal,
    montoPromedio: leads.length > 0 ? montoTotal / leads.length : 0,
  };
}

export async function generarReporteConversion() {
  const result = await obtenerLeads();
  const leads = result.data || [];
  
  const aprobados = leads.filter((l: any) => 
    ["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CREDITO_PAGADO", "CLIENTE_FINALIZADO"].includes(l.etapa)
  ).length;
  
  return {
    totalLeads: leads.length,
    aprobados,
    tasaConversion: leads.length > 0 ? Math.round((aprobados / leads.length) * 100) : 0,
  };
}

export async function generarReporteEjecutivos() {
  const result = await obtenerLeads();
  const leads = result.data || [];
  
  const porEjecutivo: Record<string, { total: number; aprobados: number }> = {};
  
  leads.forEach((lead: any) => {
    const ejecutivo = lead.nombreEjecutivo || "Sin asignar";
    if (!porEjecutivo[ejecutivo]) {
      porEjecutivo[ejecutivo] = { total: 0, aprobados: 0 };
    }
    porEjecutivo[ejecutivo].total++;
    if (["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CREDITO_PAGADO", "CLIENTE_FINALIZADO"].includes(lead.etapa)) {
      porEjecutivo[ejecutivo].aprobados++;
    }
  });
  
  return { porEjecutivo };
}
