"use client";

import { useEffect, useRef, useState } from "react";
import { Settings, Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { EtapaPipeline as Etapa } from "@/tipos";
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

interface TabPipelineProps {
  etapas: Etapa[];
  setEtapas: (etapas: Etapa[]) => void;
  cargandoEtapas: boolean;
}

export function TabPipeline({ etapas, setEtapas, cargandoEtapas }: TabPipelineProps) {
  // Ultimo valor que el servidor confirmo. Sirve para no reenviar al salir del
  // campo si el texto no cambio, y para saber que restaurar si el PUT falla.
  const nombresGuardados = useRef<Record<string, string>>({});
  const coloresGuardados = useRef<Record<string, string>>({});

  useEffect(() => {
    etapas.forEach((etapa) => {
      if (nombresGuardados.current[etapa.id] === undefined) {
        nombresGuardados.current[etapa.id] = etapa.nombre;
      }
      if (coloresGuardados.current[etapa.id] === undefined) {
        coloresGuardados.current[etapa.id] = etapa.color;
      }
    });
  }, [etapas]);

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null);

  /**
   * Guarda y confirma. Antes se ignoraba la respuesta, asi que un rechazo del
   * servidor dejaba el cambio pintado en pantalla y desaparecia al recargar.
   * Si falla, se restaura el valor que la base sigue teniendo.
   */
  const actualizarEtapa = async (
    id: string,
    updates: { nombre?: string; color?: string; activa?: boolean },
  ) => {
    const anteriores = etapas;
    try {
      const res = await fetch("/api/pipeline/stages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setEtapas(anteriores);
        toast.error(data?.error || "No se pudo guardar el cambio");
        return false;
      }
      return true;
    } catch {
      setEtapas(anteriores);
      toast.error("No se pudo guardar el cambio");
      return false;
    }
  };

  const handleCrearEtapa = async () => {
    if (!newStageName.trim()) return;
    try {
      const res = await fetch("/api/pipeline/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newStageName.trim(), color: "#64748B" }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setEtapas([...etapas, data.data]);
        toast.success("Etapa creada correctamente");
      } else {
        toast.error(data.error || "Error al crear la etapa");
      }
    } catch {
      toast.error("Error al crear la etapa");
    } finally {
      setShowNewDialog(false);
      setNewStageName("");
    }
  };

  const handleEliminarEtapa = async () => {
    if (!deleteStageId) return;
    try {
      const res = await fetch(`/api/pipeline/stages?id=${deleteStageId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setEtapas(etapas.filter((e) => e.id !== deleteStageId));
        toast.success("Etapa eliminada");
      } else {
        toast.error(data.error || "Error al eliminar la etapa");
      }
    } catch {
      toast.error("Error al eliminar la etapa");
    } finally {
      setDeleteStageId(null);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Etapas del Pipeline" icon={<Settings size={16} className="text-indigo-500" />}>
        <p className="text-[11px] text-slate-400 mb-4">
          Configura las etapas del pipeline de ventas. Los cambios se guardan automaticamente.
        </p>
        {cargandoEtapas ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            <span className="ml-2 text-[11px] text-slate-500">Cargando etapas...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {etapas.map((etapa, idx) => (
              <div
                key={etapa.id}
                className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="text-[10px] font-bold text-slate-400 w-6">{idx + 1}</div>
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: etapa.color }}
                />
                <input
                  type="text"
                  value={etapa.nombre}
                  onChange={(e) => {
                    // Solo estado local: un PUT por tecla permitia que las
                    // respuestas llegaran fuera de orden y ganara una parcial.
                    const nuevasEtapas = etapas.map((actual, posicion) =>
                      posicion === idx ? { ...actual, nombre: e.target.value } : actual,
                    );
                    setEtapas(nuevasEtapas);
                  }}
                  onBlur={(e) => {
                    const nombre = e.target.value.trim();
                    if (!nombre || nombre === nombresGuardados.current[etapa.id]) return;
                    void actualizarEtapa(etapa.id, { nombre }).then((ok) => {
                      if (ok) nombresGuardados.current[etapa.id] = nombre;
                    });
                  }}
                  className="flex-1 bg-white border border-slate-200/60 rounded-lg px-3 py-1.5 text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400"
                />
                <input
                  type="color"
                  value={etapa.color}
                  onChange={(e) => {
                    const nuevasEtapas = etapas.map((actual, posicion) =>
                      posicion === idx ? { ...actual, color: e.target.value } : actual,
                    );
                    setEtapas(nuevasEtapas);
                  }}
                  onBlur={(e) => {
                    // El selector de color dispara onChange en cada paso del
                    // arrastre: se guarda al soltarlo, no en cada tono.
                    const color = e.target.value;
                    if (color === coloresGuardados.current[etapa.id]) return;
                    void actualizarEtapa(etapa.id, { color }).then((ok) => {
                      if (ok) coloresGuardados.current[etapa.id] = color;
                    });
                  }}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0"
                />
                <button
                  onClick={() => {
                    const activa = !etapa.activa;
                    setEtapas(
                      etapas.map((actual, posicion) =>
                        posicion === idx ? { ...actual, activa } : actual,
                      ),
                    );
                    void actualizarEtapa(etapa.id, { activa });
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    etapa.activa
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {etapa.activa ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => setDeleteStageId(etapa.id)}
                  className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowNewDialog(true)}
          className="flex items-center gap-2 mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 transition-colors"
        >
          <Plus size={14} /> Agregar Etapa
        </button>
      </SectionCard>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nueva Etapa del Pipeline</DialogTitle>
            <DialogDescription>Ingresa el nombre de la nueva etapa.</DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            placeholder="Nombre de la etapa"
            autoFocus
            className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400"
            onKeyDown={(e) => { if (e.key === "Enter") handleCrearEtapa(); }}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowNewDialog(false); setNewStageName(""); }}>
              Cancelar
            </Button>
            <Button onClick={handleCrearEtapa} disabled={!newStageName.trim()}>
              Crear Etapa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteStageId !== null}
        onOpenChange={(open) => { if (!open) setDeleteStageId(null); }}
        title="Eliminar Etapa"
        description="Estas seguro de eliminar esta etapa? Esta accion no se puede deshacer."
        variant="danger"
        confirmLabel="Eliminar"
        onConfirm={handleEliminarEtapa}
      />
    </div>
  );
}
