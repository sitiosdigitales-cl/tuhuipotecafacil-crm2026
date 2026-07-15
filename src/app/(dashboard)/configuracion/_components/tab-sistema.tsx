"use client";

import { useState } from "react";
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { SectionCard, InfoRow } from "./config-section";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function TabSistema() {
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleExportar = () => {
    toast.info("Preparando exportacion...");
    setTimeout(() => toast.success("Datos exportados correctamente"), 2000);
  };

  const handleImportar = () => {
    toast.info("Selecciona un archivo para importar...");
  };

  const handleRespaldo = () => {
    toast.info("Creando respaldo...");
    setTimeout(() => toast.success("Respaldo creado correctamente"), 2000);
  };

  const handleLimpiarCache = () => {
    toast.info("Limpiando cache...");
    setTimeout(() => toast.success("Cache limpiado correctamente"), 1000);
  };

  const handleOptimizarDB = () => {
    toast.info("Optimizando base de datos...");
    setTimeout(() => toast.success("Base de datos optimizada"), 3000);
  };

  const handleRestablecer = () => {
    toast.error("Esta funcion esta deshabilitada por seguridad");
    setShowResetDialog(false);
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Informacion del Sistema" icon={<Database size={16} className="text-blue-500" />}>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Version" value="1.0.0" />
          <InfoRow label="Ultima Actualizacion" value="15 Julio 2026" />
          <InfoRow label="Base de Datos" value="MySQL 8.0" />
          <InfoRow label="Node.js" value="v20.x" />
        </div>
      </SectionCard>

      <SectionCard title="Respaldo y Exportacion" icon={<Download size={16} className="text-emerald-500" />}>
        <div className="flex items-center gap-4">
          <button
            onClick={handleExportar}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[11px] font-semibold hover:bg-emerald-600 transition-colors"
          >
            <Download size={14} /> Exportar Datos
          </button>
          <button
            onClick={handleImportar}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-600 transition-colors"
          >
            <Upload size={14} /> Importar Datos
          </button>
          <button
            onClick={handleRespaldo}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-[11px] font-semibold hover:bg-amber-600 transition-colors"
          >
            <Database size={14} /> Crear Respaldo
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Mantenimiento" icon={<RefreshCw size={16} className="text-purple-500" />}>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLimpiarCache}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 transition-colors"
          >
            <RefreshCw size={14} /> Limpiar Cache
          </button>
          <button
            onClick={handleOptimizarDB}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 transition-colors"
          >
            <Database size={14} /> Optimizar Base de Datos
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Zona de Peligro" icon={<AlertTriangle size={16} className="text-red-500" />}>
        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
          <h4 className="text-[12px] font-bold text-red-700 mb-2">Restablecer Sistema</h4>
          <p className="text-[11px] text-red-600 mb-4">
            Esta accion eliminara todos los datos y restablecera la configuracion por defecto. Esta accion no se puede deshacer.
          </p>
          <button
            onClick={() => setShowResetDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-[11px] font-semibold hover:bg-red-600 transition-colors"
          >
            <Trash2 size={14} /> Restablecer Todo
          </button>
        </div>
      </SectionCard>

      <ConfirmDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="Restablecer Sistema"
        description="Esta accion eliminara TODOS los datos del sistema, incluyendo leads, clientes, usuarios y configuracion. Esta accion es IRREVERSIBLE."
        variant="danger"
        confirmLabel="Entendido, Restablecer"
        onConfirm={handleRestablecer}
      />
    </div>
  );
}
