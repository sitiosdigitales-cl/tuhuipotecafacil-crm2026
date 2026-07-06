"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertTriangle,
  Send,
} from "lucide-react";
import type { DocumentoLead } from "@/tipos";
import { TIPOS_DOCUMENTO_CONFIG } from "@/tipos";

interface GestionarEstadoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documento: DocumentoLead | null;
  onCambiarEstado: (docId: string, nuevoEstado: DocumentoLead["estado"], comentario?: string) => void;
}

const estadoConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE: { label: "Pendiente", color: "text-slate-600", bg: "bg-slate-100" },
  EN_REVISION: { label: "En Revisión", color: "text-amber-600", bg: "bg-amber-100" },
  APROBADO: { label: "Aprobado", color: "text-emerald-600", bg: "bg-emerald-100" },
  RECHAZADO: { label: "Rechazado", color: "text-red-600", bg: "bg-red-100" },
};

const MOTIVOS_RECHAZO = [
  "Documento ilegible",
  "Documento vencido",
  "Información inconsistente",
  "Documento incompleto",
  "Tipo de documento incorrecto",
  "Otro",
];

export function GestionarEstado({
  open,
  onOpenChange,
  documento,
  onCambiarEstado,
}: GestionarEstadoProps) {
  const [comentario, setComentario] = useState("");
  const [motivoRechazo, setMotivoRechazo] = useState("");

  if (!documento) return null;

  const configTipo = TIPOS_DOCUMENTO_CONFIG[documento.tipo];
  const configEstado = estadoConfig[documento.estado];

  const handleAprobar = () => {
    onCambiarEstado(documento.id, "APROBADO", comentario || undefined);
    setComentario("");
    onOpenChange(false);
  };

  const handleRechazar = () => {
    const motivo = motivoRechazo === "Otro" ? comentario : motivoRechazo;
    onCambiarEstado(documento.id, "RECHAZADO", motivo || undefined);
    setComentario("");
    setMotivoRechazo("");
    onOpenChange(false);
  };

  const handleEnviarRevision = () => {
    onCambiarEstado(documento.id, "EN_REVISION", comentario || undefined);
    setComentario("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0">
        <DialogHeader className="p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <MessageSquare size={18} className="text-slate-500" />
            </div>
            <div>
              <DialogTitle className="text-slate-900">Gestionar Documento</DialogTitle>
              <DialogDescription className="text-slate-500">
                {documento.nombre} - {configTipo?.label}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 space-y-4">
          {/* Estado actual */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-500 font-medium">Estado actual:</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${configEstado?.bg} ${configEstado?.color}`}>
              {configEstado?.label}
            </span>
          </div>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-3 gap-2">
            {documento.estado !== "APROBADO" && (
              <button
                onClick={handleAprobar}
                className="flex flex-col items-center gap-1.5 p-3 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle size={18} className="text-emerald-600" />
                <span className="text-[10px] font-semibold text-emerald-700">Aprobar</span>
              </button>
            )}
            {documento.estado !== "RECHAZADO" && (
              <button
                onClick={() => setMotivoRechazo(MOTIVOS_RECHAZO[0])}
                className="flex flex-col items-center gap-1.5 p-3 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
              >
                <XCircle size={18} className="text-red-600" />
                <span className="text-[10px] font-semibold text-red-700">Rechazar</span>
              </button>
            )}
            {documento.estado !== "EN_REVISION" && documento.estado !== "APROBADO" && (
              <button
                onClick={handleEnviarRevision}
                className="flex flex-col items-center gap-1.5 p-3 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors"
              >
                <AlertTriangle size={18} className="text-amber-600" />
                <span className="text-[10px] font-semibold text-amber-700">En Revisión</span>
              </button>
            )}
          </div>

          {/* Motivo de rechazo */}
          {motivoRechazo && (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-700">
                Motivo de rechazo
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {MOTIVOS_RECHAZO.map((motivo) => (
                  <button
                    key={motivo}
                    onClick={() => setMotivoRechazo(motivo)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-medium text-left transition-colors ${
                      motivoRechazo === motivo
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent"
                    }`}
                  >
                    {motivo}
                  </button>
                ))}
              </div>
              {motivoRechazo === "Otro" && (
                <input
                  type="text"
                  placeholder="Especificar motivo..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
                />
              )}
            </div>
          )}

          {/* Comentario */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">
              Comentario {motivoRechazo ? "(opcional)" : ""}
            </label>
            <textarea
              placeholder="Agregar un comentario sobre este documento..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          {motivoRechazo && (
            <button
              onClick={handleRechazar}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-red-600 text-white rounded-xl text-[11px] font-semibold hover:bg-red-700 transition-colors"
            >
              <XCircle size={14} />
              Rechazar
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
