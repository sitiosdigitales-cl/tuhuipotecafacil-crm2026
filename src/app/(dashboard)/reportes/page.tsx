"use client";

import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart,
} from "recharts";
import {
  Download, Calendar, Filter, TrendingUp, TrendingDown, Users, DollarSign,
  CheckCircle, Clock, FileText, Target, Award, Building2, AlertTriangle,
} from "lucide-react";
import type { Lead } from "@/tipos";

const COLORES_BANCOS: Record<string, string> = {
  "Banco de Chile": "#E31837", Santander: "#EC0000", Bci: "#003DA5",
  Itaú: "#F7941D", Scotiabank: "#EC111A", BancoEstado: "#00529B",
  "Banco Falabella": "#00A859", "Banco Ripley": "#E31837",
};

const COLORES_ETAPAS: Record<string, string> = {
  NUEVO_LEAD: "#3B82F6", CONTACTO_INICIAL: "#6366F1", CONTACTADO: "#8B5CF6",
  INTERESADO: "#A855F7", CALIFICACION_COMERCIAL: "#D946EF", DOCS_PENDIENTES: "#F97316",
  DOCS_PARCIALES: "#FB923C", DOCS_COMPLETAS: "#22C55E", EVALUACION_BANCARIA: "#06B6D4",
  PREAPROBADO: "#14B8A6", APROBADO: "#10B981", FIRMA_DIGITAL: "#059669",
  NOTARIA: "#047857", CREDITO_PAGADO: "#065F46", CLIENTE_FINALIZADO: "#064E3B",
};

const ETAPAS_PIPELINE = [
  { key: "NUEVO_LEAD", label: "Nuevo Lead" },
  { key: "CONTACTO_INICIAL", label: "Contacto Inicial" },
  { key: "CONTACTADO", label: "Contactado" },
  { key: "INTERESADO", label: "Interesado" },
  { key: "CALIFICACION_COMERCIAL", label: "Calificación" },
  { key: "DOCS_PENDIENTES", label: "Doc. Pendiente" },
  { key: "DOCS_COMPLETAS", label: "Doc. Completa" },
  { key: "EVALUACION_BANCARIA", label: "Evaluación" },
  { key: "PREAPROBADO", label: "Preaprobado" },
  { key: "APROBADO", label: "Aprobado" },
];

type ReporteActivo = "general" | "pipeline" | "ejecutivos" | "bancos" | "origenes";

