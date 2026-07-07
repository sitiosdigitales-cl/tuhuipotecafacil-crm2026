"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Building2, TrendingUp, Award, Percent, BarChart3 } from "lucide-react";
import { RENDIMIENTO_BANCOS } from "@/datos/mock";
import { formatoMonedaAbreviado, formatoUF } from "@/lib/utils";

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

const bancosConMetricas = RENDIMIENTO_BANCOS.map((banco, i) => ({
  ...banco,
  creditos: Math.floor(seededRandom(i * 7 + 10) * 50) + 20,
  tasaAprobacion: Math.floor(seededRandom(i * 13 + 20) * 20) + 70,
  tendencia: i < 3 ? Math.floor(seededRandom(i * 17 + 30) * 15) + 5 : -Math.floor(seededRandom(i * 23 + 40) * 8),
}));

const totalMontos = bancosConMetricas.reduce((acc, b) => acc + b.montoTotal, 0);

export function RendimientoBancos() {
  const [bancoSeleccionado, setBancoSeleccionado] = useState<number | null>(null);
  const maxMonto = Math.max(...bancosConMetricas.map((b) => b.montoTotal));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Rendimiento por banco</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Distribución de créditos</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10">
            <option>Julio 2026</option>
            <option>Junio 2026</option>
          </select>
          <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <BarChart3 size={14} className="text-slate-400 dark:text-slate-500" />
          </button>
        </div>
      </div>

      {/* Banco líder destacado */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 mb-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-[14px] font-bold shadow-lg"
              style={{ backgroundColor: bancosConMetricas[0].color }}
            >
              {bancosConMetricas[0].nombre.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-0.5">Banco líder</div>
              <div className="text-[14px] font-bold">{bancosConMetricas[0].nombre}</div>
              <div className="text-[10px] text-slate-400">{bancosConMetricas[0].creditos} créditos</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[18px] font-bold">{formatoMonedaAbreviado(bancosConMetricas[0].montoTotal)}</div>
            <div className="text-[10px] text-slate-400">{formatoUF(bancosConMetricas[0].montoTotal)}</div>
            <div className="flex items-center justify-end gap-1 mt-1">
              <TrendingUp size={10} className="text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-semibold">+{bancosConMetricas[0].tendencia}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de bancos */}
      <div className="space-y-2">
        {bancosConMetricas.map((banco, i) => {
          const porcentaje = (banco.montoTotal / totalMontos) * 100;
          const isSelected = bancoSeleccionado === i;

          return (
            <div 
              key={i} 
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600' 
                  : 'hover:bg-slate-50/50 dark:hover:bg-slate-700/50 border border-transparent'
              }`}
              onClick={() => setBancoSeleccionado(isSelected ? null : i)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
                      style={{ backgroundColor: banco.color }}
                    >
                      {banco.nombre.substring(0, 2).toUpperCase()}
                    </div>
                    {i === 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                        <Award size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block">{banco.nombre}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">{banco.creditos} créditos</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 block">
                      {formatoMonedaAbreviado(banco.montoTotal)}
                    </span>
                    <span className="text-[11px] text-blue-600 font-medium">{formatoUF(banco.montoTotal)}</span>
                  </div>
                  <div className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                    banco.tendencia > 0 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {banco.tendencia > 0 ? '+' : ''}{banco.tendencia}%
                  </div>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${porcentaje}%`,
                      backgroundColor: banco.color,
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 w-10 text-right">
                  {porcentaje.toFixed(1)}%
                </span>
              </div>

              {/* Detalles expandidos */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tasa Aprobación</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Percent size={10} className="text-emerald-500" />
                      <span className="text-[12px] font-bold text-slate-900 dark:text-slate-100">{banco.tasaAprobacion}%</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ticket Promedio</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Building2 size={10} className="text-blue-500" />
                      <span className="text-[12px] font-bold text-slate-900 dark:text-slate-100">{formatoMonedaAbreviado(banco.montoTotal / banco.creditos)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumen */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Total financiado</span>
            <div className="text-[14px] font-bold text-slate-900 dark:text-slate-100">{formatoMonedaAbreviado(totalMontos)}</div>
          </div>
          <Link href="/bancos" className="flex items-center gap-1 py-2 px-3 text-[11px] text-blue-600 font-semibold hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors">
            Ver todos
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}