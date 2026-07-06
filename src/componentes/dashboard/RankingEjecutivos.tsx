"use client";

import { useState } from "react";
import { ChevronRight, TrendingUp, Trophy, Medal, Target, Users, DollarSign, ArrowUpRight, Crown } from "lucide-react";
import { RANKING_EJECUTIVOS } from "@/datos/mock";
import { formatoMonedaAbreviado, formatoUF } from "@/lib/utils";

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

const ejecutivosConMetricas = RANKING_EJECUTIVOS.map((ej, i) => ({
  ...ej,
  conversion: Math.floor(seededRandom(i * 7 + 1) * 15) + 15,
  ticketPromedio: Math.floor(ej.montoTotal / ej.aprobados),
  tendencia: i < 3 ? Math.floor(seededRandom(i * 13 + 2) * 20) + 5 : -Math.floor(seededRandom(i * 17 + 3) * 10),
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${ej.nombre}`,
}));

const podiumConfig = [
  { bg: "from-amber-400 to-amber-500", border: "border-amber-300", icon: <Crown size={16} />, height: "h-20" },
  { bg: "from-slate-300 to-slate-400", border: "border-slate-300", icon: <Medal size={14} />, height: "h-16" },
  { bg: "from-amber-600 to-amber-700", border: "border-amber-500", icon: <Medal size={14} />, height: "h-14" },
];

export function RankingEjecutivos() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const montoMaximo = Math.max(...ejecutivosConMetricas.map(e => e.montoTotal));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Rendimiento por ejecutivo</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Top performers del mes</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10">
            <option>Julio 2026</option>
            <option>Junio 2026</option>
          </select>
          <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <Trophy size={14} className="text-amber-500" />
          </button>
        </div>
      </div>

      {/* Podio visual - Top 3 */}
      <div className="flex items-end justify-center gap-3 mb-5 px-4">
        {/* Segundo lugar */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center text-slate-600 text-[14px] font-bold shadow-md border-2 border-slate-200">
              {ejecutivosConMetricas[1]?.nombre.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center text-[11px] font-bold text-white border-2 border-white shadow-sm">
              2
            </div>
          </div>
          <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">{ejecutivosConMetricas[1]?.nombre.split(" ")[0]}</div>
          <div className={`w-full ${podiumConfig[1].height} bg-gradient-to-t ${podiumConfig[1].bg} rounded-t-xl flex items-center justify-center`}>
            <Medal size={16} className="text-white/80" />
          </div>
        </div>

        {/* Primer lugar */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Crown size={20} className="text-amber-400 drop-shadow-md" />
            </div>
            <div className="w-18 h-18 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center text-white text-[16px] font-bold shadow-lg border-2 border-amber-300 scale-110">
              {ejecutivosConMetricas[0]?.nombre.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-md">
              1
            </div>
          </div>
          <div className="text-[11px] font-bold text-amber-700 mb-1">{ejecutivosConMetricas[0]?.nombre.split(" ")[0]}</div>
          <div className={`w-full ${podiumConfig[0].height} bg-gradient-to-t ${podiumConfig[0].bg} rounded-t-xl flex items-center justify-center`}>
            <Trophy size={20} className="text-white/90" />
          </div>
        </div>

        {/* Tercer lugar */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl flex items-center justify-center text-white text-[14px] font-bold shadow-md border-2 border-amber-500">
              {ejecutivosConMetricas[2]?.nombre.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center text-[11px] font-bold text-white border-2 border-white shadow-sm">
              3
            </div>
          </div>
          <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">{ejecutivosConMetricas[2]?.nombre.split(" ")[0]}</div>
          <div className={`w-full ${podiumConfig[2].height} bg-gradient-to-t ${podiumConfig[2].bg} rounded-t-xl flex items-center justify-center`}>
            <Medal size={16} className="text-white/80" />
          </div>
        </div>
      </div>

      {/* Lista detallada */}
      <div className="space-y-1.5">
        {ejecutivosConMetricas.map((ejecutivo, i) => (
          <div 
            key={i} 
            className="relative flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-all cursor-pointer group"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Ranking number */}
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
              i === 0 ? 'bg-amber-100 text-amber-700' :
              i === 1 ? 'bg-slate-100 text-slate-600' :
              i === 2 ? 'bg-amber-50 text-amber-600' :
              'bg-slate-50 text-slate-400'
            }`}>
              {i + 1}
            </div>

            {/* Avatar */}
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shadow-sm transition-transform group-hover:scale-105 ${
                i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500' :
                i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                'bg-gradient-to-br from-blue-400 to-blue-600'
              }`}>
                {ejecutivo.nombre.split(" ").map((n) => n[0]).join("")}
              </div>
              {ejecutivo.tendencia > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                  <ArrowUpRight size={10} className="text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">{ejecutivo.nombre}</span>
                {i < 3 && (
                  <span className="text-[10px] bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md font-semibold">
                    TOP {i + 1}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Target size={9} className="text-emerald-500" />
                  {ejecutivo.aprobados} aprobados
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Users size={9} className="text-blue-500" />
                  {ejecutivo.conversion}% conv.
                </span>
              </div>
            </div>

            {/* Montos */}
            <div className="text-right">
              <div className="text-[12px] font-bold text-slate-900 dark:text-slate-100">
                {formatoMonedaAbreviado(ejecutivo.montoTotal)}
              </div>
              <div className="text-[11px] text-blue-600 font-medium">{formatoUF(ejecutivo.montoTotal)}</div>
            </div>

            {/* Barra de progreso */}
            <div className="absolute bottom-0 left-14 right-4 h-0.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${(ejecutivo.montoTotal / montoMaximo) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Top Performer</div>
            <div className="text-[12px] font-bold text-amber-600 mt-0.5">{ejecutivosConMetricas[0]?.nombre.split(" ")[0]}</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Total Equipo</div>
            <div className="text-[12px] font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {formatoMonedaAbreviado(ejecutivosConMetricas.reduce((acc, e) => acc + e.montoTotal, 0))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Promedio</div>
            <div className="text-[12px] font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {formatoMonedaAbreviado(ejecutivosConMetricas.reduce((acc, e) => acc + e.montoTotal, 0) / ejecutivosConMetricas.length)}
            </div>
          </div>
        </div>
      </div>

      {/* Botón ver más */}
      <button className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 text-[11px] text-blue-600 font-semibold hover:text-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 rounded-xl transition-colors">
        Ver ranking completo
        <ChevronRight size={14} />
      </button>
    </div>
  );
}