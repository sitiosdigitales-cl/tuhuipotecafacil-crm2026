"use client";

import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { TipoDocumento, DocumentoLead } from "@/tipos";
import { TIPOS_DOCUMENTO_CONFIG } from "@/tipos";

interface SubirDocumentoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadNombre?: string;
  onUpload: (doc: Omit<DocumentoLead, "id" | "creadoEn">) => void;
}

interface ArchivoSubido {
  file: File;
  preview?: string;
  estado: "subiendo" | "listo" | "error";
  progreso?: number;
}

export function SubirDocumento({
  open,
  onOpenChange,
  leadId,
  leadNombre,
  onUpload,
}: SubirDocumentoProps) {
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("CEDULA_IDENTIDAD");
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const agregarArchivos = (files: File[]) => {
    const nuevosArchivos: ArchivoSubido[] = files.map((file) => ({
      file,
      estado: "listo" as const,
    }));
    setArchivos((prev) => [...prev, ...nuevosArchivos]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(false);

    const files = Array.from(e.dataTransfer.files);
    agregarArchivos(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      agregarArchivos(files);
    }
  };

  const removerArchivo = (index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubir = async () => {
    setSubiendo(true);

    for (let i = 0; i < archivos.length; i++) {
      setArchivos((prev) =>
        prev.map((a, idx) =>
          idx === i ? { ...a, estado: "subiendo" as const, progreso: 0 } : a
        )
      );

      try {
        // Subir archivo a Supabase Storage
        const formData = new FormData();
        formData.append("archivo", archivos[i].file);
        formData.append("leadId", leadId);
        formData.append("tipo", tipoDocumento);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();

        if (json.success && json.data) {
          setArchivos((prev) =>
            prev.map((a, idx) =>
              idx === i ? { ...a, estado: "listo" as const, progreso: 100 } : a
            )
          );

          onUpload({
            id: json.data.id,
            leadId,
            leadNombre,
            nombre: archivos[i].file.name,
            tipo: tipoDocumento,
            estado: "PENDIENTE",
            archivoUrl: json.data.archivoUrl,
          });
        } else {
          setArchivos((prev) =>
            prev.map((a, idx) =>
              idx === i ? { ...a, estado: "error" as const } : a
            )
          );
        }
      } catch {
        setArchivos((prev) =>
          prev.map((a, idx) =>
            idx === i ? { ...a, estado: "error" as const } : a
          )
        );
      }
    }

    setSubiendo(false);
    setArchivos([]);
    onOpenChange(false);
  };

  const formatTamano = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0">
        <DialogHeader className="p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Upload size={18} className="text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-slate-900">Subir Documentos</DialogTitle>
              <DialogDescription className="text-slate-500">
                {leadNombre ? `Para ${leadNombre}` : "Adjuntar archivos"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 space-y-4">
          {/* Selector de tipo */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">
              Tipo de documento
            </label>
            <select
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
            >
              {Object.entries(TIPOS_DOCUMENTO_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Zona de drop */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              arrastrando
                ? "border-blue-400 bg-blue-50/50"
                : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                arrastrando ? "bg-blue-100" : "bg-slate-100"
              }`}>
                <Upload size={20} className={arrastrando ? "text-blue-500" : "text-slate-400"} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-700">
                  {arrastrando ? "Suelta los archivos aquí" : "Arrastra archivos o haz clic para seleccionar"}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  PDF, JPG, PNG, DOC - Máx. 10MB por archivo
                </p>
              </div>
            </div>
          </div>

          {/* Lista de archivos */}
          {archivos.length > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {archivos.map((archivo, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                >
                  <div className="w-9 h-9 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                    <FileText size={16} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-slate-800 truncate">
                      {archivo.file.name}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {formatTamano(archivo.file.size)}
                    </div>
                    {archivo.estado === "subiendo" && (
                      <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${archivo.progreso || 0}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {archivo.estado === "subiendo" && (
                      <Loader2 size={14} className="text-blue-500 animate-spin" />
                    )}
                    {archivo.estado === "listo" && archivo.progreso === 100 && (
                      <CheckCircle size={14} className="text-emerald-500" />
                    )}
                    {archivo.estado === "error" && (
                      <AlertCircle size={14} className="text-red-500" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removerArchivo(index);
                      }}
                      className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      <X size={12} className="text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubir}
            disabled={archivos.length === 0 || subiendo}
            className="flex items-center gap-1.5 px-5 py-2.5 gradient-primary text-white rounded-xl text-[11px] font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {subiendo ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload size={14} />
                Subir {archivos.length > 0 ? `(${archivos.length})` : ""}
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
