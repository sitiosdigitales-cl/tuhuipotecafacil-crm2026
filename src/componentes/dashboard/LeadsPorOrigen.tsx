"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useLeads } from "@/lib/contexts/LeadContext";
import { TrendingUp, TrendingDown } from "lucide-react";

const COLORES: Record<string, string> = {
  WEB: "#3B82F6",
  FACEBOOK: "#1877F2",
  INSTAGRAM: "#E4405F",
  GOOGLE: "#EA4335",
  WHATSAPP: "#25D366",
  REFERIDO: "#8B5CF6",
  LINKEDIN: "#0A66C2",
  OTRO: "#6B7280",
};

export function LeadsPorOrigen() {
  const { leads } = useLeads();

  const datos = useMemo(() => {
    const porOrigen: Record<string, number> = {};
    leads.forEach((l) => {
      const origen = l.origen || "OTRO";
      porOrigen[origen] = (porOrigen[origen] || 0) + 1;
    });

    return Object.entries(porOrigen)
      .map(([nombre, valor]) => ({
        nombre,
        valor,
        color: COLORES[nombre] || COLORES.OTRO,
        tendencia: 0,
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [leads]);

  const total = leads.length;

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Leads por origen</h3>
        <p className="text-[11px] text-slate-400 text-center py-8">Sin datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Leads por origen</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Distribución de fuentes</p>
        </div>
      </div>

      <div className="flex items-center justify-center mb-5">
        <div className="relative w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={datos} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="valor" stroke="none">
                {datos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0", padding: "8px 12px", backgroundColor: "white" }}
                formatter={(value: any, name: any, props: any) => [`${value} leads (${((Number(value) / total) * 100).toFixed(1)}%)`, props?.payload?.nombre || name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-900">{total}</span>
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {datos.map((item, i) => {
          const porcentaje = ((item.valor / total) * 100).toFixed(1);
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] text-slate-700 font-medium">{item.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-800">{item.valor}</span>
                  <span className="text-[11px] text-slate-400 w-8 text-right">{porcentaje}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-5">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${porcentaje}%`, backgroundColor: item.color }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium">Top 3 fuentes</span>
          <div className="flex items-center gap-1">
            {datos.slice(0, 3).map((item, i) => (
              <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                {item.nombre.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
