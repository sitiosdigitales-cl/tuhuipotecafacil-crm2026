"use client";

import {
  Zap, Play, Pause, Eye, Edit, Trash2, ArrowRight,
  Users, FileText, CheckCircle, AlertTriangle, Clock,
  Mail, MessageSquare, Phone, DollarSign, Building,
  UserPlus, Tag, Bell, Calendar, ClipboardList, RefreshCw,
} from "lucide-react";
import { TRIGGER_CATEGORIAS, ACCIONES_TIPOS, TRIGGERS_TIPOS } from "@/modulos/automatizacion/config";

const ICON_MAP: Record<string, any> = {
  Users, FileText, CheckCircle, AlertTriangle, Clock,
  Mail, MessageSquare, Phone, DollarSign, Building,
  UserPlus, Tag, Bell, Calendar, ClipboardList, RefreshCw,
  XCircle: AlertTriangle, UserCheck: Users,
};

interface FlujoCardProps {
  flujo: any;
  onToggleEstado: (id: string) => void;
  onVerDetalle: (id: string) => void;
  onEditar: (flujo: any) => void;
  onEliminar: (id: string) => void;
}

export function FlujoCard({
  flujo,
  onToggleEstado,
  onVerDetalle,
  onEditar,
  onEliminar,
}: FlujoCardProps) {
  const triggerConfig = TRIGGERS_TIPOS.find((t) => t.id === flujo.trigger);
  const categoria = TRIGGER_CATEGORIAS.find((c) => c.id === (flujo.categoria || triggerConfig?.categoria)) || TRIGGER_CATEGORIAS[0];

  const exitosas = flujo.exitosas || 0;
  const fallidas = flujo.fallidas || 0;
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
            <h4 className="text-[13px] font-bold text-slate-800">{flujo.nombre}</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">{flujo.descripcion}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  flujo.estado === "ACTIVO"
                    ? "bg-emerald-50 text-emerald-600"
                    : flujo.estado === "PAUSADO"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {flujo.estado === "ACTIVO" ? "● Activo" : flujo.estado === "PAUSADO" ? "● Pausado" : "● Borrador"}
              </span>
              <span className="text-[11px] text-slate-400">
                {triggerConfig?.label || flujo.trigger}
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
            onClick={() => onToggleEstado(flujo.id)}
            className={`p-2 rounded-lg transition-colors ${
              flujo.estado === "ACTIVO"
                ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                : "bg-amber-100 text-amber-600 hover:bg-amber-200"
            }`}
            title={flujo.estado === "ACTIVO" ? "Pausar" : "Activar"}
          >
            {flujo.estado === "ACTIVO" ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={() => onVerDetalle(flujo.id)}
            className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            title="Ver detalle"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => onEditar(flujo)}
            className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onEliminar(flujo.id)}
            className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Mini Flujo Visual */}
      <div className="mb-4">
        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Flujo
        </h5>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {/* Trigger */}
          <div className="flex flex-col items-center min-w-[70px]">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${categoria.color}15` }}
            >
              <Zap size={16} style={{ color: categoria.color }} />
            </div>
            <span className="text-[9px] font-semibold text-slate-600 mt-1 text-center">
              {triggerConfig?.label || "Trigger"}
            </span>
          </div>

          <ArrowRight size={12} className="text-slate-300 flex-shrink-0" />

          {/* Acciones */}
          {(flujo.acciones || flujo.pasos || []).map((accion: any, idx: number) => {
            const accionConfig = ACCIONES_TIPOS.find((a) => a.id === accion.tipo);
            const AccionIcon = accionConfig ? (ICON_MAP[accionConfig.icono] || Zap) : Zap;
            return (
              <div key={idx} className="flex items-center gap-1">
                <div className="flex flex-col items-center min-w-[60px]">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${accionConfig?.color || "#64748B"}15` }}
                  >
                    <AccionIcon size={14} style={{ color: accionConfig?.color || "#64748B" }} />
                  </div>
                  <span className="text-[9px] font-semibold text-slate-600 mt-1 text-center">
                    {accionConfig?.label || accion.tipo}
                  </span>
                  {accion.delay > 0 && (
                    <span className="text-[8px] text-slate-400">
                      +{accion.delay >= 60 ? `${Math.round(accion.delay / 60)}h` : `${accion.delay}m`}
                    </span>
                  )}
                </div>
                {idx < (flujo.acciones || flujo.pasos || []).length - 1 && (
                  <ArrowRight size={10} className="text-slate-300 flex-shrink-0" />
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
            <span className="font-semibold text-slate-600">{(flujo.ejecuciones || 0).toLocaleString()}</span> ejecuciones
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
          {flujo.ultimoEjecucion || flujo.ultimo_ejecucion
            ? `Ultimo: ${new Date(flujo.ultimoEjecucion || flujo.ultimo_ejecucion).toLocaleDateString("es-CL")}`
            : "Sin ejecuciones"}
        </span>
      </div>
    </div>
  );
}