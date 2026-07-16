"use client";

import { Zap, X } from "lucide-react";
import { ACCIONES_TIPOS } from "@/modulos/automatizacion/config";

interface SelectorAccionProps {
  onSeleccionar: (tipo: string) => void;
  onCerrar: () => void;
}

export function SelectorAccion({ onSeleccionar, onCerrar }: SelectorAccionProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Seleccionar accion</h3>
          <button onClick={onCerrar} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>
        <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
          {ACCIONES_TIPOS.map((accion) => (
            <button
              key={accion.id}
              onClick={() => { onSeleccionar(accion.id); onCerrar(); }}
              className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-violet-50 rounded-xl border border-slate-200 hover:border-violet-300 transition-all text-left"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${accion.color}15` }}
              >
                <Zap size={18} style={{ color: accion.color }} />
              </div>
              <div className="flex-1">
                <span className="text-[12px] font-semibold text-slate-700 block">{accion.label}</span>
                <span className="text-[10px] text-slate-400 block">{accion.descripcion}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}