"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { LEADS_POR_ORIGEN } from "@/datos/mock";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// Datos con tendencia simulada
const datosConTendencia = LEADS_POR_ORIGEN.map((item, i) => ({
  ...item,
  tendencia: i < 4 ? (i % 2 === 0 ? 12 : -5) : 0,
}));

export function LeadsPorOrigen() {
  const total = LEADS_POR_ORIGEN.reduce((acc, item) => acc + item.valor, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Leads por origen</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Distribución de fuentes</p>
        </div>
        <select className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10">
          <option>Este mes</option>
          <option>Último trimestre</option>
        </select>
      </div>

      {/* Gráfico y Total */}
      <div className="flex items-center justify-center mb-5">
        <div className="relative w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={LEADS_POR_ORIGEN}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                dataKey="valor"
                stroke="none"
                animationBegin={0}
                animationDuration={800}
              >
                {LEADS_POR_ORIGEN.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 12px -2px rgba(0,0,0,0.1)",
                  padding: "8px 12px",
                  backgroundColor: "white",
                }}
                formatter={(value, name, props) => [
                  `${value} leads (${((Number(value) / total) * 100).toFixed(1)}%)`,
                  props?.payload?.nombre || name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Centro del gráfico */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{total}</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Total</span>
          </div>
        </div>
      </div>

      {/* Leyenda con barras */}
      <div className="space-y-2.5">
        {datosConTendencia.map((item, i) => {
          const porcentaje = ((item.valor / total) * 100).toFixed(1);
          return (
            <div key={i} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">{item.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{item.valor}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 w-8 text-right">{porcentaje}%</span>
                  {item.tendencia > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-semibold">
                      <TrendingUp size={9} />
                      {item.tendencia}%
                    </span>
                  )}
                  {item.tendencia < 0 && (
                    <span className="flex items-center gap-0.5 text-[11px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md font-semibold">
                      <TrendingDown size={9} />
                      {Math.abs(item.tendencia)}%
                    </span>
                  )}
                </div>
              </div>
              {/* Barra de progreso */}
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden ml-5">
                <div 
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${porcentaje}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer con top 3 */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Top 3 fuentes</span>
          <div className="flex items-center gap-1">
            {datosConTendencia.slice(0, 3).map((item, i) => (
              <span 
                key={i}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                style={{ 
                  backgroundColor: `${item.color}15`,
                  color: item.color
                }}
              >
                {item.nombre.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}