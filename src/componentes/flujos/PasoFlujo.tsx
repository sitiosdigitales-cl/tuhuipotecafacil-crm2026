"use client";

import { GripVertical, Trash2, Zap } from "lucide-react";
import { ACCIONES_TIPOS } from "@/modulos/automatizacion/config";

interface PasoFlujoProps {
  paso: any;
  index: number;
  onEliminar: (index: number) => void;
  onActualizar: (index: number, campo: string, valor: any) => void;
  isDragging?: boolean;
}

export function PasoFlujo({ paso, index, onEliminar, onActualizar, isDragging }: PasoFlujoProps) {
  const accionConfig = ACCIONES_TIPOS.find((a) => a.id === paso.tipo);

  return (
    <div
      className={`flex items-center gap-3 p-3 bg-slate-50 rounded-xl border transition-all ${
        isDragging ? "border-violet-300 shadow-md" : "border-slate-200/60"
      }`}
    >
      {/* Drag Handle */}
      <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
        <GripVertical size={16} />
      </div>

      {/* Numero */}
      <span className="text-[11px] font-bold text-slate-400 w-5">{index + 1}</span>

      {/* Icono de accion */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${accionConfig?.color || "#64748B"}15` }}
      >
        <Zap size={14} style={{ color: accionConfig?.color || "#64748B" }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-semibold text-slate-700 block">
          {accionConfig?.label || paso.tipo}
        </span>
        {paso.configuracion?.plantilla && (
          <span className="text-[10px] text-slate-400 block">
            Plantilla: {paso.configuracion.plantilla}
          </span>
        )}
      </div>

      {/* Delay */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          placeholder="0"
          value={paso.delay || ""}
          onChange={(e) => onActualizar(index, "delay", parseInt(e.target.value) || 0)}
          className="w-16 h-7 px-2 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600 text-center"
        />
        <span className="text-[9px] text-slate-400">min</span>
      </div>

      {/* Eliminar */}
      <button
        onClick={() => onEliminar(index)}
        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}