"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  Target,
  Award,
  Building2,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  Zap,
  Phone,
  Mail,
  MessageSquare,
  XCircle,
  AlertCircle,
  FileText,
  Home,
  ChevronRight,
  User,
  Star,
  Briefcase,
} from "lucide-react";
import {
  ETAPAS_CONFIG,
  ORIGEN_LABELS,
} from "@/datos/mock";
import { formatoMonedaAbreviado, formatoUF } from "@/lib/utils";
import { useUserData } from "@/lib/hooks/useUserData";
import type { Etapa, Lead } from "@/tipos";

// Colores para gráficos
const COLORES_CREDITO: Record<string, string> = {
  "Créditos Hipotecarios": "#3B82F6",
  "Créditos de Consumos": "#8B5CF6",
  "Fines Generales": "#F59E0B",
  "Capital para Empresas": "#10B981",
};

const METAS_MENSUALES = {
  leads: { meta: 50 },
  aprobados: { meta: 15 },
  monto: { meta: 5000 },
  conversion: { meta: 25 },
};

const PERIODOS = [
  { id: "mes", label: "Este Mes" },
  { id: "trimestre", label: "Trimestre" },
  { id: "año", label: "Año" },
];

export default function ResumenPage() {
  const [periodo, setPeriodo] = useState("mes");
  const [ejecutivoFiltro, setEjecutivoFiltro] = useState("todos");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cargando, setCargando] = useState(true);
  const { usuarioActual, esSuperAdmin } = useUserData();

  const exportarResumen = () => {
    const headers = ["Nombre", "Apellido", "RUT", "Email", "Etapa", "Origen", "Monto", "Banco", "Ejecutivo"];
    const rows = leads.map(l => [
      l.nombre, l.apellido, l.rut, l.email || "",
      ETAPAS_CONFIG[l.etapa]?.label || l.etapa,
      ORIGEN_LABELS[l.origen] || l.origen,
      l.montoSolicitado || 0, l.banco || "", l.nombreEjecutivo || ""
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumen-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    async function cargarLeads() {
      try {
        const res = await fetch("/api/leads");
        const json = await res.json();
        if (json.success && json.data) {
          setLeads(json.data.map((l: Record<string, any>) => ({
            ...l,
            creadoEn: l.creadoEn ? new Date(l.creadoEn) : new Date(),
          })));
        }
      } catch {
        setLeads([]);
      } finally {
        setCargando(false);
      }
    }
    cargarLeads();
  }, []);

  // Lista de ejecutivos únicos
  const ejecutivos = useMemo(() => {
    const nombres = [...new Set(leads.map((l) => l.nombreEjecutivo).filter(Boolean))];
    return nombres.sort() as string[];
  }, [leads]);

  // Leads filtrados por ejecutivo
  const leadsFiltrados = useMemo(() => {
    if (ejecutivoFiltro === "todos") return leads;
    return leads.filter((l) => l.nombreEjecutivo === ejecutivoFiltro);
  }, [leads, ejecutivoFiltro]);

  // Estadísticas del ejecutivo seleccionado
  const statsEjecutivo = useMemo(() => {
    if (ejecutivoFiltro === "todos") return null;
    const ejLeads = leads.filter((l) => l.nombreEjecutivo === ejecutivoFiltro);
    const aprobados = ejLeads.filter((l) => ["APROBADO", "FIRMA_DIGITAL", "NOTARIA"].includes(l.etapa));
    const noAprobados = ejLeads.filter((l) => !["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CLIENTE_FINALIZADO", "CREDITO_PAGADO"].includes(l.etapa));
    const finalizados = ejLeads.filter((l) => ["CLIENTE_FINALIZADO", "CREDITO_PAGADO"].includes(l.etapa));
    const montoAprobado = aprobados.reduce((acc, l) => acc + (l.montoSolicitado || 0), 0);
    const montoTotal = ejLeads.reduce((acc, l) => acc + (l.montoSolicitado || 0), 0);
    const tasaConversion = ejLeads.length > 0 ? ((aprobados.length / ejLeads.length) * 100).toFixed(1) : "0";
    const ticketPromedio = aprobados.length > 0 ? montoAprobado / aprobados.length : 0;

    // Leads por etapa
    const porEtapa: Record<string, number> = {};
    ejLeads.forEach((l) => {
      porEtapa[l.etapa] = (porEtapa[l.etapa] || 0) + 1;
    });

    // Leads por banco
    const porBanco: Record<string, number> = {};
    ejLeads.forEach((l) => {
      if (l.banco) porBanco[l.banco] = (porBanco[l.banco] || 0) + 1;
    });

    // Leads por origen
    const porOrigen: Record<string, number> = {};
    ejLeads.forEach((l) => {
      porOrigen[l.origen] = (porOrigen[l.origen] || 0) + 1;
    });

    // Leads por tipo crédito
    const porTipoCredito: Record<string, number> = {};
    ejLeads.forEach((l) => {
      if (l.tipoCredito) porTipoCredito[l.tipoCredito] = (porTipoCredito[l.tipoCredito] || 0) + 1;
    });

    return {
      total: ejLeads.length,
      aprobados: aprobados.length,
      noAprobados: noAprobados.length,
      finalizados: finalizados.length,
      enPipeline: noAprobados.length,
      montoTotal,
      montoAprobado,
      tasaConversion,
      ticketPromedio,
      porEtapa,
      porBanco,
      porOrigen,
      porTipoCredito,
    };
  }, [leads, ejecutivoFiltro]);

  // Calcular estadísticas reales (usando leadsFiltrados)
  const stats = useMemo(() => {
    const totalLeads = leadsFiltrados.length;
    const leadsActivos = leadsFiltrados.filter((l) =>
      !["CLIENTE_FINALIZADO", "CREDITO_PAGADO"].includes(l.etapa)
    ).length;
    const aprobados = leadsFiltrados.filter((l) =>
      ["APROBADO", "FIRMA_DIGITAL", "NOTARIA"].includes(l.etapa)
    ).length;
    const enPipeline = leadsFiltrados.filter((l) =>
      !["CLIENTE_FINALIZADO", "CREDITO_PAGADO", "APROBADO", "FIRMA_DIGITAL", "NOTARIA"].includes(l.etapa)
    ).length;
    const montoTotal = leadsFiltrados.reduce((acc, l) => acc + (l.montoSolicitado || 0), 0);
    const valorPropiedades = leadsFiltrados.reduce((acc, l) => acc + (l.valorPropiedad || 0), 0);
    const tasaConversion = totalLeads > 0 ? ((aprobados / totalLeads) * 100).toFixed(1) : "0";
    const ticketPromedio = aprobados > 0 ? montoTotal / aprobados : 0;

    return {
      totalLeads,
      leadsActivos,
      aprobados,
      enPipeline,
      montoTotal,
      valorPropiedades,
      tasaConversion,
      ticketPromedio,
    };
  }, [leadsFiltrados]);

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
      nombre: ETAPAS_CONFIG[etapa]?.label || etapa,
      leads: leadsFiltrados.filter((l) => l.etapa === etapa).length,
      color: ETAPAS_CONFIG[etapa]?.color || "#64748B",
    }));
  }, [leadsFiltrados]);

  // Datos para gráfico de aprobados vs no aprobados
  const datosAprobacion = useMemo(() => {
    if (ejecutivoFiltro === "todos") return null;
    const aprobados = leadsFiltrados.filter((l) => ["APROBADO", "FIRMA_DIGITAL", "NOTARIA"].includes(l.etapa)).length;
    const noAprobados = leadsFiltrados.filter((l) => !["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CLIENTE_FINALIZADO", "CREDITO_PAGADO"].includes(l.etapa)).length;
    const finalizados = leadsFiltrados.filter((l) => ["CLIENTE_FINALIZADO", "CREDITO_PAGADO"].includes(l.etapa)).length;
    return [
      { nombre: "Aprobados", valor: aprobados, color: "#10B981" },
      { nombre: "En Proceso", valor: noAprobados, color: "#3B82F6" },
      { nombre: "Finalizados", valor: finalizados, color: "#64748B" },
    ];
  }, [leadsFiltrados, ejecutivoFiltro]);

  // Datos por banco del ejecutivo
  const datosBanco = useMemo(() => {
    if (ejecutivoFiltro === "todos") return null;
    const porBanco: Record<string, { total: number; aprobados: number; monto: number }> = {};
    leadsFiltrados.forEach((l) => {
      const banco = l.banco || "Sin banco";
      if (!porBanco[banco]) porBanco[banco] = { total: 0, aprobados: 0, monto: 0 };
      porBanco[banco].total++;
      if (["APROBADO", "FIRMA_DIGITAL", "NOTARIA"].includes(l.etapa)) {
        porBanco[banco].aprobados++;
      }
      porBanco[banco].monto += l.montoSolicitado || 0;
    });
    return Object.entries(porBanco).map(([nombre, data]) => ({
      nombre,
      ...data,
      tasaAprobacion: data.total > 0 ? ((data.aprobados / data.total) * 100).toFixed(0) : "0",
    }));
  }, [leadsFiltrados, ejecutivoFiltro]);

  const rendimientoBancos = useMemo(() => {
    const colores = ["#E31837", "#EC0000", "#003DA5", "#F7941D", "#EC111A", "#00529B", "#00A859"];
    const agrupado: Record<string, { total: number; montoTotal: number }> = {};
    leadsFiltrados.forEach((l) => {
      const banco = l.banco || "Sin banco";
      if (!agrupado[banco]) agrupado[banco] = { total: 0, montoTotal: 0 };
      agrupado[banco].total++;
      agrupado[banco].montoTotal += l.montoSolicitado || 0;
    });
    return Object.entries(agrupado)
      .map(([nombre, data], i) => ({ nombre, ...data, color: colores[i % colores.length] }))
      .sort((a, b) => b.montoTotal - a.montoTotal)
      .slice(0, 6);
  }, [leadsFiltrados]);

  // Evolución mensual - datos reales
  const evolucionMensual = useMemo(() => {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const agrupado: Record<string, { leads: number; aprobados: number; monto: number }> = {};

    meses.forEach((m) => { agrupado[m] = { leads: 0, aprobados: 0, monto: 0 }; });

    leadsFiltrados.forEach((l) => {
      const fecha = l.creadoEn instanceof Date ? l.creadoEn : new Date(l.creadoEn);
      const mesIdx = fecha.getMonth();
      const mes = meses[mesIdx];
      agrupado[mes].leads++;
      agrupado[mes].monto += l.montoSolicitado || 0;
      if (["APROBADO", "FIRMA_DIGITAL", "NOTARIA"].includes(l.etapa)) {
        agrupado[mes].aprobados++;
      }
    });

    return meses.map((mes) => ({
      mes,
      leads: agrupado[mes].leads,
      aprobados: agrupado[mes].aprobados,
      monto: Math.round(agrupado[mes].monto / 1000000),
    }));
  }, [leadsFiltrados]);

  // Tipos de crédito - datos reales
  const tiposCreditoDonut = useMemo(() => {
    const agrupado: Record<string, number> = {};
    leadsFiltrados.forEach((l) => {
      const tipo = l.tipoCredito || "Sin especificar";
      agrupado[tipo] = (agrupado[tipo] || 0) + 1;
    });
    const total = leadsFiltrados.length || 1;
    return Object.entries(agrupado)
      .map(([nombre, count]) => ({
        nombre,
        valor: Math.round((count / total) * 100),
        color: COLORES_CREDITO[nombre] || "#64748B",
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [leadsFiltrados]);

  // Rendimiento del equipo - datos reales
  const rendimientoEquipo = useMemo(() => {
    const agrupado: Record<string, { leads: number; aprobados: number; monto: number }> = {};
    leadsFiltrados.forEach((l) => {
      const ej = l.nombreEjecutivo || "Sin asignar";
      if (!agrupado[ej]) agrupado[ej] = { leads: 0, aprobados: 0, monto: 0 };
      agrupado[ej].leads++;
      agrupado[ej].monto += l.montoSolicitado || 0;
      if (["APROBADO", "FIRMA_DIGITAL", "NOTARIA"].includes(l.etapa)) {
        agrupado[ej].aprobados++;
      }
    });
    return Object.entries(agrupado)
      .map(([nombre, data]) => ({
        nombre,
        leads: data.leads,
        conversion: data.leads > 0 ? Math.round((data.aprobados / data.leads) * 100) : 0,
        monto: data.monto,
      }))
      .sort((a, b) => b.monto - a.monto);
  }, [leadsFiltrados]);

  const leadsPorOrigen = useMemo(() => {
    const colores: Record<string, string> = {
      WEB: "#3B82F6", FACEBOOK: "#1877F2", INSTAGRAM: "#E4405F", GOOGLE: "#EA4335",
      TIKTOK: "#000000", LINKEDIN: "#0A66C2", WHATSAPP: "#25D366", REFERIDO: "#D4AF37", OTRO: "#64748B",
    };
    const labels: Record<string, string> = {
      WEB: "Sitio Web", FACEBOOK: "Facebook", INSTAGRAM: "Instagram", GOOGLE: "Google",
      TIKTOK: "TikTok", LINKEDIN: "LinkedIn", WHATSAPP: "WhatsApp", REFERIDO: "Referido", OTRO: "Otros",
    };
    const total = leadsFiltrados.length || 1;
    const agrupado: Record<string, number> = {};
    leadsFiltrados.forEach((l) => {
      agrupado[l.origen] = (agrupado[l.origen] || 0) + 1;
    });
    return Object.entries(agrupado)
      .map(([key, count]) => ({
        nombre: labels[key] || key,
        valor: Math.round((count / total) * 100),
        color: colores[key] || "#64748B",
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [leadsFiltrados]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-slate-500">Cargando resumen...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            {esSuperAdmin ? "Resumen Ejecutivo" : `Resumen de ${usuarioActual.nombre}`}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {esSuperAdmin
              ? ejecutivoFiltro === "todos"
                ? "Vista consolidada del rendimiento del negocio"
                : `Estadísticas de ${ejecutivoFiltro}`
              : `Tus estadísticas y rendimiento personal`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filtro Ejecutivo */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200/60 rounded-xl">
            <User size={14} className="text-slate-400" />
            <select
              value={ejecutivoFiltro}
              onChange={(e) => setEjecutivoFiltro(e.target.value)}
              className="text-[11px] font-semibold text-slate-700 bg-transparent border-none focus:outline-none focus:ring-0 pr-6"
            >
              <option value="todos">Todos los ejecutivos</option>
              {ejecutivos.map((ej) => (
                <option key={ej} value={ej}>{ej}</option>
              ))}
            </select>
          </div>
          <div className="flex bg-slate-100 rounded-xl p-0.5">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodo(p.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  periodo === p.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={exportarResumen} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalLeads.toLocaleString("es-CL")}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Total Leads</div>
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((stats.totalLeads / METAS_MENSUALES.leads.meta) * 100, 100)}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100/80 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.aprobados}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Créditos Aprobados</div>
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((stats.aprobados / METAS_MENSUALES.aprobados.meta) * 100, 100)}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100/80 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign size={18} className="text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatoMonedaAbreviado(stats.montoTotal)}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Monto Total Financiado</div>
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min((stats.montoTotal / (METAS_MENSUALES.monto.meta * 1000000)) * 100, 100)}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100/80 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Target size={18} className="text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.tasaConversion}%</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Tasa de Conversión</div>
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min((parseFloat(stats.tasaConversion) / METAS_MENSUALES.conversion.meta) * 100, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Sección de Estadísticas del Ejecutivo */}
      {ejecutivoFiltro !== "todos" && statsEjecutivo && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold">{ejecutivoFiltro}</h3>
              <p className="text-[10px] text-blue-200">Resumen individual de rendimiento</p>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-3">
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-[9px] text-blue-200 uppercase font-medium">Total Leads</div>
              <div className="text-xl font-bold">{statsEjecutivo.total}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-[9px] text-emerald-200 uppercase font-medium">Aprobados</div>
              <div className="text-xl font-bold text-emerald-300">{statsEjecutivo.aprobados}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-[9px] text-amber-200 uppercase font-medium">En Proceso</div>
              <div className="text-xl font-bold text-amber-300">{statsEjecutivo.enPipeline}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-[9px] text-purple-200 uppercase font-medium">Monto Total</div>
              <div className="text-xl font-bold">{formatoMonedaAbreviado(statsEjecutivo.montoTotal)}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-[9px] text-blue-200 uppercase font-medium">Conversión</div>
              <div className="text-xl font-bold">{statsEjecutivo.tasaConversion}%</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-[9px] text-emerald-200 uppercase font-medium">Ticket Promedio</div>
              <div className="text-xl font-bold">{formatoMonedaAbreviado(statsEjecutivo.ticketPromedio)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos del Ejecutivo (cuando está seleccionado) */}
      {ejecutivoFiltro !== "todos" && datosAprobacion && (
        <div className="grid grid-cols-3 gap-5">
          {/* Aprobados vs No Aprobados */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Distribución de Estados</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={datosAprobacion}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="valor"
                >
                  {datosAprobacion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {datosAprobacion.map((item) => (
                <div key={item.nombre} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] text-slate-600">{item.nombre}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-800">{item.valor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rendimiento por Banco */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Rendimiento por Banco</h3>
            <div className="space-y-3">
              {datosBanco?.slice(0, 5).map((banco) => (
                <div key={banco.nombre} className="p-2.5 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-slate-800">{banco.nombre}</span>
                    <span className="text-[9px] text-slate-400">{banco.total} leads</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <CheckCircle size={10} className="text-emerald-500" />
                        <span className="text-[9px] text-emerald-600 font-medium">{banco.aprobados} aprobados</span>
                      </div>
                      <span className="text-[9px] text-slate-300">•</span>
                      <span className="text-[9px] text-slate-500">{banco.tasaAprobacion}%</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-700">{formatoMonedaAbreviado(banco.monto)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leads por Origen del Ejecutivo */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Leads por Origen</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statsEjecutivo ? Object.entries(statsEjecutivo.porOrigen).map(([nombre, valor]) => ({ nombre, valor })) : []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="nombre" tick={{ fontSize: 9, fill: "#94A3B8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "11px" }} />
                <Bar dataKey="valor" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Fila de gráficos principales */}
      <div className="grid grid-cols-3 gap-5">
        {/* Evolución Mensual */}
        <div className="col-span-2 bg-white rounded-2xl p-5 border border-slate-100/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Evolución Mensual</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Leads vs Aprobados (miles)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[9px] text-slate-500">Leads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] text-slate-500">Aprobados</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={evolucionMensual}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAprobados" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "11px" }}
                formatter={(value) => [`${value}%`, "Participación"]}
              />
              <Area
                type="monotone"
                dataKey="leads"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLeads)"
              />
              <Area
                type="monotone"
                dataKey="aprobados"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAprobados)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Tipos de Crédito */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Tipos de Crédito</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={tiposCreditoDonut}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="valor"
              >
                {tiposCreditoDonut.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "11px" }}
                formatter={(value) => [`${value}%`, "Participación"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {tiposCreditoDonut.map((item) => (
              <div key={item.nombre} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-slate-600">{item.nombre}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-800">{item.valor}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fila: Embudo + Rendimiento Equipo */}
      <div className="grid grid-cols-2 gap-5">
        {/* Embudo de Conversión */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Embudo de Conversión</h3>
          <div className="space-y-2">
            {embudoData.slice(0, 8).map((etapa, i) => {
              const maxLeads = embudoData[0].leads || 1;
              const porcentaje = (etapa.leads / maxLeads) * 100;
              return (
                <div key={etapa.nombre} className="flex items-center gap-3">
                  <div className="w-24 text-[9px] text-slate-500 font-medium truncate">{etapa.nombre}</div>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${porcentaje}%`, backgroundColor: etapa.color }}
                    />
                  </div>
                  <div className="w-12 text-right">
                    <span className="text-[10px] font-bold text-slate-700">{etapa.leads}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rendimiento del Equipo */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Rendimiento del Equipo</h3>
            <Award size={16} className="text-amber-500" />
          </div>
          <div className="space-y-3">
            {rendimientoEquipo.map((ejecutivo, i) => (
              <div key={ejecutivo.nombre} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white ${
                  i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-amber-700" : "bg-blue-500"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-slate-800 truncate">{ejecutivo.nombre}</div>
                  <div className="text-[9px] text-slate-400">{ejecutivo.leads} leads • {ejecutivo.conversion}% conversión</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-800">{formatoMonedaAbreviado(ejecutivo.monto)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fila: Bancos + Leads por Origen */}
      <div className="grid grid-cols-2 gap-5">
        {/* Rendimiento por Banco */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Rendimiento por Banco</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={rendimientoBancos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v) => formatoMonedaAbreviado(v)} />
              <YAxis dataKey="nombre" type="category" tick={{ fontSize: 10, fill: "#94A3B8" }} width={80} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "11px" }}
                formatter={(value) => [formatoMonedaAbreviado(Number(value)), "Monto"]}
              />
              <Bar dataKey="montoTotal" radius={[0, 6, 6, 0]}>
                {rendimientoBancos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leads por Origen */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Leads por Origen</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={leadsPorOrigen}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="nombre" tick={{ fontSize: 9, fill: "#94A3B8" }} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "11px" }}
                formatter={(value) => [`${value}%`, "Participación"]}
              />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                {leadsPorOrigen.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metas del Mes */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Metas del Mes</h3>
          <Calendar size={16} className="text-slate-400" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { key: "leads", label: "Leads Generados", actual: stats.totalLeads, meta: METAS_MENSUALES.leads.meta, color: "bg-blue-500" },
            { key: "aprobados", label: "Créditos Aprobados", actual: stats.aprobados, meta: METAS_MENSUALES.aprobados.meta, color: "bg-emerald-500" },
            { key: "monto", label: "Monto Financiado (MM)", actual: Math.round(stats.montoTotal / 1000000), meta: METAS_MENSUALES.monto.meta, color: "bg-purple-500" },
            { key: "conversion", label: "Tasa de Conversión (%)", actual: parseFloat(stats.tasaConversion), meta: METAS_MENSUALES.conversion.meta, color: "bg-amber-500" },
          ].map((item) => {
            const porcentaje = Math.min((item.actual / item.meta) * 100, 100);
            return (
              <div key={item.key} className="p-3 bg-slate-50 rounded-xl">
                <div className="text-[9px] text-slate-400 uppercase font-medium mb-2">{item.label}</div>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-lg font-bold text-slate-900">
                    {item.key === "monto" ? `$${item.actual}` : item.key === "conversion" ? `${item.actual}%` : item.actual}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    de {item.key === "monto" ? `$${item.meta}` : item.key === "conversion" ? `${item.meta}%` : item.meta}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
                <div className="text-[9px] text-slate-500 mt-1 text-right">{porcentaje.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
