"use client";

import { useState } from "react";
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
import { Download, Calendar, Filter } from "lucide-react";

// Datos mock para reportes
const LEADS_POR_MES = [
  { mes: "Ene", leads: 120, aprobados: 45 },
  { mes: "Feb", leads: 135, aprobados: 52 },
  { mes: "Mar", leads: 155, aprobados: 61 },
  { mes: "Abr", leads: 142, aprobados: 48 },
  { mes: "May", leads: 168, aprobados: 65 },
  { mes: "Jun", leads: 180, aprobados: 72 },
  { mes: "Jul", leads: 165, aprobados: 58 },
  { mes: "Ago", leads: 148, aprobados: 50 },
  { mes: "Sep", leads: 190, aprobados: 78 },
  { mes: "Oct", leads: 200, aprobados: 82 },
  { mes: "Nov", leads: 195, aprobados: 75 },
  { mes: "Dic", leads: 175, aprobados: 68 },
];

const CONVERSION_POR_ETAPA = [
  { etapa: "Nuevo Lead", cantidad: 1248, tasa: 100 },
  { etapa: "Contacto", cantidad: 912, tasa: 73 },
  { etapa: "Interesado", cantidad: 512, tasa: 41 },
  { etapa: "Calificación", cantidad: 398, tasa: 32 },
  { etapa: "Doc. Completa", cantidad: 184, tasa: 15 },
  { etapa: "Evaluación", cantidad: 78, tasa: 6 },
  { etapa: "Aprobado", cantidad: 312, tasa: 25 },
];

const DISTRIBUCION_BANCOS = [
  { nombre: "Banco de Chile", valor: 325, color: "#E31837" },
  { nombre: "Santander", valor: 298, color: "#EC0000" },
  { nombre: "Bci", valor: 245, color: "#003DA5" },
  { nombre: "Itaú", valor: 210, color: "#F7941D" },
  { nombre: "Scotiabank", valor: 185, color: "#EC111A" },
  { nombre: "Otros", valor: 120, color: "#64748B" },
];

const RENDIMIENTO_EJECUTIVOS = [
  { nombre: "Andrés P.", aprobados: 38, monto: 2450 },
  { nombre: "Carolina M.", aprobados: 32, monto: 1980 },
  { nombre: "Diego S.", aprobados: 28, monto: 1620 },
  { nombre: "Valentina T.", aprobados: 24, monto: 1120 },
  { nombre: "Javier M.", aprobados: 21, monto: 980 },
];

const METRICAS_RESUMEN = [
  { titulo: "Total Leads", valor: "1.248", cambio: 18 },
  { titulo: "Tasa Conversión", valor: "24.6%", cambio: 5.3 },
  { titulo: "Ticket Promedio", valor: "$ 98.4 MM", cambio: -4 },
  { titulo: "Tiempo Promedio Venta", valor: "32 días", cambio: -8 },
];

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState("este-año");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Reportes</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Análisis y métricas del CRM</p>
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
      <div className="grid grid-cols-4 gap-4">
        {METRICAS_RESUMEN.map((metrica, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <div className="text-[11px] text-slate-500 font-medium mb-2">{metrica.titulo}</div>
            <div className="text-2xl font-bold text-slate-900">{metrica.valor}</div>
            <div className={`text-[11px] font-semibold mt-2 ${metrica.cambio >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {metrica.cambio >= 0 ? "+" : ""}{metrica.cambio}% vs período anterior
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-2 gap-6">
        {/* Leads por Mes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Leads por Mes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={LEADS_POR_MES} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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

        {/* Conversión por Etapa */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Tasa de Conversión por Etapa</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CONVERSION_POR_ETAPA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="etapa" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
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
      <div className="grid grid-cols-2 gap-6">
        {/* Distribución por Banco */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Distribución por Banco</h3>
          <div className="h-64 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={DISTRIBUCION_BANCOS}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="valor"
                  >
                    {DISTRIBUCION_BANCOS.map((entry, index) => (
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
              {DISTRIBUCION_BANCOS.map((banco, i) => (
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
        </div>

        {/* Rendimiento por Ejecutivo */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Rendimiento por Ejecutivo</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RENDIMIENTO_EJECUTIVOS} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
        </div>
      </div>
    </div>
  );
}