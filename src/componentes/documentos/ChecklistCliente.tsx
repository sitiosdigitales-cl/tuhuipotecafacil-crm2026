"use client";

import { useState, useMemo } from "react";
import {
  Check,
  Clock,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Send,
  FileText,
  Briefcase,
  User,
  Building2,
} from "lucide-react";
import { DOCUMENTOS_POR_SITUACION, DOCUMENTOS_PATRIMONIO } from "@/modulos/documentos/config";
import type { DocumentoLead } from "@/tipos";

type SituacionLaboral = "DEPENDIENTE" | "INDEPENDIENTE" | "EMPRESA";

interface ChecklistClienteProps {
  leadId: string;
  leadNombre: string;
  documentos: DocumentoLead[];
  onSolicitarFaltantes: (leadId: string, leadNombre: string, faltantes: string[]) => void;
}

const situacionConfig: Record<SituacionLaboral, { label: string; icon: React.ReactNode; color: string }> = {
  DEPENDIENTE: { label: "Dependiente", icon: <Briefcase size={12} />, color: "text-blue-600" },
  INDEPENDIENTE: { label: "Independiente", icon: <User size={12} />, color: "text-purple-600" },
  EMPRESA: { label: "Empresa", icon: <Building2 size={12} />, color: "text-amber-600" },
};

interface DocChecklistItem {
  id: string;
  nombre: string;
  obligatorio: boolean;
  estado: "APROBADO" | "EN_REVISION" | "PENDIENTE" | "RECHAZADO" | "FALTA";
  documentoReal?: DocumentoLead;
}

