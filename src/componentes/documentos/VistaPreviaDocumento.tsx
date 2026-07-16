"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Image,
  File,
} from "lucide-react";
import { useState } from "react";
import type { DocumentoLead } from "@/tipos";
import { TIPOS_DOCUMENTO_CONFIG } from "@/tipos";

interface VistaPreviaDocumentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documento: DocumentoLead | null;
}

const estadoConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE: { label: "Pendiente", color: "text-slate-600", bg: "bg-slate-100" },
  EN_REVISION: { label: "En Revisión", color: "text-amber-600", bg: "bg-amber-100" },
  APROBADO: { label: "Aprobado", color: "text-emerald-600", bg: "bg-emerald-100" },
  RECHAZADO: { label: "Rechazado", color: "text-red-600", bg: "bg-red-100" },
};

export function VistaPreviaDocumento({
  open,
  onOpenChange,
  documento,
}: VistaPreviaDocumentoProps) {
  const [zoom, setZoom] = useState(100);
  const [rotacion, setRotacion] = useState(0);

  if (!documento) return null;

  const configTipo = TIPOS_DOCUMENTO_CONFIG[documento.tipo];
  const configEstado = estadoConfig[documento.estado];

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handleRotar = () => setRotacion((r) => r + 90);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <FileText size={18} className="text-slate-500" />
              </div>
              <div>
                <DialogTitle className="text-slate-900 text-sm">
                  {documento.nombre}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-400">{configTipo?.label}</span>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${configEstado?.bg} ${configEstado?.color}`}>
                    {configEstado?.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Reducir"
              >
                <ZoomOut size={16} className="text-slate-500" />
              </button>
              <span className="text-[10px] font-semibold text-slate-600 min-w-[40px] text-center">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Ampliar"
              >
                <ZoomIn size={16} className="text-slate-500" />
              </button>
              <button
                onClick={handleRotar}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Rotar"
              >
                <RotateCw size={16} className="text-slate-500" />
              </button>
              <div className="w-px h-5 bg-slate-200 mx-1" />
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Descargar">
                <Download size={16} className="text-slate-500" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Vista previa del documento */}
        <div className="flex-1 overflow-auto bg-slate-100 min-h-[400px] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotacion}deg)`,
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            {documento.archivoUrl ? (
              <img
                src={documento.archivoUrl}
                alt={documento.nombre}
                className="max-w-full max-h-[500px] object-contain"
              />
            ) : (
              <div className="w-[400px] h-[500px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center mb-4">
                  <File size={32} className="text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-600">Vista previa no disponible</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  El archivo aún no ha sido subido al sistema
                </p>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
                  <Image size={14} />
                  <span>{documento.nombre}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información del documento */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-medium">Lead</div>
              <div className="text-[11px] font-semibold text-slate-700">{documento.leadNombre || "-"}</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-medium">Fecha de carga</div>
              <div className="text-[11px] font-semibold text-slate-700">
                {documento.creadoEn.toLocaleDateString("es-CL")}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-medium">Tipo</div>
              <div className="text-[11px] font-semibold text-slate-700">{configTipo?.label}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
