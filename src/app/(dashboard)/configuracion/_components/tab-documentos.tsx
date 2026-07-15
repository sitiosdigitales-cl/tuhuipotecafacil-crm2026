"use client";

import { useState } from "react";
import { FileText, Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "./config-section";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface TipoDocumento {
  id: string;
  nombre: string;
  obligatorio: boolean;
  activo: boolean;
}

interface TabDocumentosProps {
  tiposDocumento: TipoDocumento[];
  setTiposDocumento: (docs: TipoDocumento[]) => void;
}

export function TabDocumentos({ tiposDocumento, setTiposDocumento }: TabDocumentosProps) {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  const handleCrearTipo = () => {
    if (!newDocName.trim()) return;
    const newDoc: TipoDocumento = {
      id: `CUSTOM_${Date.now()}`,
      nombre: newDocName.trim(),
      obligatorio: false,
      activo: true,
    };
    setTiposDocumento([...tiposDocumento, newDoc]);
    toast.success("Tipo de documento creado");
    setShowNewDialog(false);
    setNewDocName("");
  };

  const handleEliminarTipo = () => {
    if (!deleteDocId) return;
    setTiposDocumento(tiposDocumento.filter((d) => d.id !== deleteDocId));
    toast.success("Tipo de documento eliminado");
    setDeleteDocId(null);
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Tipos de Documento" icon={<FileText size={16} className="text-amber-500" />}>
        <p className="text-[11px] text-slate-400 mb-4">
          Configura los tipos de documento que se pueden solicitar a los clientes.
        </p>
        <div className="space-y-2">
          {tiposDocumento.map((doc, idx) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
            >
              <input
                type="text"
                value={doc.nombre}
                onChange={(e) => {
                  const nuevosDocs = [...tiposDocumento];
                  nuevosDocs[idx].nombre = e.target.value;
                  setTiposDocumento(nuevosDocs);
                }}
                className="flex-1 bg-white border border-slate-200/60 rounded-lg px-3 py-1.5 text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400"
              />
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={doc.obligatorio}
                  onChange={(e) => {
                    const nuevosDocs = [...tiposDocumento];
                    nuevosDocs[idx].obligatorio = e.target.checked;
                    setTiposDocumento(nuevosDocs);
                  }}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500/20"
                />
                <span className="text-[10px] text-slate-500">Obligatorio</span>
              </label>
              <button
                onClick={() => {
                  const nuevosDocs = [...tiposDocumento];
                  nuevosDocs[idx].activo = !nuevosDocs[idx].activo;
                  setTiposDocumento(nuevosDocs);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  doc.activo
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {doc.activo ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                onClick={() => setDeleteDocId(doc.id)}
                className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowNewDialog(true)}
          className="flex items-center gap-2 mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 transition-colors"
        >
          <Plus size={14} /> Agregar Tipo
        </button>
      </SectionCard>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nuevo Tipo de Documento</DialogTitle>
            <DialogDescription>Ingresa el nombre del tipo de documento.</DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            placeholder="Nombre del documento"
            autoFocus
            className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400"
            onKeyDown={(e) => { if (e.key === "Enter") handleCrearTipo(); }}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowNewDialog(false); setNewDocName(""); }}>
              Cancelar
            </Button>
            <Button onClick={handleCrearTipo} disabled={!newDocName.trim()}>
              Crear Tipo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDocId !== null}
        onOpenChange={(open) => { if (!open) setDeleteDocId(null); }}
        title="Eliminar Tipo de Documento"
        description="Estas seguro de eliminar este tipo de documento?"
        variant="danger"
        confirmLabel="Eliminar"
        onConfirm={handleEliminarTipo}
      />
    </div>
  );
}
