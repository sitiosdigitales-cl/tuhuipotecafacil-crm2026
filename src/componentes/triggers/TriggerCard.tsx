"use client";

import {
  Zap, Play, Pause, Eye, Edit, Trash2, ArrowRight,
  Users, FileText, CheckCircle, AlertTriangle, Clock,
  Mail, MessageSquare, Phone, DollarSign, Building,
  UserPlus, Tag, Bell, Calendar, ClipboardList, RefreshCw,
} from "lucide-react";
import {
  TRIGGER_CATEGORIAS,
  ACCIONES_TIPOS,
  TRIGGERS_TIPOS,
  type obtenerCategoriaTrigger,
} from "@/modulos/automatizacion/config";

const ICON_MAP: Record<string, any> = {
  Users, FileText, CheckCircle, AlertTriangle, Clock,
  Mail, MessageSquare, Phone, DollarSign, Building,
  UserPlus, Tag, Bell, Calendar, ClipboardList, RefreshCw,
  XCircle: AlertTriangle, UserCheck: Users,
};

interface TriggerCardProps {
  trigger: any;
  onToggleEstado: (id: string) => void;
  onVerDetalle: (id: string) => void;
  onEditar: (trigger: any) => void;
  onEliminar: (id: string) => void;
}

export function TriggerCard({
  trigger,
  onToggleEstado,
  onVerDetalle,
  onEditar,
  onEliminar,
}: TriggerCardProps) {
  const triggerConfig = TRIGGERS_TIPOS.find((t) => t.id === trigger.trigger);
  const categoria = TRIGGER_CATEGORIAS.find((c) => c.id === (trigger.categoria || triggerConfig?.categoria)) || TRIGGER_CATEGORIAS[0];
  const TriggerIcon = ICON_MAP[triggerConfig?.icono || "Zap"] || Zap;

  const exitosas = trigger.exitosas || 0;
  const fallidas = trigger.fallidas || 0;
  const total = exitosas + fallidas;
  const tasaExito = total > 0 ? Math.round((exitosas / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${categoria.color}15` }}
          >
            <Zap size={20} style={{ color: categoria.color }} />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-slate-800">{trigger.nombre}</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">{trigger.descripcion}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  trigger.estado === "ACTIVO"
                    ? "bg-emerald-50 text-emerald-600"
                    : trigger.estado === "PAUSADO"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {trigger.estado === "ACTIVO" ? "Ã¢â€”Â Activo" : trigger.estado === "PAUSADO" ? "Ã¢â€”Â Pausado" : "Ã¢â€”Â Borrador"}
              </span>
              <span className="text-[11px] text-slate-400">
                {triggerConfig?.label || trigger.trigger}
              </span>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${categoria.color}15`, color: categoria.color }}
              >
                {categoria.label}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleEstado(trigger.id)}
            className={`p-2 rounded-lg transition-colors ${
              trigger.estado === "ACTIVO"
                ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                : "bg-amber-100 text-amber-600 hover:bg-amber-200"
            }`}
            title={trigger.estado === "ACTIVO" ? "Pausar" : "Activar"}
          >
            {trigger.estado === "ACTIVO" ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={() => onVerDetalle(trigger.id)}
            className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            title="Ver detalle"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => onEditar(trigger)}
            className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onEliminar(trigger.id)}
            className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Condiciones */}
      <div className="mb-4">
        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Condiciones
        </h5>
        <div className="flex flex-wrap gap-2">
          {(!trigger.condiciones || trigger.condiciones.length === 0) ? (
            <span className="text-[10px] text-slate-400 italic">Sin condiciones (siempre se ejecuta)</span>
          ) : (
            (trigger.condiciones || []).map((cond: any, idx: number) => (
              <span
                key={idx}
                className="text-[11px] font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg"
              >
                {cond.campo} {cond.operador} {cond.valor}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-4">
        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Acciones ({(trigger.acciones || []).length})
        </h5>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Trigger event */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 rounded-lg border border-amber-200/60">
            <Zap size={10} className="text-amber-500" />
            <span className="text-[11px] font-semibold text-amber-700">{triggerConfig?.label || "Trigger"}</span>
          </div>

          <ArrowRight size={12} className="text-slate-300" />

          {/* Acciones */}
          {(trigger.acciones || []).map((accion: any, idx: number) => {
            const accionConfig = ACCIONES_TIPOS.find((a) => a.id === accion.tipo);
            const AccionIcon = accionConfig ? (ICON_MAP[accionConfig.icono] || Zap) : Zap;
            return (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <AccionIcon size={10} style={{ color: accionConfig?.color || "#64748B" }} />
                  <span className="text-[11px] font-semibold text-slate-600">
                    {accionConfig?.label || accion.tipo}
                  </span>
                  {accion.delay > 0 && (
                    <span className="text-[10px] text-slate-400">
                      +{accion.delay >= 60 ? `${Math.round(accion.delay / 60)}h` : `${accion.delay}m`}
                    </span>
                  )}
                </div>
                {idx < (trigger.acciones || []).length - 1 && (
                  <ArrowRight size={10} className="text-slate-300" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Metricas */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-4 text-[10px] text-slate-400">
          <span>
            <span className="font-semibold text-slate-600">{(trigger.ejecuciones || 0).toLocaleString()}</span> ejecuciones
          </span>
          <span>
            <span className="font-semibold text-emerald-600">{exitosas}</span> exitos
          </span>
          <span>
            <span className="font-semibold text-red-600">{fallidas}</span> fallos
          </span>
          <span className="font-semibold" style={{ color: tasaExito >= 90 ? "#10B981" : tasaExito >= 70 ? "#F59E0B" : "#EF4444" }}>
            {tasaExito}% exito
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          {trigger.ultimoDisparo
            ? `Ultimo: ${new Date(trigger.ultimoDisparo).toLocaleDateString("es-CL")}`
            : "Sin ejecuciones"}
        </span>
      </div>
    </div>
  );
}