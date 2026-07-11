"use client";

import { useState, useMemo } from "react";
import { TrendingDown } from "lucide-react";
import { useLeads } from "@/lib/contexts/LeadContext";
import { ETAPAS_CONFIG } from "@/tipos";
import type { Etapa } from "@/tipos";

// Etapas del pipeline comercial
const ETAPAS_PIPELINE: Etapa[] = [
  "NUEVO_LEAD",
  "CONTACTADO",
  "INTERESADO",
  "DOCS_PENDIENTES",
  "DOCS_COMPLETAS",
  "EVALUACION_BANCARIA",
  "APROBADO",
  "CREDITO_PAGADO",
];

export function GraficoEmbudo() {
  const { leads } = useLeads();
  const [etapaSeleccionada, setEtapaSeleccionada] = useState<number | null>(null);

  const datos = useMemo(() => {
    return ETAPAS_PIPELINE.map((etapa) => ({
      key: etapa,
      label: ETAPAS_CONFIG[etapa]?.label || etapa,
      valor: leads.filter((l) => l.etapa === etapa).length,
      color: ETAPAS_CONFIG[etapa]?.color || "#6B7280",
    }));
  }, [leads]);

  const maxValor = Math.max(...datos.map((d) => d.valor), 1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80 dark:border-slate-700">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Embudo de conversión</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Flujo de leads por etapa del pipeline</p>
        </div>
        <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg font-medium">Global</span>
      </div>

      <div className="relative">
        {datos.map((etapa, i) => {
          const ancho = (etapa.valor / maxValor) * 100;
          const siguienteValor = i < datos.length - 1 ? datos[i + 1].valor : null;
          const conversionEtapa = siguienteValor && etapa.valor > 0 ? ((siguienteValor / etapa.valor) * 100).toFixed(1) : null;
          const conversionTotal = maxValor > 0 ? ((etapa.valor / maxValor) * 100).toFixed(1) : "0";
          const isSelected = etapaSeleccionada === i;

          return (
            <div key={i} className="relative group" onMouseEnter={() => setEtapaSeleccionada(i)} onMouseLeave={() => setEtapaSeleccionada(null)}>
              {i > 0 && (
                <div className="flex items-center justify-center h-3 relative">
                  <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700 z-10">
                    <TrendingDown size={8} className="text-slate-400" />
                    <span className="text-[10px] text-slate-500 font-semibold">{conversionEtapa}%</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 px-2">
                <div className="w-14 text-right">
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                    {etapa.valor}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="h-7 rounded-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
                    style={{ width: `${Math.max(ancho, 8)}%`, backgroundColor: etapa.color, opacity: isSelected ? 1 : 0.85 }}>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-white/90">
                      {conversionTotal}%
                    </span>
                  </div>
                </div>
                <div className="w-24">
                  <span className={`text-[10px] font-medium ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                    {etapa.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-[11px] text-slate-400 font-medium uppercase">Entrada</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{datos[0]?.valor || 0}</div>
            <div className="text-[11px] text-slate-400">leads</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-slate-400 font-medium uppercase">Conversión</div>
            <div className="text-lg font-bold text-emerald-600 mt-0.5">
              {datos[0]?.valor && datos[datos.length - 1]?.valor ? ((datos[datos.length - 1].valor / datos[0].valor) * 100).toFixed(1) : "0"}%
            </div>
            <div className="text-[11px] text-slate-400">total</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-slate-400 font-medium uppercase">Salida</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{datos[datos.length - 1]?.valor || 0}</div>
            <div className="text-[11px] text-slate-400">aprobados</div>
          </div>
        </div>
      </div>
    </div>
  );
}
