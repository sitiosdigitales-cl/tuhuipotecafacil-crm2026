"use client";

import { useState } from "react";
import { X, Plus, GripVertical, Zap } from "lucide-react";
import { TRIGGERS_TIPOS, TRIGGER_CATEGORIAS, CONDICION_OPERADORES, CAMPOS_POR_CATEGORIA, ACCIONES_TIPOS } from "@/modulos/automatizacion/config";
import { PasoFlujo } from "./PasoFlujo";
import { SelectorAccion } from "./SelectorAccion";
import { ConfigAccion } from "./ConfigAccion";
import { toast } from "sonner";

interface FlujoEditorPanelProps {
  flujo: any | null;
  onGuardar: (data: any) => void;
  onCerrar: () => void;
}

export function FlujoEditorPanel({ flujo, onGuardar, onCerrar }: FlujoEditorPanelProps) {
  const [form, setForm] = useState({
    nombre: flujo?.nombre || "",
    descripcion: flujo?.descripcion || "",
    trigger: flujo?.trigger || TRIGGERS_TIPOS[0].id,
    categoria: flujo?.categoria || "lead",
    condiciones: flujo?.condiciones || [],
    logica_condiciones: flujo?.logica_condiciones || "AND",
    acciones: flujo?.acciones || flujo?.pasos || [],
    estado: flujo?.estado || "BORRADOR",
  });

  const [mostrarSelectorAccion, setMostrarSelectorAccion] = useState(false);

  const camposDisponibles = CAMPOS_POR_CATEGORIA[form.categoria] || [];

  // Condiciones
  const agregarCondicion = () => {
    setForm((p) => ({
      ...p,
      condiciones: [...p.condiciones, { campo: camposDisponibles[0]?.id || "", operador: "igual", valor: "" }],
    }));
  };

  const eliminarCondicion = (idx: number) => {
    setForm((p) => ({
      ...p,
      condiciones: p.condiciones.filter((_: any, i: number) => i !== idx),
    }));
  };

  const actualizarCondicion = (idx: number, campo: string, valor: any) => {
    setForm((p) => ({
      ...p,
      condiciones: p.condiciones.map((c: any, i: number) => i === idx ? { ...c, [campo]: valor } : c),
    }));
  };

  // Acciones
  const agregarAccion = (tipo: string) => {
    setForm((p) => ({
      ...p,
      acciones: [...p.acciones, { tipo, configuracion: {}, delay: 0, orden: p.acciones.length + 1 }],
    }));
  };

  const eliminarAccion = (idx: number) => {
    setForm((p) => ({
      ...p,
      acciones: p.acciones.filter((_: any, i: number) => i !== idx).map((a: any, i: number) => ({ ...a, orden: i + 1 })),
    }));
  };

  const actualizarAccion = (idx: number, campo: string, valor: any) => {
    setForm((p) => ({
      ...p,
      acciones: p.acciones.map((a: any, i: number) => {
        if (i !== idx) return a;
        if (campo === "configuracion") return { ...a, configuracion: valor };
        return { ...a, [campo]: valor };
      }),
    }));
  };

  // Mover accion (drag-and-drop simplificado)
  const moverAccion = (idx: number, direccion: "arriba" | "abajo") => {
    const nuevoIdx = direccion === "arriba" ? idx - 1 : idx + 1;
    if (nuevoIdx < 0 || nuevoIdx >= form.acciones.length) return;

    const nuevasAcciones = [...form.acciones];
    const temp = nuevasAcciones[idx];
    nuevasAcciones[idx] = nuevasAcciones[nuevoIdx];
    nuevasAcciones[nuevoIdx] = temp;

    // Actualizar orden
    nuevasAcciones.forEach((a: any, i: number) => a.orden = i + 1);
    setForm((p) => ({ ...p, acciones: nuevasAcciones }));
  };

  const handleSubmit = () => {
    if (!form.nombre || !form.trigger || form.acciones.length === 0) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    onGuardar(form);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onCerrar} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {flujo ? "Editar Flujo" : "Nuevo Flujo"}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Configura tu flujo de automatizacion</p>
          </div>
          <button onClick={onCerrar} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Nombre *</label>
            <input
              type="text"
              placeholder="Ej: Bienvenida Nuevo Lead"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all"
            />
          </div>

          {/* Descripcion */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Descripcion</label>
            <textarea
              placeholder="Describe que hace este flujo..."
              rows={2}
              value={form.descripcion}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 resize-none transition-all"
            />
          </div>

          {/* Trigger */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Evento Trigger *</label>
            <select
              value={form.trigger}
              onChange={(e) => {
                const val = e.target.value;
                const cat = TRIGGERS_TIPOS.find((t) => t.id === val)?.categoria || "lead";
                setForm((p) => ({ ...p, trigger: val, categoria: cat }));
              }}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400"
            >
              {TRIGGER_CATEGORIAS.map((cat) => (
                <optgroup key={cat.id} label={cat.label}>
                  {TRIGGERS_TIPOS.filter((t) => t.categoria === cat.id).map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Condiciones */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-700">Condiciones</label>
              <div className="flex gap-1">
                {(["AND", "OR"] as const).map((logica) => (
                  <button
                    key={logica}
                    onClick={() => setForm((p) => ({ ...p, logica_condiciones: logica }))}
                    className={`px-2 py-1 rounded-lg text-[9px] font-semibold transition-all ${
                      form.logica_condiciones === logica
                        ? "bg-violet-500 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {logica}
                  </button>
                ))}
              </div>
            </div>

            {form.condiciones.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
                <p className="text-[10px] text-slate-400">Sin condiciones = se ejecuta siempre</p>
              </div>
            ) : (
              <div className="space-y-2">
                {form.condiciones.map((cond: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                    <select
                      value={cond.campo}
                      onChange={(e) => actualizarCondicion(idx, "campo", e.target.value)}
                      className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600 flex-1"
                    >
                      {camposDisponibles.map((campo) => (
                        <option key={campo.id} value={campo.id}>{campo.label}</option>
                      ))}
                    </select>
                    <select
                      value={cond.operador}
                      onChange={(e) => actualizarCondicion(idx, "operador", e.target.value)}
                      className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600"
                    >
                      {CONDICION_OPERADORES.map((op) => (
                        <option key={op.id} value={op.id}>{op.label}</option>
                      ))}
                    </select>
                    {!["esta_vacio", "no_vacio"].includes(cond.operador) && (
                      <input
                        type="text"
                        placeholder="Valor"
                        value={cond.valor || ""}
                        onChange={(e) => actualizarCondicion(idx, "valor", e.target.value)}
                        className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600 flex-1"
                      />
                    )}
                    <button
                      onClick={() => eliminarCondicion(idx)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={agregarCondicion}
              className="text-[10px] font-semibold text-violet-600 hover:text-violet-700"
            >
              + Agregar condicion
            </button>
          </div>

          {/* Acciones */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-700">Acciones *</label>

            {form.acciones.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
                <p className="text-[10px] text-slate-400">Agrega al menos una accion</p>
              </div>
            ) : (
              <div className="space-y-2">
                {form.acciones.map((accion: any, idx: number) => (
                  <ConfigAccion
                    key={idx}
                    accion={accion}
                    index={idx}
                    onActualizar={actualizarAccion}
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => setMostrarSelectorAccion(true)}
              className="w-full flex items-center justify-center gap-2 p-2 bg-violet-50 hover:bg-violet-100 rounded-xl border border-dashed border-violet-300 transition-all"
            >
              <Plus size={14} className="text-violet-500" />
              <span className="text-[11px] font-semibold text-violet-600">Agregar accion</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-violet-500 text-white text-[11px] font-semibold rounded-xl hover:bg-violet-600 transition-colors shadow-md shadow-violet-500/20"
          >
            {flujo ? "Actualizar" : "Crear"} Flujo
          </button>
        </div>
      </div>

      {/* Selector de Accion */}
      {mostrarSelectorAccion && (
        <SelectorAccion
          onSeleccionar={agregarAccion}
          onCerrar={() => setMostrarSelectorAccion(false)}
        />
      )}
    </>
  );
}