export default function ReportesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cargando, setCargando] = useState(true);
  const [periodo, setPeriodo] = useState("este-año");
  const [reporteActivo, setReporteActivo] = useState<ReporteActivo>("general");

  useEffect(() => {
    async function cargarLeads() {
      try {
        const res = await fetch("/api/leads");
        const json = await res.json();
        if (json.success && json.data) {
          setLeads(json.data.map((l: Record<string, any>) => ({
            ...l,
            creadoEn: l.creadoEn ? new Date(l.creadoEn) : new Date(),
            montoSolicitado: l.montoSolicitado || 0,
            valorPropiedad: l.valorPropiedad || 0,
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

  // Filtro por periodo
  const leadsFiltrados = useMemo(() => {
    const hoy = new Date();
    return leads.filter((l) => {
      const fecha = new Date(l.creadoEn);
      switch (periodo) {
        case "hoy":
          return fecha.toDateString() === hoy.toDateString();
        case "esta-semana": {
          const inicioSemana = new Date(hoy);
          inicioSemana.setDate(hoy.getDate() - hoy.getDay());
          inicioSemana.setHours(0, 0, 0, 0);
          return fecha >= inicioSemana;
        }
        case "este-mes":
          return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
        case "este-año":
          return fecha.getFullYear() === hoy.getFullYear();
        default:
          return true;
      }
    });
  }, [leads, periodo]);

  // Métricas generales
  const metricas = useMemo(() => {
    const total = leadsFiltrados.length;
    const aprobados = leadsFiltrados.filter((l) =>
      ["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CREDITO_PAGADO", "CLIENTE_FINALIZADO"].includes(l.etapa)
    ).length;
    const enPipeline = leadsFiltrados.filter((l) =>
      !["CLIENTE_FINALIZADO", "CREDITO_PAGADO"].includes(l.etapa)
    ).length;
    const montoTotal = leadsFiltrados.reduce((acc, l) => acc + (l.montoSolicitado || 0), 0);
    const valorPropiedades = leadsFiltrados.reduce((acc, l) => acc + (l.valorPropiedad || 0), 0);
    const tasaConversion = total > 0 ? ((aprobados / total) * 100).toFixed(1) : "0";
    const ticketPromedio = aprobados > 0 ? montoTotal / aprobados : 0;

    return { total, aprobados, enPipeline, montoTotal, valorPropiedades, tasaConversion, ticketPromedio };
  }, [leadsFiltrados]);

  // Leads por mes
  const leadsPorMes = useMemo(() => {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const agrupado: Record<number, { leads: number; aprobados: number; monto: number }> = {};
    leadsFiltrados.forEach((l) => {
      const mes = l.creadoEn.getMonth();
      if (!agrupado[mes]) agrupado[mes] = { leads: 0, aprobados: 0, monto: 0 };
      agrupado[mes].leads++;
      agrupado[mes].monto += l.montoSolicitado || 0;
      if (["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CREDITO_PAGADO", "CLIENTE_FINALIZADO"].includes(l.etapa)) {
        agrupado[mes].aprobados++;
      }
    });
    return meses.map((mes, i) => ({
      mes,
      leads: agrupado[i]?.leads || 0,
      aprobados: agrupado[i]?.aprobados || 0,
      monto: Math.round((agrupado[i]?.monto || 0) / 1000000),
    }));
  }, [leadsFiltrados]);

  // Conversión por etapa
  const conversionPorEtapa = useMemo(() => {
    const total = leadsFiltrados.length || 1;
    return ETAPAS_PIPELINE.map((e) => ({
      etapa: e.label,
      cantidad: leadsFiltrados.filter((l) => l.etapa === e.key).length,
      tasa: Math.round((leadsFiltrados.filter((l) => l.etapa === e.key).length / total) * 100),
      color: COLORES_ETAPAS[e.key] || "#64748B",
    }));
  }, [leadsFiltrados]);

  // Distribución por banco
  const distribucionBancos = useMemo(() => {
    const agrupado: Record<string, { cantidad: number; monto: number }> = {};
    leadsFiltrados.forEach((l) => {
      if (l.banco) {
        if (!agrupado[l.banco]) agrupado[l.banco] = { cantidad: 0, monto: 0 };
        agrupado[l.banco].cantidad++;
        agrupado[l.banco].monto += l.montoSolicitado || 0;
      }
    });
    return Object.entries(agrupado)
      .map(([nombre, data]) => ({
        nombre,
        valor: data.cantidad,
        monto: data.monto,
        color: COLORES_BANCOS[nombre] || "#64748B",
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  }, [leadsFiltrados]);

  // Rendimiento por ejecutivo
  const rendimientoEjecutivos = useMemo(() => {
    const agrupado: Record<string, { leads: number; aprobados: number; monto: number; conversion: number }> = {};
    leadsFiltrados.forEach((l) => {
      const nombre = l.nombreEjecutivo || "Sin asignar";
      if (!agrupado[nombre]) agrupado[nombre] = { leads: 0, aprobados: 0, monto: 0, conversion: 0 };
      agrupado[nombre].leads++;
      agrupado[nombre].monto += l.montoSolicitado || 0;
      if (["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CREDITO_PAGADO", "CLIENTE_FINALIZADO"].includes(l.etapa)) {
        agrupado[nombre].aprobados++;
      }
    });
    return Object.entries(agrupado)
      .filter(([n]) => n !== "Sin asignar")
      .map(([nombre, data]) => ({
        nombre: nombre.split(" ")[0] + " " + (nombre.split(" ")[1]?.[0] || ""),
        leads: data.leads,
        aprobados: data.aprobados,
        monto: data.monto,
        conversion: data.leads > 0 ? Math.round((data.aprobados / data.leads) * 100) : 0,
      }))
      .sort((a, b) => b.aprobados - a.aprobados);
  }, [leadsFiltrados]);

  // Leads por origen
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
    leadsFiltrados.forEach((l) => { agrupado[l.origen] = (agrupado[l.origen] || 0) + 1; });
    return Object.entries(agrupado)
      .map(([key, count]) => ({
        nombre: labels[key] || key,
        valor: count,
        porcentaje: Math.round((count / total) * 100),
        color: colores[key] || "#64748B",
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [leadsFiltrados]);

  // Distribución por prioridad
  const prioridadData = useMemo(() => {
    const colores: Record<string, string> = { URGENTE: "#EF4444", ALTA: "#F97316", MEDIA: "#3B82F6", BAJA: "#94A3B8" };
    const labels: Record<string, string> = { URGENTE: "Urgente", ALTA: "Alta", MEDIA: "Media", BAJA: "Baja" };
    const agrupado: Record<string, number> = {};
    leadsFiltrados.forEach((l) => { agrupado[l.prioridad] = (agrupado[l.prioridad] || 0) + 1; });
    return Object.entries(agrupado)
      .map(([key, valor]) => ({ nombre: labels[key] || key, valor, color: colores[key] || "#64748B" }))
      .sort((a, b) => b.valor - a.valor);
  }, [leadsFiltrados]);

  const formatoMoneda = (valor: number) => {
    if (valor >= 1000000000) return `$${(valor / 1000000000).toFixed(1)} MM`;
    if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)} M`;
    return `$${valor.toLocaleString("es-CL")}`;
  };

  const handleExportar = () => {
    const datos = {
      fecha: new Date().toLocaleDateString("es-CL"),
      periodo,
      metricas,
      leadsPorMes,
      conversionPorEtapa,
      distribucionBancos,
      rendimientoEjecutivos,
    };
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-crm-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-slate-500">Cargando reportes...</span>
      </div>
    );
  }

  const REPORTES: { id: ReporteActivo; label: string; icono: React.ReactNode }[] = [
    { id: "general", label: "General", icono: <Target size={14} /> },
    { id: "pipeline", label: "Pipeline", icono: <Filter size={14} /> },
    { id: "ejecutivos", label: "Ejecutivos", icono: <Users size={14} /> },
    { id: "bancos", label: "Bancos", icono: <Building2 size={14} /> },
    { id: "origenes", label: "Orígenes", icono: <TrendingUp size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Reportes</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {leadsFiltrados.length} leads en {periodo === "este-año" ? "este año" : periodo === "este-mes" ? "este mes" : periodo}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 font-medium"
          >
            <option value="hoy">Hoy</option>
            <option value="esta-semana">Esta semana</option>
            <option value="este-mes">Este mes</option>
            <option value="este-año">Este año</option>
          </select>
          <button
            onClick={handleExportar}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium"
          >
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

      {/* Tabs de reportes */}
      <div className="flex bg-white rounded-xl p-1 border border-slate-200/60 shadow-sm overflow-x-auto">
        {REPORTES.map((r) => (
          <button
            key={r.id}
            onClick={() => setReporteActivo(r.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
              reporteActivo === r.id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {r.icono}
            <span>{r.label}</span>
          </button>
        ))}
      </div>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-blue-500" />
            <span className="text-[11px] text-slate-500 font-medium">Total Leads</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metricas.total.toLocaleString("es-CL")}</div>
          <div className="text-[10px] text-slate-400 mt-1">{metricas.enPipeline} en pipeline</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="text-[11px] text-slate-500 font-medium">Tasa Conversión</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metricas.tasaConversion}%</div>
          <div className="text-[10px] text-slate-400 mt-1">{metricas.aprobados} aprobados</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-amber-500" />
            <span className="text-[11px] text-slate-500 font-medium">Monto Total</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatoMoneda(metricas.montoTotal)}</div>
          <div className="text-[10px] text-slate-400 mt-1">propiedades: {formatoMoneda(metricas.valorPropiedades)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-purple-500" />
            <span className="text-[11px] text-slate-500 font-medium">Ticket Promedio</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatoMoneda(metricas.ticketPromedio)}</div>
          <div className="text-[10px] text-slate-400 mt-1">por crédito aprobado</div>
        </div>
      </div>

      {/* Contenido según reporte activo */}
      {reporteActivo === "general" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leads por Mes */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Leads por Mes</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsPorMes} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px -2px rgba(0,0,0,0.08)" }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="leads" name="Leads" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="aprobados" name="Aprobados" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Conversión por Etapa */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Conversión por Etapa</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={conversionPorEtapa} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="etapa" tick={{ fontSize: 8, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #E2E8F0" }} />
                    <Area type="monotone" dataKey="tasa" stroke="#3B82F6" strokeWidth={2.5} fill="url(#colorConversion)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Distribución por Banco */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Distribución por Banco</h3>
              {distribucionBancos.length > 0 ? (
                <div className="h-64 flex items-center">
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={distribucionBancos} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="valor">
                          {distribucionBancos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #E2E8F0" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-2">
                    {distribucionBancos.map((banco, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: banco.color }} />
                          <span className="text-[11px] text-slate-600">{banco.nombre}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-800">{banco.valor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-sm text-slate-400">Sin datos</div>
              )}
            </div>

            {/* Distribución por Origen */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Leads por Origen</h3>
              {leadsPorOrigen.length > 0 ? (
                <div className="space-y-3">
                  {leadsPorOrigen.slice(0, 6).map((origen, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-slate-600">{origen.nombre}</span>
                        <span className="text-[11px] font-semibold text-slate-800">{origen.valor} ({origen.porcentaje}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${origen.porcentaje}%`, backgroundColor: origen.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-sm text-slate-400">Sin datos</div>
              )}
            </div>
          </div>
        </>
      )}

      {reporteActivo === "pipeline" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Pipeline por Etapa</h3>
          <div className="space-y-3">
            {conversionPorEtapa.map((etapa, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-32 text-[11px] text-slate-600 font-medium">{etapa.etapa}</div>
                <div className="flex-1">
                  <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all flex items-center px-2"
                      style={{ width: `${Math.max(etapa.tasa, 5)}%`, backgroundColor: etapa.color }}
                    >
                      <span className="text-[9px] text-white font-bold">{etapa.cantidad}</span>
                    </div>
                  </div>
                </div>
                <div className="w-12 text-right text-[11px] font-semibold text-slate-700">{etapa.tasa}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reporteActivo === "ejecutivos" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Rendimiento por Ejecutivo</h3>
          {rendimientoEjecutivos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Ejecutivo</th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Leads</th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Aprobados</th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Conversión</th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {rendimientoEjecutivos.map((ej, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white ${
                            i === 0 ? "bg-gradient-to-br from-amber-400 to-amber-500" :
                            i === 1 ? "bg-gradient-to-br from-slate-400 to-slate-500" :
                            i === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700" :
                            "bg-slate-200 text-slate-600"
                          }`}>{i + 1}</div>
                          <span className="text-xs font-semibold text-slate-700">{ej.nombre}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-xs text-slate-600">{ej.leads}</td>
                      <td className="text-right py-3 px-4 text-xs font-semibold text-emerald-600">{ej.aprobados}</td>
                      <td className="text-right py-3 px-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          ej.conversion >= 25 ? "bg-emerald-100 text-emerald-700" :
                          ej.conversion >= 15 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>{ej.conversion}%</span>
                      </td>
                      <td className="text-right py-3 px-4 text-xs font-semibold text-slate-700">{formatoMoneda(ej.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-slate-400">Sin datos de ejecutivos</div>
          )}
        </div>
      )}

      {reporteActivo === "bancos" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Detalle por Banco</h3>
          {distribucionBancos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Banco</th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Créditos</th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Monto Total</th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Ticket Prom.</th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold text-slate-400 uppercase">Participación</th>
                  </tr>
                </thead>
                <tbody>
                  {distribucionBancos.map((banco, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: banco.color }} />
                          <span className="text-xs font-semibold text-slate-700">{banco.nombre}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-xs text-slate-600">{banco.valor}</td>
                      <td className="text-right py-3 px-4 text-xs font-semibold text-slate-700">{formatoMoneda(banco.monto)}</td>
                      <td className="text-right py-3 px-4 text-xs text-slate-600">{formatoMoneda(banco.valor > 0 ? banco.monto / banco.valor : 0)}</td>
                      <td className="text-right py-3 px-4">
                        <span className="text-xs font-semibold text-slate-700">
                          {metricas.total > 0 ? Math.round((banco.valor / metricas.total) * 100) : 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-slate-400">Sin datos de bancos</div>
          )}
        </div>
      )}

      {reporteActivo === "origenes" && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Detalle por Origen</h3>
          {leadsPorOrigen.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leadsPorOrigen.map((origen, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: origen.color }} />
                    <span className="text-xs font-bold text-slate-700">{origen.nombre}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{origen.valor}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{origen.porcentaje}% del total</div>
                  <div className="h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${origen.porcentaje}%`, backgroundColor: origen.color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-slate-400">Sin datos de orígenes</div>
          )}
        </div>
      )}
    </div>
  );
}
