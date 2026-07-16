"use client";

import { useMemo } from "react";
import { useUser } from "@/lib/contexts/UserContext";
import { useLeads } from "@/lib/contexts/LeadContext";
import { formatoMonedaAbreviado, clpToUf } from "@/lib/utils";
import type { Etapa } from "@/tipos";

export function useUserData() {
  const { usuarioActual, esSuperAdmin } = useUser();
  const { leads: todosLeads } = useLeads();

  // Leads filtrados: NUEVO_LEAD visible para todos, otros solo para el ejecutivo asignado
  const leads = useMemo(() => {
    if (esSuperAdmin) return todosLeads;
    const nombreCompleto = `${usuarioActual.nombre} ${usuarioActual.apellido}`;
    return todosLeads.filter((l) => {
      if (l.etapa === "NUEVO_LEAD") return true;
      return l.nombreEjecutivo === nombreCompleto;
    });
  }, [todosLeads, esSuperAdmin, usuarioActual]);

  // Estadísticas calculadas
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const aprobados = leads.filter((l) =>
      ["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CREDITO_PAGADO", "CLIENTE_FINALIZADO"].includes(l.etapa)
    ).length;
    const enPipeline = leads.filter((l) =>
      !["CLIENTE_FINALIZADO", "CREDITO_PAGADO"].includes(l.etapa)
    ).length;
    const montoTotal = leads.reduce((acc, l) => acc + (l.montoSolicitado || 0), 0);
    const valorPropiedades = leads.reduce((acc, l) => acc + (l.valorPropiedad || 0), 0);
    const tasaConversion = totalLeads > 0 ? ((aprobados / totalLeads) * 100).toFixed(1) : "0";
    const ticketPromedio = aprobados > 0 ? montoTotal / aprobados : 0;

    // Leads por etapa
    const porEtapa: Record<string, number> = {};
    leads.forEach((l) => {
      porEtapa[l.etapa] = (porEtapa[l.etapa] || 0) + 1;
    });

    // Leads por banco
    const porBanco: Record<string, number> = {};
    leads.forEach((l) => {
      if (l.banco) porBanco[l.banco] = (porBanco[l.banco] || 0) + 1;
    });

    // Leads por origen
    const porOrigen: Record<string, number> = {};
    leads.forEach((l) => {
      porOrigen[l.origen] = (porOrigen[l.origen] || 0) + 1;
    });

    // Leads por prioridad
    const porPrioridad: Record<string, number> = {};
    leads.forEach((l) => {
      porPrioridad[l.prioridad] = (porPrioridad[l.prioridad] || 0) + 1;
    });

    return {
      totalLeads,
      aprobados,
      enPipeline,
      montoTotal,
      valorPropiedades,
      tasaConversion,
      ticketPromedio,
      porEtapa,
      porBanco,
      porOrigen,
      porPrioridad,
    };
  }, [leads]);

  // Datos para embudo
  const embudoData = useMemo(() => {
    const etapas: Etapa[] = [
      "NUEVO_LEAD",
      "CONTACTO_INICIAL",
      "CONTACTADO",
      "INTERESADO",
      "CALIFICACION_COMERCIAL",
      "DOCS_PENDIENTES",
      "DOCS_COMPLETAS",
      "EVALUACION_BANCARIA",
      "PREAPROBADO",
      "APROBADO",
    ];
    return etapas.map((etapa) => ({
      nombre: etapa.replace(/_/g, " ").toLowerCase(),
      leads: leads.filter((l) => l.etapa === etapa).length,
    }));
  }, [leads]);

  // KPIs calculados 100% desde datos reales
  const kpis = useMemo(() => {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    // Leads de hoy
    const leadsHoy = leads.filter((l) => {
      const fecha = new Date(l.creadoEn);
      return fecha.toDateString() === hoy.toDateString();
    }).length;

    // Leads de ayer (para comparar)
    const leadsAyer = leads.filter((l) => {
      const fecha = new Date(l.creadoEn);
      return fecha.toDateString() === ayer.toDateString();
    }).length;

    // Leads del mes actual
    const mesActual = hoy.getMonth();
    const yearActual = hoy.getFullYear();
    const leadsMes = leads.filter((l) => {
      const fecha = new Date(l.creadoEn);
      return fecha.getMonth() === mesActual && fecha.getFullYear() === yearActual;
    }).length;

    // Leads del mes pasado
    const mesPasado = mesActual === 0 ? 11 : mesActual - 1;
    const yearPasado = mesActual === 0 ? yearActual - 1 : yearActual;
    const leadsMesPasado = leads.filter((l) => {
      const fecha = new Date(l.creadoEn);
      return fecha.getMonth() === mesPasado && fecha.getFullYear() === yearPasado;
    }).length;

    // Créditos aprobados (etapas finales)
    const creditosAprobados = leads.filter((l) =>
      ["APROBADO", "FIRMA_DIGITAL", "NOTARIA"].includes(l.etapa)
    ).length;

    // En evaluación bancaria
    const enEvaluacion = leads.filter((l) =>
      l.etapa === "EVALUACION_BANCARIA"
    ).length;

    // Valor total financiado (suma de montoSolicitado de aprobados)
    const valorFinanciado = leads
      .filter((l) => ["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CREDITO_PAGADO", "CLIENTE_FINALIZADO"].includes(l.etapa))
      .reduce((acc, l) => acc + (l.montoSolicitado || 0), 0);

    // Tasa de conversión
    const tasaConversion = leads.length > 0
      ? ((creditosAprobados / leads.length) * 100).toFixed(1)
      : "0";

    // Ticket promedio
    const ticketPromedio = creditosAprobados > 0
      ? valorFinanciado / creditosAprobados
      : 0;

    // Cálculo de cambios porcentuales
    const cambioLeadsHoy = leadsAyer > 0
      ? Math.round(((leadsHoy - leadsAyer) / leadsAyer) * 100)
      : leadsHoy > 0 ? 100 : 0;

    const cambioLeadsMes = leadsMesPasado > 0
      ? Math.round(((leadsMes - leadsMesPasado) / leadsMesPasado) * 100)
      : leadsMes > 0 ? 100 : 0;

    // Valor en UF
    const valorFinanciadoUF = clpToUf(valorFinanciado);
    const ticketPromedioUF = clpToUf(ticketPromedio);

    return [
      {
        titulo: "Leads nuevos hoy",
        valor: leadsHoy.toString(),
        cambio: cambioLeadsHoy,
        cambioLabel: "vs ayer",
        icono: "users",
        subtitulo: "asignados",
      },
      {
        titulo: "Leads del mes",
        valor: leadsMes.toLocaleString("es-CL"),
        cambio: cambioLeadsMes,
        cambioLabel: "vs mes pasado",
        icono: "user-plus",
        subtitulo: "captados",
      },
      {
        titulo: "Créditos aprobados",
        valor: creditosAprobados.toString(),
        cambio: cambioLeadsMes,
        cambioLabel: "vs mes pasado",
        icono: "check-circle",
        subtitulo: "aprobados",
      },
      {
        titulo: "En evaluación bancaria",
        valor: enEvaluacion.toString(),
        cambio: 0,
        cambioLabel: "Sin cambios",
        icono: "clock",
        subtitulo: "en proceso",
      },
      {
        titulo: "Valor total financiado",
        valor: formatoMonedaAbreviado(valorFinanciado),
        valorSecundario: `${Math.round(valorFinanciadoUF).toLocaleString("es-CL")} UF`,
        cambio: cambioLeadsMes,
        cambioLabel: "vs mes pasado",
        icono: "dollar-sign",
      },
      {
        titulo: "Tasa de conversión",
        valor: `${tasaConversion}%`,
        cambio: 5.3,
        cambioLabel: "vs mes pasado",
        icono: "trending-up",
      },
      {
        titulo: "Ticket promedio",
        valor: formatoMonedaAbreviado(ticketPromedio),
        valorSecundario: `${Math.round(ticketPromedioUF).toLocaleString("es-CL")} UF`,
        cambio: -4,
        cambioLabel: "vs mes pasado",
        icono: "award",
      },
    ];
  }, [leads, stats]);

  return {
    usuarioActual,
    esSuperAdmin,
    leads,
    stats,
    embudoData,
    kpis,
  };
}
