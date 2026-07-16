"use client";

import { Zap, ChevronDown, ChevronUp } from "lucide-react";
import { ACCIONES_TIPOS } from "@/modulos/automatizacion/config";
import { useState } from "react";

interface ConfigAccionProps {
  accion: any;
  index: number;
  onActualizar: (index: number, campo: string, valor: any) => void;
}

export function ConfigAccion({ accion, index, onActualizar }: ConfigAccionProps) {
  const [expandido, setExpandido] = useState(false);
  const accionConfig = ACCIONES_TIPOS.find((a) => a.id === accion.tipo);

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpandido(!expandido)}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accionConfig?.color || "#64748B"}15` }}
        >
          <Zap size={14} style={{ color: accionConfig?.color || "#64748B" }} />
        </div>
        <span className="text-[11px] font-semibold text-slate-700 flex-1">
          {accionConfig?.label || accion.tipo}
        </span>
        <input
          type="number"
          placeholder="0"
          value={accion.delay || ""}
          onChange={(e) => {
            e.stopPropagation();
            onActualizar(index, "delay", parseInt(e.target.value) || 0);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-16 h-7 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 text-center"
        />
        <span className="text-[9px] text-slate-400">min</span>
        {expandido ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </div>

      {/* Configuracion expandida */}
      {expandido && (
        <div className="p-3 pt-0 border-t border-slate-100 space-y-3">
          {/* Configuracion segun tipo de accion */}
          {accion.tipo === "enviar_email" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">Plantilla</label>
                <select
                  value={accion.configuracion?.plantilla || ""}
                  onChange={(e) => onActualizar(index, "configuracion", { ...accion.configuracion, plantilla: e.target.value })}
                  className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600"
                >
                  <option value="">Seleccionar plantilla</option>
                  <option value="Bienvenida Lead">Bienvenida Lead</option>
                  <option value="Seguimiento">Seguimiento</option>
                  <option value="Recordatorio Documentos">Recordatorio Documentos</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">Asunto</label>
                <input
                  type="text"
                  value={accion.configuracion?.asunto || ""}
                  onChange={(e) => onActualizar(index, "configuracion", { ...accion.configuracion, asunto: e.target.value })}
                  placeholder="Asunto del email"
                  className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600"
                />
              </div>
            </>
          )}

          {accion.tipo === "enviar_whatsapp" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">Plantilla</label>
                <select
                  value={accion.configuracion?.plantilla || ""}
                  onChange={(e) => onActualizar(index, "configuracion", { ...accion.configuracion, plantilla: e.target.value })}
                  className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600"
                >
                  <option value="">Seleccionar plantilla</option>
                  <option value="Saludo WhatsApp">Saludo WhatsApp</option>
                  <option value="Recordatorio">Recordatorio</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">Mensaje</label>
                <textarea
                  value={accion.configuracion?.mensaje || ""}
                  onChange={(e) => onActualizar(index, "configuracion", { ...accion.configuracion, mensaje: e.target.value })}
                  placeholder="Mensaje a enviar"
                  rows={2}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 resize-none"
                />
              </div>
            </>
          )}

          {accion.tipo === "crear_tarea" && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">Titulo</label>
                <input
                  type="text"
                  value={accion.configuracion?.titulo || ""}
                  onChange={(e) => onActualizar(index, "configuracion", { ...accion.configuracion, titulo: e.target.value })}
                  placeholder="Titulo de la tarea"
                  className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">Asignar a</label>
                <input
                  type="text"
                  value={accion.configuracion?.asignadoA || ""}
                  onChange={(e) => onActualizar(index, "configuracion", { ...accion.configuracion, asignadoA: e.target.value })}
                  placeholder="Nombre del ejecutivo"
                  className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600"
                />
              </div>
            </>
          )}

          {accion.tipo === "mover_pipeline" && (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-500">Etapa destino</label>
              <select
                value={accion.configuracion?.etapaDestino || ""}
                onChange={(e) => onActualizar(index, "configuracion", { ...accion.configuracion, etapaDestino: e.target.value })}
                className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600"
              >
                <option value="">Seleccionar etapa</option>
                <option value="CONTACTO_INICIAL">Contacto Inicial</option>
                <option value="INTERESADO">Interesado</option>
                <option value="CALIFICACION_COMERCIAL">Calificacion Comercial</option>
                <option value="DOCS_PENDIENTES">Docs Pendientes</option>
                <option value="DOCS_COMPLETAS">Docs Completas</option>
                <option value="EVALUACION_BANCARIA">Evaluacion Bancaria</option>
                <option value="APROBADO">Aprobado</option>
                <option value="CLIENTE_FINALIZADO">Cliente Finalizado</option>
              </select>
            </div>
          )}

          {accion.tipo === "notificar_equipo" && (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-500">Mensaje</label>
              <textarea
                value={accion.configuracion?.mensaje || ""}
                onChange={(e) => onActualizar(index, "configuracion", { ...accion.configuracion, mensaje: e.target.value })}
                placeholder="Mensaje de notificacion"
                rows={2}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 resize-none"
              />
            </div>
          )}

          {accion.tipo === "agregar_etiqueta" && (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-500">Etiqueta</label>
              <input
                type="text"
                value={accion.configuracion?.etiqueta || ""}
                onChange={(e) => onActualizar(index, "configuracion", { ...accion.configuracion, etiqueta: e.target.value })}
                placeholder="Nombre de la etiqueta"
                className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600"
              />
            </div>
          )}

          {/* Para acciones sin configuracion especifica */}
          {!["enviar_email", "enviar_whatsapp", "crear_tarea", "mover_pipeline", "notificar_equipo", "agregar_etiqueta"].includes(accion.tipo) && (
            <p className="text-[10px] text-slate-400 italic">Esta accion no requiere configuracion adicional</p>
          )}
        </div>
      )}
    </div>
  );
}