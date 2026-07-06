"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Target, Zap, Award } from "lucide-react";

const datos = [
  { etapa: "Nuevo Lead", porcentaje: 100, leads: 1248, color: "#3B82F6" },
  { etapa: "Contacto", porcentaje: 73, leads: 912, color: "#6366F1" },
  { etapa: "Contactado", porcentaje: 67, leads: 842, color: "#8B5CF6" },
  { etapa: "Interesado", porcentaje: 41, leads: 512, color: "#A855F7" },
  { etapa: "Calificación", porcentaje: 32, leads: 398, color: "#D946EF" },
  { etapa: "Doc. Pend.", porcentaje: 22, leads: 278, color: "#F97316" },
  { etapa: "Doc. Comp.", porcentaje: 15, leads: 184, color: "#22C55E" },
  { etapa: "Evaluación", porcentaje: 9, leads: 78, color: "#06B6D4" },
  { etapa: "Preaprobado", porcentaje: 6, leads: 56, color: "#14B8A6" },
  { etapa: "Aprobado", porcentaje: 4, leads: 312, color: "#10B981" },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: { color: string; etapa: string; porcentaje: number; leads: number } }>; label?: string }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{data.etapa}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Conversión</div>
            <div className="text-[14px] font-bold text-slate-900 dark:text-slate-100">{data.porcentaje}%</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Leads</div>
            <div className="text-[14px] font-bold text-slate-900 dark:text-slate-100">{data.leads.toLocaleString("es-CL")}</div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function GraficoConversion() {
  const [puntoActivo, setPuntoActivo] = useState<number | null>(null);

  const promedioConversion = Math.round(datos.reduce((acc, d) => acc + d.porcentaje, 0) / datos.length);
  const dropoffMayor = datos.reduce((max, curr, i) => {
    if (i === 0) return max;
    const drop = datos[i - 1].porcentaje - curr.porcentaje;
    return drop > max.drop ? { drop, index: i } : max;
  }, { drop: 0, index: 0 });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80 dark:border-slate-700">
      {/* Header mejorado */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Conversión por etapa</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Tasa de avance del pipeline</p>
        </div>
        <select className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10">
          <option>Este mes</option>
          <option>Último trimestre</option>
          <option>Este año</option>
        </select>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Target size={12} className="text-blue-500" />
            <span className="text-[11px] text-blue-600 font-medium">Conversión Final</span>
          </div>
          <div className="text-[16px] font-bold text-blue-700">4%</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={12} className="text-emerald-500" />
            <span className="text-[11px] text-emerald-600 font-medium">Promedio</span>
          </div>
          <div className="text-[16px] font-bold text-emerald-700">{promedioConversion}%</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Award size={12} className="text-amber-500" />
            <span className="text-[11px] text-amber-600 font-medium">Mayor Drop-off</span>
          </div>
          <div className="text-[16px] font-bold text-amber-700">-{dropoffMayor.drop}%</div>
        </div>
      </div>

      {/* Gráfico mejorado */}
      <div className="h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis 
              dataKey="etapa" 
              tick={{ fontSize: 9, fill: "#94A3B8" }} 
              tickLine={false} 
              axisLine={false}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={50}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: "#94A3B8" }} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={promedioConversion} stroke="#10B981" strokeDasharray="5 5" strokeOpacity={0.5} />
            <Line
              type="monotone"
              dataKey="porcentaje"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ 
                fill: "#3B82F6", 
                strokeWidth: 3, 
                r: 5, 
                stroke: "#fff",
                className: "drop-shadow-sm"
              }}
              activeDot={{ 
                r: 8, 
                stroke: "#3B82F6", 
                strokeWidth: 3, 
                fill: "#fff",
                className: "drop-shadow-md"
              }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Línea de referencia */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-700">
          <div className="w-3 h-0.5 bg-emerald-500 rounded-full" />
          <span className="text-[11px] text-emerald-600 font-medium">Promedio {promedioConversion}%</span>
        </div>
      </div>

      {/* Etapas con mayor drop-off */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Puntos de mayor abandono</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-red-50 rounded-lg p-2 border border-red-100/50">
            <div className="flex items-center gap-1.5">
              <TrendingDown size={10} className="text-red-500" />
              <span className="text-[11px] text-red-600 font-medium">Interesado → Calificación</span>
            </div>
            <div className="text-[12px] font-bold text-red-700 mt-0.5">-9%</div>
          </div>
          <div className="flex-1 bg-amber-50 rounded-lg p-2 border border-amber-100/50">
            <div className="flex items-center gap-1.5">
              <TrendingDown size={10} className="text-amber-500" />
              <span className="text-[11px] text-amber-600 font-medium">Contacto → Contactado</span>
            </div>
            <div className="text-[12px] font-bold text-amber-700 mt-0.5">-6%</div>
          </div>
          <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={10} className="text-emerald-500" />
              <span className="text-[11px] text-emerald-600 font-medium">Doc. Comp. → Evaluación</span>
            </div>
            <div className="text-[12px] font-bold text-emerald-700 mt-0.5">-6%</div>
          </div>
        </div>
      </div>
    </div>
  );
}