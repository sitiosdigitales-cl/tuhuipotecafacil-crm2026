"use client";

import { useState } from "react";
import { TrendingDown, ArrowRight, Info } from "lucide-react";

const etapas = [
  { label: "Nuevo Lead", valor: 1248, color: "#3B82F6", icono: "👤" },
  { label: "Contacto Inicial", valor: 912, color: "#6366F1", icono: "📞" },
  { label: "Contactado", valor: 842, color: "#8B5CF6", icono: "💬" },
  { label: "Interesado", valor: 512, color: "#A855F7", icono: "🎯" },
  { label: "Calificación", valor: 398, color: "#D946EF", icono: "📋" },
  { label: "Doc. Pendiente", valor: 278, color: "#F97316", icono: "📄" },
  { label: "Doc. Completa", valor: 184, color: "#22C55E", icono: "✅" },
  { label: "Evaluación", valor: 78, color: "#06B6D4", icono: "🏦" },
  { label: "Preaprobado", valor: 56, color: "#14B8A6", icono: "✓" },
  { label: "Aprobado", valor: 312, color: "#10B981", icono: "🎉" },
];

export function GraficoEmbudo() {
  const [etapaSeleccionada, setEtapaSeleccionada] = useState<number | null>(null);
  const maxValor = etapas[0].valor;

  const calcularConversion = (actual: number, siguiente: number) => {
    return ((siguiente / actual) * 100).toFixed(1);
  };

  const calcularConversionTotal = (etapa: number) => {
    return ((etapas[etapa].valor / maxValor) * 100).toFixed(1);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Embudo de conversión</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Flujo de leads por etapa</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-lg font-medium">Global</span>
          <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <Info size={14} className="text-slate-400 dark:text-slate-500" />
          </button>
        </div>
      </div>

      {/* Embudo Visual */}
      <div className="relative">
        {etapas.map((etapa, i) => {
          const ancho = (etapa.valor / maxValor) * 100;
          const siguienteValor = i < etapas.length - 1 ? etapas[i + 1].valor : null;
          const conversionEtapa = siguienteValor ? calcularConversion(etapa.valor, siguienteValor) : null;
          const conversionTotal = calcularConversionTotal(i);
          const isSelected = etapaSeleccionada === i;

          return (
            <div 
              key={i} 
              className="relative group"
              onMouseEnter={() => setEtapaSeleccionada(i)}
              onMouseLeave={() => setEtapaSeleccionada(null)}
            >
              {/* Línea de conexión y conversión */}
              {i > 0 && (
                <div className="flex items-center justify-center h-3 relative">
                  <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700 z-10">
                    <TrendingDown size={8} className="text-slate-400 dark:text-slate-500" />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      {conversionEtapa}%
                    </span>
                  </div>
                </div>
              )}

              {/* Barra del embudo */}
              <div className="flex items-center gap-2 px-2">
                {/* Valor */}
                <div className="w-14 text-right">
                  <span className={`text-[11px] font-bold transition-colors ${isSelected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                    {etapa.valor.toLocaleString("es-CL")}
                  </span>
                </div>

                {/* Barra */}
                <div className="flex-1 relative">
                  <div
                    className="h-7 rounded-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
                    style={{
                      width: `${Math.max(ancho, 8)}%`,
                      backgroundColor: etapa.color,
                      opacity: isSelected ? 1 : 0.85,
                      transform: isSelected ? 'scaleY(1.1)' : 'scaleY(1)',
                    }}
                  >
                    {/* Efecto de brillo */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Porcentaje dentro de la barra */}
                    {ancho > 25 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-white/90">
                        {conversionTotal}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Label */}
                <div className="w-24 flex items-center gap-1.5">
                  <span className="text-[11px]">{etapa.icono}</span>
                  <span className={`text-[10px] font-medium truncate transition-colors ${isSelected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                    {etapa.label}
                  </span>
                </div>
              </div>

              {/* Tooltip expandido */}
              {isSelected && (
                <div className="absolute left-20 -top-12 z-20 bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-[10px] animate-fade-in">
                  <div className="font-semibold">{etapa.label}</div>
                  <div className="text-slate-300 mt-0.5">
                    {etapa.valor.toLocaleString("es-CL")} leads • {conversionTotal}% del total
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumen */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Entrada</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">{etapas[0].valor.toLocaleString("es-CL")}</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500">leads</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Conversión</div>
            <div className="text-lg font-bold text-emerald-600 mt-0.5">
              {((etapas[etapas.length - 1].valor / etapas[0].valor) * 100).toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500">total</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Salida</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">{etapas[etapas.length - 1].valor.toLocaleString("es-CL")}</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500">aprobados</div>
          </div>
        </div>
      </div>
    </div>
  );
}