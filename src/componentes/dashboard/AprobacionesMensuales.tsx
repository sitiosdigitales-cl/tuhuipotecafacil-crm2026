"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { APROBACIONES_MENSUALES } from "@/datos/mock";
import { TrendingUp, TrendingDown, Target, Calendar, Award } from "lucide-react";
import { formatoMoneda } from "@/lib/utils";

const meta = 180;

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: { aprobados: number } }>; label?: string }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const vsMeta = data.aprobados - meta;
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={12} className="text-blue-500" />
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{label} 2026</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Aprobados</div>
            <div className="text-[14px] font-bold text-slate-900 dark:text-slate-100">{data.aprobados}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">vs Meta</div>
            <div className={`text-[14px] font-bold ${vsMeta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {vsMeta >= 0 ? '+' : ''}{vsMeta}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function AprobacionesMensuales() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const totalAnual = APROBACIONES_MENSUALES.reduce((acc, m) => acc + m.aprobados, 0);
  const promedio = Math.round(totalAnual / APROBACIONES_MENSUALES.length);
  const mesActual = APROBACIONES_MENSUALES[APROBACIONES_MENSUALES.length - 1].aprobados;
  const mesAnterior = APROBACIONES_MENSUALES[APROBACIONES_MENSUALES.length - 2].aprobados;
  const variacion = ((mesActual - mesAnterior) / mesAnterior * 100).toFixed(1);
  const mesesSuperioresMeta = APROBACIONES_MENSUALES.filter(m => m.aprobados >= meta).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Créditos aprobados</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Evolución mensual</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10">
            <option>2026</option>
            <option>2025</option>
          </select>
        </div>
      </div>

      {/* Estadísticas clave */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Award size={12} className="text-blue-500" />
            <span className="text-[11px] text-blue-600 font-medium">Mes Actual</span>
          </div>
          <div className="text-[18px] font-bold text-blue-700">{mesActual}</div>
          <div className={`flex items-center gap-1 mt-1 text-[11px] font-semibold ${
            Number(variacion) >= 0 ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {Number(variacion) >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Number(variacion) >= 0 ? '+' : ''}{variacion}% vs anterior
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Target size={12} className="text-emerald-500" />
            <span className="text-[11px] text-emerald-600 font-medium">Meta Mensual</span>
          </div>
          <div className="text-[18px] font-bold text-emerald-700">{meta}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {mesesSuperioresMeta}/{APROBACIONES_MENSUALES.length} meses cumplidos
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={APROBACIONES_MENSUALES} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAprobados" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={1}/>
                <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.8}/>
              </linearGradient>
              <linearGradient id="colorBelowMeta" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.6}/>
                <stop offset="100%" stopColor="#64748B" stopOpacity={0.4}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis 
              dataKey="mes" 
              tick={{ fontSize: 9, fill: "#94A3B8" }} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 9, fill: "#94A3B8" }} 
              tickLine={false} 
              axisLine={false}
              domain={[0, 220]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
            <ReferenceLine 
              y={meta} 
              stroke="#10B981" 
              strokeDasharray="5 5" 
              strokeWidth={1.5}
              label={{ 
                value: `Meta: ${meta}`, 
                position: 'right', 
                fontSize: 9, 
                fill: '#10B981',
                fontWeight: 600
              }}
            />
            <ReferenceLine 
              y={promedio} 
              stroke="#F59E0B" 
              strokeDasharray="3 3" 
              strokeWidth={1}
            />
            <Bar 
              dataKey="aprobados" 
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              onMouseEnter={(_, index) => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {APROBACIONES_MENSUALES.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.aprobados >= meta ? "url(#colorAprobados)" : "url(#colorBelowMeta)"}
                  opacity={hoveredBar === null || hoveredBar === index ? 1 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Leyenda */}
        <div className="absolute top-0 right-0 flex items-center gap-3 bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded-lg">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-[10px] text-slate-500 font-medium">Meta</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-[10px] text-slate-500 font-medium">Promedio</span>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Total Año</div>
            <div className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mt-0.5">{totalAnual.toLocaleString("es-CL")}</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Promedio</div>
            <div className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mt-0.5">{promedio}</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Récord</div>
            <div className="text-[13px] font-bold text-blue-600 mt-0.5">{Math.max(...APROBACIONES_MENSUALES.map(m => m.aprobados))}</div>
          </div>
        </div>
      </div>
    </div>
  );
}