export function ChecklistCliente({
  leadId,
  leadNombre,
  documentos,
  onSolicitarFaltantes,
}: ChecklistClienteProps) {
  const [situacion, setSituacion] = useState<SituacionLaboral>("DEPENDIENTE");
  const [expandido, setExpandido] = useState(false);
  const [mostrarOpcionales, setMostrarOpcionales] = useState(false);

  const documentosRequeridos = useMemo(() => {
    return DOCUMENTOS_POR_SITUACION[situacion] || [];
  }, [situacion]);

  const checklistItems = useMemo<DocChecklistItem[]>(() => {
    const items: DocChecklistItem[] = [];

    // Documentos obligatorios
    for (const req of documentosRequeridos) {
      const docReal = documentos.find((d) => {
        const tipo = d.tipo?.toUpperCase().replace(/\s+/g, "_");
        const reqId = req.id.toUpperCase().replace(/-/g, "_");
        return tipo === reqId || d.nombre?.toLowerCase().includes(req.nombre.toLowerCase().split("(")[0].trim().toLowerCase());
      });

      items.push({
        id: req.id,
        nombre: req.nombre,
        obligatorio: true,
        estado: docReal ? (docReal.estado as any) : "FALTA",
        documentoReal: docReal,
      });
    }

    // Documentos de patrimonio (opcionales)
    for (const opt of DOCUMENTOS_PATRIMONIO) {
      const docReal = documentos.find((d) => {
        const tipo = d.tipo?.toUpperCase().replace(/\s+/g, "_");
        const optId = opt.id.toUpperCase().replace(/-/g, "_");
        return tipo === optId || d.nombre?.toLowerCase().includes(opt.nombre.toLowerCase().split("(")[0].trim().toLowerCase());
      });

      items.push({
        id: opt.id,
        nombre: opt.nombre,
        obligatorio: false,
        estado: docReal ? (docReal.estado as any) : "FALTA",
        documentoReal: docReal,
      });
    }

    return items;
  }, [documentosRequeridos, documentos]);

  const obligatorios = checklistItems.filter((i) => i.obligatorio);
  const opcionales = checklistItems.filter((i) => !i.obligatorio);

  const aprobados = obligatorios.filter((i) => i.estado === "APROBADO").length;
  const totalRequeridos = obligatorios.length;
  const porcentaje = totalRequeridos > 0 ? Math.round((aprobados / totalRequeridos) * 100) : 0;
  const faltantes = obligatorios.filter((i) => i.estado === "FALTA").map((i) => i.nombre);

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case "APROBADO":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          icon: <Check size={12} className="text-emerald-600" />,
          text: "text-emerald-700",
          label: "Aprobado",
          dot: "bg-emerald-500",
        };
      case "EN_REVISION":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: <Clock size={12} className="text-blue-600" />,
          text: "text-blue-700",
          label: "En revisión",
          dot: "bg-blue-500",
        };
      case "PENDIENTE":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          icon: <AlertCircle size={12} className="text-amber-600" />,
          text: "text-amber-700",
          label: "Pendiente",
          dot: "bg-amber-500",
        };
      case "RECHAZADO":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: <XCircle size={12} className="text-red-600" />,
          text: "text-red-700",
          label: "Rechazado",
          dot: "bg-red-500",
        };
      default:
        return {
          bg: "bg-slate-50",
          border: "border-dashed border-slate-300",
          icon: <div className="w-3 h-3 rounded-full border-2 border-slate-300" />,
          text: "text-slate-500",
          label: "Falta",
          dot: "bg-slate-300",
        };
    }
  };

  const initials = leadNombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const getBarColor = () => {
    if (porcentaje === 100) return "bg-emerald-500";
    if (porcentaje >= 60) return "bg-blue-500";
    if (porcentaje >= 30) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-soft">
      {/* Header */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpandido(!expandido)}
      >
        {/* Avatar */}
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-slate-800 truncate">{leadNombre}</span>
            {/* Selector de situación */}
            <select
              value={situacion}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setSituacion(e.target.value as SituacionLaboral)}
              className="text-[9px] font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="DEPENDIENTE">Dependiente</option>
              <option value="INDEPENDIENTE">Independiente</option>
              <option value="EMPRESA">Empresa</option>
            </select>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-[9px] font-semibold ${situacionConfig[situacion].color}`}>
              {situacionConfig[situacion].icon} {situacionConfig[situacion].label}
            </span>
            <span className="text-[9px] text-slate-400">
              {aprobados}/{totalRequeridos} obligatorios aprobados
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-24">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold text-slate-600">{porcentaje}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor()}`}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>
          <div className="text-slate-400">
            {expandido ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        </div>
      </div>

      {/* Contenido expandido */}
      {expandido && (
        <div className="border-t border-slate-100">
          {/* Documentos obligatorios */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Documentos Obligatorios ({obligatorios.length})
              </span>
              {faltantes.length > 0 && (
                <button
                  onClick={() => onSolicitarFaltantes(leadId, leadNombre, faltantes)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <Send size={10} /> Solicitar faltantes ({faltantes.length})
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {obligatorios.map((item) => {
                const config = getEstadoConfig(item.estado);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border ${config.bg} ${config.border} transition-colors`}
                  >
                    <div className="flex-shrink-0">{config.icon}</div>
                    <FileText size={12} className="text-slate-400 flex-shrink-0" />
                    <span className={`flex-1 text-[11px] font-medium ${config.text}`}>
                      {item.nombre}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Documentos de patrimonio (opcionales) */}
          <div className="px-4 pb-4">
            <button
              onClick={() => setMostrarOpcionales(!mostrarOpcionales)}
              className="flex items-center gap-2 mb-2 text-[10px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              {mostrarOpcionales ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Patrimonio (opcional) — {opcionales.filter((i) => i.estado !== "FALTA").length}/{opcionales.length}
            </button>

            {mostrarOpcionales && (
              <div className="space-y-1.5">
                {opcionales.map((item) => {
                  const config = getEstadoConfig(item.estado);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border ${config.bg} ${config.border} transition-colors`}
                    >
                      <div className="flex-shrink-0">{config.icon}</div>
                      <FileText size={12} className="text-slate-400 flex-shrink-0" />
                      <span className={`flex-1 text-[11px] font-medium ${config.text}`}>
                        {item.nombre}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                        {config.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
