"use client";

import { useState, useRef } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Upload,
  Download,
  Eye,
  Loader2,
} from "lucide-react";
import type { DocConfigEntry } from "@/modulos/documentos/config";
import type { DocumentoLead } from "@/tipos";

interface DocumentoChecklistRowProps {
  config: DocConfigEntry;
  documento: DocumentoLead | null;
  leadId: string;
  leadNombre?: string;
  showStatusSelector?: boolean;
  onUploadComplete?: (doc: DocumentoLead) => void;
  onStatusChange?: (docId: string, nuevoEstado: string) => void;
  portalMode?: boolean;
}

const estadoConfig: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; dot: string }> = {
  PENDIENTE: { label: "Pendiente", icon: <Clock size={12} />, bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  EN_REVISION: { label: "En Revisión", icon: <AlertCircle size={12} />, bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  APROBADO: { label: "Aprobado", icon: <CheckCircle size={12} />, bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  RECHAZADO: { label: "Rechazado", icon: <XCircle size={12} />, bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

export function DocumentoChecklistRow({
  config,
  documento,
  leadId,
  leadNombre,
  showStatusSelector = false,
  onUploadComplete,
  onStatusChange,
  portalMode = false,
}: DocumentoChecklistRowProps) {
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const subido = !!documento;
  const estado = documento?.estado || "PENDIENTE";
  const estadoCfg = estadoConfig[estado] || estadoConfig.PENDIENTE;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !leadId) return;

    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("archivo", file);
      formData.append("leadId", leadId);
      formData.append("tipo", config.tipo);

      const endpoint = portalMode ? "/api/portal/upload" : "/api/upload";
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (json.success && json.data) {
        const nuevoDoc: DocumentoLead = {
          id: json.data.id,
          leadId,
          leadNombre: leadNombre || "",
          nombre: config.nombre,
          tipo: config.tipo as DocumentoLead["tipo"],
          estado: "PENDIENTE",
          archivoUrl: json.data.archivoUrl,
          creadoEn: new Date(),
        };
        onUploadComplete?.(nuevoDoc);
      }
    } catch {
      // Error silencioso
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDownload = () => {
    if (documento?.archivoUrl) {
      const link = document.createElement("a");
      link.href = documento.archivoUrl;
      link.download = documento.nombre || config.nombre;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
      subido ? "bg-emerald-50/50 border-emerald-200" : "bg-white border-slate-200"
    }`}>
      {/* Icono de estado */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        subido ? "bg-emerald-100" : "bg-slate-100"
      }`}>
        {subido ? (
          <CheckCircle size={16} className="text-emerald-500" />
        ) : (
          <FileText size={16} className="text-slate-400" />
        )}
      </div>

      {/* Nombre y badges */}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-slate-700 truncate">{config.nombre}</div>
        <div className="flex items-center gap-2 mt-0.5">
          {config.obligatorio && (
            <span className="text-[9px] text-red-500 font-semibold">Obligatorio</span>
          )}
          {subido && (
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${estadoCfg.bg} ${estadoCfg.text}`}>
              {estadoCfg.label}
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Selector de estado (solo CRM) */}
        {subido && showStatusSelector && onStatusChange && (
          <select
            value={estado}
            onChange={(e) => onStatusChange(documento!.id, e.target.value)}
            className="text-[9px] font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_REVISION">En Revisión</option>
            <option value="APROBADO">Aprobado</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>
        )}

        {/* Botón Ver */}
        {subido && documento?.archivoUrl && (
          <a
            href={documento.archivoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
          >
            <Eye size={11} /> Ver
          </a>
        )}

        {/* Botón Descargar */}
        {subido && documento?.archivoUrl && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
          >
            <Download size={11} />
          </button>
        )}

        {/* Botón Subir / Reemplazar */}
        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors ${
          subido
            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}>
          {subiendo ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Upload size={12} />
          )}
          {subiendo ? "Subiendo..." : subido ? "Reemplazar" : "Subir"}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="hidden"
            onChange={handleFileSelect}
            disabled={subiendo}
          />
        </label>
      </div>
    </div>
  );
}
