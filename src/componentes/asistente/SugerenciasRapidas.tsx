"use client";

import { SUGERENCIAS_IA } from "@/tipos/asistente";

interface SugerenciasRapidasProps {
  onSelect: (prompt: string) => void;
}

export function SugerenciasRapidas({ onSelect }: SugerenciasRapidasProps) {
  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-md">
      {SUGERENCIAS_IA.map((sugerencia) => (
        <button
          key={sugerencia.id}
          onClick={() => onSelect(sugerencia.prompt)}
          className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all text-left group"
        >
          <span className="text-xl flex-shrink-0">{sugerencia.icono}</span>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {sugerencia.titulo}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {sugerencia.descripcion}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
