"use client";

import { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Download, Calendar, Filter, TrendingUp, TrendingDown, Users, DollarSign, CheckCircle, Clock } from "lucide-react";
import type { Lead } from "@/tipos";

const COLORES_BANCOS: Record<string, string> = {
  "Banco de Chile": "#E31837",
  Santander: "#EC0000",
  Bci: "#003DA5",
  Itaú: "#F7941D",
  Scotiabank: "#EC111A",
  BancoEstado: "#00529B",
  "Banco Falabella": "#00A859",
  "Banco Ripley": "#E31837",
};

export default function ReportesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cargando, setCargando] = useState(true);
  const [periodo, setPeriodo] = useState("este-año");

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

  const metricas = useMemo(() => {
    const total = leads.length;
    const aprobados = leads.filter((l) => ["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CREDITO_PAGADO", "CLIENTE_FINALIZADO"].includes(l.etapa)).length;
    const tasaConversion = total > 0 ? ((aprobados / total) * 100).toFixed(1) : "0";
    const montoTotal = leads.reduce((acc, l) => acc + (l.montoSolicitado || 0), 0);
    const ticketPromedio = aprobados > 0 ? montoTotal / aprobados : 0;

    return { total, aprobados, tasaConversion, montoTotal, ticketPromedio };
  }, [leads]);

  const leadsPorMes = useMemo(() => {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const agrupado: Record<number, { leads: number; aprobados: number }> = {};

    leads.forEach((l) => {
      const mes = l.creadoEn.getMonth();
      if (!agrupado[mes]) agrupado[mes] = { leads: 0, aprobados: 0 };
      agrupado[mes].leads++;
      if (["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CREDITO_PAGADO", "CLIENTE_FINALIZADO"].includes(l.etapa)) {
        agrupado[mes].aprobados++;
      }
    });

    return meses.map((mes, i) => ({
      mes,
      leads: agrupado[i]?.leads || 0,
      aprobados: agrupado[i]?.aprobados || 0,
    }));
  }, [leads]);

  const conversionPorEtapa = useMemo(() => {
    const etapas = [
      { key: "NUEVO_LEAD", label: "Nuevo Lead" },
      { key: "CONTACTADO", label: "Contactado" },
      { key: "INTERESADO", label: "Interesado" },
      { key: "CALIFICACION_COMERCIAL", label: "Calificación" },
      { key: "DOCS_COMPLETAS", label: "Doc. Completa" },
      { key: "EVALUACION_BANCARIA", label: "Evaluación" },
      { key: "APROBADO", label: "Aprobado" },
    ];
    const total = leads.length || 1;

    return etapas.map((e) => ({
      etapa: e.label,
      cantidad: leads.filter((l) => l.etapa === e.key).length,
      tasa: Math.round((leads.filter((l) => l.etapa === e.key).length / total) * 100),
    }));
  }, [leads]);

  const distribucionBancos = useMemo(() => {
    const agrupado: Record<string, number> = {};
    leads.forEach((l) => {
      if (l.banco) {
        agrupado[l.banco] = (agrupado[l.banco] || 0) + 1;
      }
    });

    return Object.entries(agrupado)
      .map(([nombre, valor]) => ({
        nombre,
        valor,
        color: COLORES_BANCOS[nombre] || "#64748B",
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);
  }, [leads]);

  const rendimientoEjecutivos = useMemo(() => {
    const agrupado: Record<string, { aprobados: number; monto: number }> = {};
    leads.forEach((l) => {
      const nombre = l.nombreEjecutivo || "Sin asignar";
      if (!agrupado[nombre]) agrupado[nombre] = { aprobados: 0, monto: 0 };
      if (["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CREDITO_PAGADO", "CLIENTE_FINALIZADO"].includes(l.etapa)) {
        agrupado[nombre].aprobados++;
      }
      agrupado[nombre].monto += l.montoSolicitado || 0;
    });

    return Object.entries(agrupado)
      .map(([nombre, data]) => ({
        nombre: nombre.split(" ")[0] + " " + (nombre.split(" ")[1]?.[0] || ""),
        ...data,
      }))
      .sort((a, b) => b.aprobados - a.aprobados)
      .slice(0, 6);
  }, [leads]);

  const formatoMoneda = (valor: number) => {
    if (valor >= 1000000000) return `$${(valor / 1000000000).toFixed(1)} MM`;
    if (valor >= 1000000) return `$${(valor / 1000000).toFixed(1)} M`;
    return `$${valor.toLocaleString("es-CL")}`;
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-slate-500">Cargando reportes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Reportes</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Análisis y métricas del CRM basadas en datos reales</p>
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
          <button className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <Download size={14} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-blue-500" />
            <span className="text-[11px] text-slate-500 font-medium">Total Leads</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metricas.total.toLocaleString("es-CL")}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="text-[11px] text-slate-500 font-medium">Tasa Conversión</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metricas.tasaConversion}%</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-amber-500" />
            <span className="text-[11px] text-slate-500 font-medium">Monto Total</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatoMoneda(metricas.montoTotal)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-purple-500" />
            <span className="text-[11px] text-slate-500 font-medium">Ticket Promedio</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatoMoneda(metricas.ticketPromedio)}</div>
        </div>
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Leads por Mes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsPorMes} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 12px -2px rgba(0,0,0,0.08)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="leads" name="Leads" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="aprobados" name="Aprobados" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Tasa de Conversión por Etapa</h3>
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
                <XAxis dataKey="etapa" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 12px -2px rgba(0,0,0,0.08)",
                  }}
                />
                <Area type="monotone" dataKey="tasa" stroke="#3B82F6" strokeWidth={2.5} fill="url(#colorConversion)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Segunda Fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Distribución por Banco</h3>
          {distribucionBancos.length > 0 ? (
            <div className="h-64 flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucionBancos}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="valor"
                    >
                      {distribucionBancos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 12,
                        border: "1px solid #E2E8F0",
                      }}
                    />
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
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">
              Sin datos de bancos disponibles
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Rendimiento por Ejecutivo</h3>
          {rendimientoEjecutivos.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rendimientoEjecutivos} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="nombre" type="category" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 12,
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 4px 12px -2px rgba(0,0,0,0.08)",
                    }}
                    formatter={(value) => [`${value} aprobados`, "Aprobados"]}
                  />
                  <Bar dataKey="aprobados" fill="#3B82F6" radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">
              Sin datos de ejecutivos disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
