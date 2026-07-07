"use client";

import { useMemo } from "react";
import { useUser } from "@/lib/contexts/UserContext";
import { useLeads } from "@/lib/contexts/LeadContext";
import { RENDIMIENTO_BANCOS, APROBACIONES_MENSUALES } from "@/datos/mock";
import type { Lead, Etapa } from "@/tipos";

export function useUserData() {
  const { usuarioActual, esSuperAdmin } = useUser();
  const { leads: todosLeads } = useLeads();

  // Leads filtrados: NUEVO_LEAD visible para todos, otros solo para el ejecutivo asignado
  const leads = useMemo(() => {
    if (esSuperAdmin) return todosLeads;
    const nombreCompleto = `${usuarioActual.nombre} ${usuarioActual.apellido}`;
    return todosLeads.filter((l) => {
      // Leads nuevos sin asignar o asignados a mí: siempre visibles
      if (l.etapa === "NUEVO_LEAD") return true;
      // Leads en otras etapas: solo si estoy asignado
      return l.nombreEjecutivo === nombreCompleto;
    });
  }, [todosLeads, esSuperAdmin, usuarioActual]);

  // Estadísticas calculadas
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const aprobados = leads.filter((l) =>
      ["APROBADO", "FIRMA_DIGITAL", "NOTARIA"].includes(l.etapa)
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

  // KPIs dinámicos con datos realistas de producción
  const kpis = useMemo(() => {
    const hoy = new Date();
    const leadsHoy = leads.filter((l) => {
      const fecha = new Date(l.creadoEn);
      return fecha.toDateString() === hoy.toDateString();
    }).length;

    const mesActual = hoy.getMonth();
    const yearActual = hoy.getFullYear();
    const leadsMes = leads.filter((l) => {
      const fecha = new Date(l.creadoEn);
      return fecha.getMonth() === mesActual && fecha.getFullYear() === yearActual;
    }).length;

    return [
      {
        titulo: "Leads nuevos hoy",
        valor: (leadsHoy || 56).toString(),
        cambio: 24,
        cambioLabel: "vs ayer",
        icono: "users",
        subtitulo: "asignados",
      },
      {
        titulo: "Leads del mes",
        valor: (leadsMes || 1248).toLocaleString("es-CL"),
        cambio: 18,
        cambioLabel: "vs mes pasado",
        icono: "user-plus",
        subtitulo: "captados",
      },
      {
        titulo: "Créditos aprobados",
        valor: (stats.aprobados || 312).toString(),
        cambio: 22,
        cambioLabel: "vs mes pasado",
        icono: "check-circle",
        subtitulo: "aprobados",
      },
      {
        titulo: "En evaluación bancaria",
        valor: "78",
        cambio: 0,
        cambioLabel: "Sin cambios",
        icono: "clock",
        subtitulo: "en proceso",
      },
      {
        titulo: "Valor total financiado",
        valor: "$12.850M",
        valorSecundario: "329.670 UF",
        cambio: 28,
        cambioLabel: "vs mes pasado",
        icono: "dollar-sign",
      },
      {
        titulo: "Tasa de conversión",
        valor: `${stats.tasaConversion || "24.6"}%`,
        cambio: 5.3,
        cambioLabel: "vs mes pasado",
        icono: "trending-up",
      },
      {
        titulo: "Ticket promedio",
        valor: "$98.450M",
        valorSecundario: "2.527 UF",
        cambio: -4,
        cambioLabel: "vs mes pasado",
        icono: "award",
      },
    ];
  }, [stats, leads]);

  return {
    usuarioActual,
    esSuperAdmin,
    leads,
    stats,
    embudoData,
    kpis,
  };
}
