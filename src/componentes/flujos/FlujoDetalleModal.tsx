"use client";

import { useState, useEffect } from "react";
import { Zap, X, ArrowRight } from "lucide-react";
import { TRIGGERS_TIPOS, TRIGGER_CATEGORIAS, ACCIONES_TIPOS } from "@/modulos/automatizacion/config";
import { FlujoHistorial } from "./FlujoHistorial";

interface FlujoDetalleModalProps {
  flujoId: string;
  onCerrar: () => void;
  onEditar: (flujo: any) => void;
}

export function FlujoDetalleModal({ flujoId, onCerrar, onEditar }: FlujoDetalleModalProps) {
  const [flujo, setFlujo] = useState<any>(null);
  const [tabActiva, setTabActiva] = useState<"general" | "historial">("general");

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/flujos");
        const json = await res.json();
        if (json.success) {
          const found = json.data.find((f: any) => f.id === flujoId);
          setFlujo(found);
        }
      } catch {}
    }
    cargar();
  }, [flujoId]);

  if (!flujo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  const triggerConfig = TRIGGERS_TIPOS.find((t) => t.id === flujo.trigger);
  const categoria = TRIGGER_CATEGORIAS.find((c) => c.id === (flujo.categoria || triggerConfig?.categoria)) || TRIGGER_CATEGORIAS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-fuchsia-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${categoria.color}15` }}
              >
                <Zap size={24} style={{ color: categoria.color }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{flujo.nombre}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{flujo.descripcion}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      flujo.estado === "ACTIVO" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {flujo.estado}
                  </span>
                  <span className="text-[11px] text-slate-400">{triggerConfig?.label}</span>
                </div>
              </div>
            </div>
            <button onClick={onCerrar} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={16} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100 px-6">
          <div className="flex gap-4">
            {(["general", "historial"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTabActiva(tab)}
                className={`py-3 text-[11px] font-semibold border-b-2 transition-colors ${
                  tabActiva === tab
                    ? "border-violet-500 text-violet-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab === "general" ? "General" : "Historial"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {tabActiva === "general" ? (
            <div className="space-y-6">
              {/* Flujo visual */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-[11px] font-bold text-slate-600 mb-3">Flujo</h4>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <div className="flex flex-col items-center min-w-[80px]">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                      <Zap size={18} className="text-violet-500" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 mt-1">{triggerConfig?.label}</span>
                  </div>
                  {(flujo.acciones || flujo.pasos || []).map((accion: any, idx: number) => {
                    const config = ACCIONES_TIPOS.find((a) => a.id === accion.tipo);
                    return (
                      <div key={idx} className="flex items-center gap-1">
                        <ArrowRight size={12} className="text-slate-300" />
                        <div className="flex flex-col items-center min-w-[70px]">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${config?.color || "#64748B"}15` }}
                          >
                            <Zap size={14} style={{ color: config?.color || "#64748B" }} />
                          </div>
                          <span className="text-[9px] font-semibold text-slate-600 mt-1 text-center">
                            {config?.label || accion.tipo}
                          </span>
                          {accion.delay > 0 && (
                            <span className="text-[8px] text-slate-400">
                              +{accion.delay >= 60 ? `${Math.round(accion.delay / 60)}h` : `${accion.delay}m`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Metricas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-blue-700">{(flujo.ejecuciones || 0).toLocaleString()}</div>
                  <div className="text-[10px] text-blue-500">Ejecuciones</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-emerald-700">{flujo.exitosas || 0}</div>
                  <div className="text-[10px] text-emerald-500">Exitosas</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-red-700">{flujo.fallidas || 0}</div>
                  <div className="text-[10px] text-red-500">Fallidas</div>
                </div>
              </div>

              {/* Condiciones */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-600 mb-2">Condiciones</h4>
                {(!flujo.condiciones || flujo.condiciones.length === 0) ? (
                  <p className="text-[10px] text-slate-400 italic">Se ejecuta siempre</p>
                ) : (
                  <div className="space-y-1">
                    {flujo.condiciones.map((cond: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-[11px]">
                        <span className="font-semibold text-slate-600">{cond.campo}</span>
                        <span className="text-slate-400">{cond.operador}</span>
                        <span className="font-bold text-slate-800">{cond.valor}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-600 mb-2">Acciones</h4>
                <div className="space-y-1">
                  {(flujo.acciones || flujo.pasos || []).map((accion: any, idx: number) => {
                    const config = ACCIONES_TIPOS.find((a) => a.id === accion.tipo);
                    return (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] font-bold text-slate-400 w-5">{idx + 1}</span>
                        <span className="text-[11px] font-semibold text-slate-700">{config?.label || accion.tipo}</span>
                        {accion.delay > 0 && (
                          <span className="text-[10px] text-slate-400">
                            +{accion.delay >= 60 ? `${Math.round(accion.delay / 60)}h` : `${accion.delay}m`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <FlujoHistorial flujoId={flujoId} />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => onEditar(flujo)}
            className="px-4 py-2 bg-violet-500 text-white text-[11px] font-semibold rounded-xl hover:bg-violet-600 transition-colors flex items-center gap-1.5"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}