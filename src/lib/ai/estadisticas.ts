import type { Lead, Etapa } from "@/tipos";

export interface EstadisticasPipeline {
  totalLeads: number;
  leadsPorEtapa: Record<string, number>;
  leadsPorOrigen: Record<string, number>;
  leadsPorEjecutivo: Record<string, number>;
  leadsPorBanco: Record<string, number>;
  tasaConversion: string;
  montoTotalFinanciado: string;
  ticketPromedio: string;
  leadsUrgentes: number;
  leadsEstancados: number;
  topEjecutivos: Array<{ nombre: string; leads: number; monto: number }>;
  topBancos: Array<{ nombre: string; creditos: number; monto: number }>;
}

export function generarEstadisticas(leads: Lead[]): EstadisticasPipeline {
  const totalLeads = leads.length;

  // Leads por etapa
  const leadsPorEtapa: Record<string, number> = {};
  leads.forEach((lead) => {
    const etapa = lead.etapa.replace(/_/g, " ");
    leadsPorEtapa[etapa] = (leadsPorEtapa[etapa] || 0) + 1;
  });

  // Leads por origen
  const leadsPorOrigen: Record<string, number> = {};
  leads.forEach((lead) => {
    leadsPorOrigen[lead.origen] = (leadsPorOrigen[lead.origen] || 0) + 1;
  });

  // Leads por ejecutivo
  const leadsPorEjecutivo: Record<string, number> = {};
  leads.forEach((lead) => {
    if (lead.nombreEjecutivo) {
      leadsPorEjecutivo[lead.nombreEjecutivo] = (leadsPorEjecutivo[lead.nombreEjecutivo] || 0) + 1;
    }
  });

  // Leads por banco
  const leadsPorBanco: Record<string, number> = {};
  leads.forEach((lead) => {
    if (lead.banco) {
      leadsPorBanco[lead.banco] = (leadsPorBanco[lead.banco] || 0) + 1;
    }
  });

  // Tasa de conversión (leads en etapa final / total)
  const etapasFinales = ["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CREDITO_PAGADO", "CLIENTE_FINALIZADO"];
  const leadsAprobados = leads.filter((l) => etapasFinales.includes(l.etapa)).length;
  const tasaConversion = totalLeads > 0 ? ((leadsAprobados / totalLeads) * 100).toFixed(1) : "0";

  // Monto total financiado
  const montoTotal = leads.reduce((acc, l) => acc + (l.montoSolicitado || 0), 0);
  const montoTotalFinanciado = formatMonto(montoTotal);

  // Ticket promedio
  const ticketPromedio = leadsAprobados > 0 ? formatMonto(montoTotal / leadsAprobados) : "$0";

  // Leads urgentes (prioridad URGENTE o ALTA)
  const leadsUrgentes = leads.filter((l) => l.prioridad === "URGENTE" || l.prioridad === "ALTA").length;

  // Leads estancados (más de 14 días en etapa)
  const leadsEstancados = leads.filter((l) => l.diasEnEtapa > 14).length;

  // Top ejecutivos
  const ejecutivoStats: Record<string, { leads: number; monto: number }> = {};
  leads.forEach((lead) => {
    if (lead.nombreEjecutivo) {
      if (!ejecutivoStats[lead.nombreEjecutivo]) {
        ejecutivoStats[lead.nombreEjecutivo] = { leads: 0, monto: 0 };
      }
      ejecutivoStats[lead.nombreEjecutivo].leads++;
      ejecutivoStats[lead.nombreEjecutivo].monto += lead.montoSolicitado || 0;
    }
  });
  const topEjecutivos = Object.entries(ejecutivoStats)
    .map(([nombre, stats]) => ({ nombre, ...stats }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5);

  // Top bancos
  const bancoStats: Record<string, { creditos: number; monto: number }> = {};
  leads.forEach((lead) => {
    if (lead.banco) {
      if (!bancoStats[lead.banco]) {
        bancoStats[lead.banco] = { creditos: 0, monto: 0 };
      }
      bancoStats[lead.banco].creditos++;
      bancoStats[lead.banco].monto += lead.montoSolicitado || 0;
    }
  });
  const topBancos = Object.entries(bancoStats)
    .map(([nombre, stats]) => ({ nombre, ...stats }))
    .sort((a, b) => b.creditos - a.creditos)
    .slice(0, 5);

  return {
    totalLeads,
    leadsPorEtapa,
    leadsPorOrigen,
    leadsPorEjecutivo,
    leadsPorBanco,
    tasaConversion: `${tasaConversion}%`,
    montoTotalFinanciado,
    ticketPromedio,
    leadsUrgentes,
    leadsEstancados,
    topEjecutivos,
    topBancos,
  };
}

function formatMonto(monto: number): string {
  if (monto >= 1_000_000_000) {
    return `$${(monto / 1_000_000_000).toFixed(1)}B CLP`;
  }
  if (monto >= 1_000_000) {
    return `$${(monto / 1_000_000).toFixed(0)}M CLP`;
  }
  return `$${monto.toLocaleString("es-CL")} CLP`;
}

export function generarResumenLeads(leads: Lead[], limite: number = 20): string {
  const leadsRecientes = [...leads]
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
    .slice(0, limite);

  return leadsRecientes
    .map((l) => {
      const etapa = l.etapa.replace(/_/g, " ");
      return `- ${l.nombre} ${l.apellido} (RUT: ${l.rut}) | Etapa: ${etapa} | Banco: ${l.banco || "Sin asignar"} | Monto: ${formatMonto(l.montoSolicitado || 0)} | Ejecutivo: ${l.nombreEjecutivo || "Sin asignar"} | Días en etapa: ${l.diasEnEtapa}`;
    })
    .join("\n");
}

// Función para obtener datos CMF para el asistente IA
export async function obtenerDatosCMFParaIA(): Promise<string> {
  try {
    // Obtener tasa vigente
    const tasaRes = await fetch(`${typeof window !== 'undefined' ? '' : 'http://localhost:3000'}/api/cmf/rates?moneda=UF`);
    const tasaData = await tasaRes.json();

    // Obtener histórico
    const histRes = await fetch(`${typeof window !== 'undefined' ? '' : 'http://localhost:3000'}/api/cmf/rates/history?meses=12`);
    const histData = await histRes.json();

    let cmfInfo = "\n=== DATOS DE TASAS CMF ===\n";

    if (tasaData.success && tasaData.data) {
      const tasa = tasaData.data;
      cmfInfo += `
TASA VIGENTE:
- Tasa actual: ${tasa.tasa.toFixed(2)}% ${tasa.moneda}
- Tipo: ${tasa.tipoOperacion}
- Fecha: ${tasa.fecha}
- Fuente: CMF Chile (Comisión para el Mercado Financiero)
`;
    }

    if (histData.success && histData.data) {
      const historico = histData.data;
      if (historico.length >= 2) {
        const ultima = historico[historico.length - 1];
        const anterior = historico[historico.length - 2];
        const variacion = ultima.tasaPromedio - anterior.tasaPromedio;

        cmfInfo += `
VARIACIÓN RECIENTE:
- Tasa promedio actual: ${ultima.tasaPromedio.toFixed(2)}%
- Tasa promedio mes anterior: ${anterior.tasaPromedio.toFixed(2)}%
- Variación: ${variacion >= 0 ? "+" : ""}${variacion.toFixed(2)}%
- Tendencia: ${variacion > 0 ? "▲ SUBIENDO" : variacion < 0 ? "▼ BAJANDO" : "→ ESTABLE"}
`;
      }

      if (historico.length > 0) {
        const tasas = historico.map((h: { tasaPromedio: number }) => h.tasaPromedio);
        cmfInfo += `
HISTÓRICO (últimos ${historico.length} meses):
- Mínima: ${Math.min(...tasas).toFixed(2)}%
- Máxima: ${Math.max(...tasas).toFixed(2)}%
- Promedio: ${(tasas.reduce((a: number, b: number) => a + b, 0) / tasas.length).toFixed(2)}%
`;
      }
    }

    cmfInfo += "\n========================\n";
    return cmfInfo;
  } catch (error) {
    return "\n=== DATOS CMF: No disponibles ===\n";
  }
}
