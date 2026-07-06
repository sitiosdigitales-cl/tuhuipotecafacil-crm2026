"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ClipboardList,
  Calendar,
  Clock,
  Tag,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { USUARIOS_MOCK, generarLeads } from "@/datos/mock";
import { ESTADOS_TAREA_CONFIG, TIPOS_TAREA_CONFIG } from "@/tipos";
import type { Tarea, EstadoTarea, TipoTarea, Prioridad } from "@/tipos";

interface FormularioTareaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarea?: Tarea | null;
  onSubmit: (datos: Partial<Tarea>) => void;
}

const prioridades: { value: Prioridad; label: string; color: string }[] = [
  { value: "BAJA", label: "Baja", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "MEDIA", label: "Media", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { value: "ALTA", label: "Alta", color: "bg-orange-50 text-orange-600 border-orange-200" },
  { value: "URGENTE", label: "Urgente", color: "bg-red-50 text-red-600 border-red-200" },
];

export function FormularioTarea({
  open,
  onOpenChange,
  tarea,
  onSubmit,
}: FormularioTareaProps) {
  const esEdicion = !!tarea;
  const leads = generarLeads();
  const ejecutivos = USUARIOS_MOCK.filter(
    (u) => u.estado === "ACTIVO" && u.rol !== "SUPER_ADMIN"
  );

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<TipoTarea>("SEGUIMIENTO");
  const [prioridad, setPrioridad] = useState<Prioridad>("MEDIA");
  const [estado, setEstado] = useState<EstadoTarea>("PENDIENTE");
  const [leadId, setLeadId] = useState("");
  const [ejecutivoId, setEjecutivoId] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [recordatorio, setRecordatorio] = useState("");
  const [duracionEstimada, setDuracionEstimada] = useState("");
  const [etiquetasInput, setEtiquetasInput] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tarea) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Inicializacion intencional del formulario al recibir prop
      setTitulo(tarea.titulo);
      setDescripcion(tarea.descripcion || "");
      setTipo(tarea.tipo);
      setPrioridad(tarea.prioridad);
      setEstado(tarea.estado);
      setLeadId(tarea.leadId || "");
      setEjecutivoId(tarea.asignadoA || "");
      setFechaVencimiento(
        tarea.fechaVencimiento
          ? new Date(tarea.fechaVencimiento).toISOString().slice(0, 16)
          : ""
      );
      setRecordatorio(
        tarea.recordatorio
          ? new Date(tarea.recordatorio).toISOString().slice(0, 16)
          : ""
      );
      setDuracionEstimada(tarea.duracionEstimada?.toString() || "");
      setEtiquetasInput(tarea.etiquetas?.join(", ") || "");
    } else {
      setTitulo("");
      setDescripcion("");
      setTipo("SEGUIMIENTO");
      setPrioridad("MEDIA");
      setEstado("PENDIENTE");
      setLeadId("");
      setEjecutivoId("");
      setFechaVencimiento("");
      setRecordatorio("");
      setDuracionEstimada("");
      setEtiquetasInput("");
    }
    setErrores({});
  }, [tarea, open]);

  const validar = () => {
    const nuevosErrores: Record<string, string> = {};
    if (!titulo.trim()) {
      nuevosErrores.titulo = "El título es obligatorio";
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;

    const leadSeleccionado = leads.find((l) => l.id === leadId);
    const ejecutivoSeleccionado = ejecutivos.find((u) => u.id === ejecutivoId);

    onSubmit({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      tipo,
      prioridad,
      estado,
      leadId: leadId || undefined,
      leadNombre: leadSeleccionado
        ? `${leadSeleccionado.nombre} ${leadSeleccionado.apellido}`
        : undefined,
      asignadoA: ejecutivoId || undefined,
      nombreEjecutivo: ejecutivoSeleccionado
        ? `${ejecutivoSeleccionado.nombre} ${ejecutivoSeleccionado.apellido}`
        : undefined,
      fechaVencimiento: fechaVencimiento
        ? new Date(fechaVencimiento)
        : undefined,
      recordatorio: recordatorio ? new Date(recordatorio) : undefined,
      duracionEstimada: duracionEstimada
        ? parseInt(duracionEstimada)
        : undefined,
      etiquetas: etiquetasInput
        ? etiquetasInput.split(",").map((e) => e.trim()).filter(Boolean)
        : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <ClipboardList size={20} className="text-white" />
            </div>
            <div>
              <SheetTitle className="text-base">
                {esEdicion ? "Editar Tarea" : "Nueva Tarea"}
              </SheetTitle>
              <SheetDescription className="text-[11px]">
                {esEdicion
                  ? "Modifica los detalles de la tarea"
                  : "Completa los campos para crear una nueva tarea"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 px-4 overflow-y-auto max-h-[calc(100vh-180px)]"
        >
          {/* Sección: Información básica */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText size={13} className="text-slate-400" />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Información Básica
              </span>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                Título de la tarea *
              </Label>
              <Input
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  if (errores.titulo) setErrores((prev) => ({ ...prev, titulo: "" }));
                }}
                placeholder="Ej: Llamar al cliente para seguimiento..."
                className={`h-10 text-[12px] ${errores.titulo ? "border-red-300 focus:ring-red-500/10" : ""}`}
                required
              />
              {errores.titulo && (
                <p className="text-[10px] text-red-500 flex items-center gap-1">
                  <AlertCircle size={10} /> {errores.titulo}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold text-slate-700">
                Descripción
              </Label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Agrega detalles, contexto o instrucciones..."
                rows={3}
                className="w-full px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 resize-none transition-all"
              />
            </div>
          </div>

          {/* Sección: Clasificación */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Tag size={13} className="text-slate-400" />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Clasificación
              </span>
            </div>

            {/* Tipo y Prioridad */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700">
                  Tipo
                </Label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoTarea)}
                  className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                >
                  {Object.entries(TIPOS_TAREA_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700">
                  Prioridad
                </Label>
                <div className="flex gap-1.5">
                  {prioridades.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPrioridad(p.value)}
                      className={`flex-1 h-10 rounded-xl text-[10px] font-bold border transition-all ${
                        prioridad === p.value
                          ? `${p.color} ring-1 ring-current/20`
                          : "bg-slate-50 text-slate-400 border-slate-200/60 hover:bg-slate-100"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Estado (solo en edición) */}
            {esEdicion && (
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700">
                  Estado
                </Label>
                <div className="flex gap-2">
                  {Object.entries(ESTADOS_TAREA_CONFIG).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setEstado(k as EstadoTarea)}
                      className={`flex-1 h-9 rounded-xl text-[10px] font-bold border transition-all ${
                        estado === k
                          ? "text-white border-transparent"
                          : "bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100"
                      }`}
                      style={
                        estado === k
                          ? { backgroundColor: v.color, borderColor: v.color }
                          : undefined
                      }
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sección: Asignación */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User size={13} className="text-slate-400" />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Asignación
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Lead */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700">
                  Lead asociado
                </Label>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                >
                  <option value="">Sin lead asociado</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nombre} {l.apellido}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ejecutivo */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700">
                  Asignado a
                </Label>
                <select
                  value={ejecutivoId}
                  onChange={(e) => setEjecutivoId(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                >
                  <option value="">Sin asignar</option>
                  {ejecutivos.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} {u.apellido}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Programación */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Calendar size={13} className="text-slate-400" />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Programación
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar size={10} /> Fecha de vencimiento
                </Label>
                <Input
                  type="datetime-local"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className="h-10 text-[12px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Clock size={10} /> Duración estimada
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={duracionEstimada}
                    onChange={(e) => setDuracionEstimada(e.target.value)}
                    placeholder="30"
                    min="0"
                    className="h-10 text-[12px] pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">
                    min
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                <Clock size={10} /> Recordatorio
              </Label>
              <Input
                type="datetime-local"
                value={recordatorio}
                onChange={(e) => setRecordatorio(e.target.value)}
                className="h-10 text-[12px]"
              />
            </div>
          </div>

          {/* Sección: Etiquetas */}
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <Tag size={10} /> Etiquetas
            </Label>
            <Input
              value={etiquetasInput}
              onChange={(e) => setEtiquetasInput(e.target.value)}
              placeholder="Separadas por coma: urgente, seguimiento, banco"
              className="h-10 text-[12px]"
            />
            <p className="text-[9px] text-slate-400">
              Separa las etiquetas con comas para organizar tus tareas
            </p>
          </div>
        </form>

        <SheetFooter className="pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            size="default"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            size="default"
            onClick={handleSubmit}
            className="gap-2 shadow-lg shadow-blue-600/20"
          >
            <CheckCircle size={14} />
            {esEdicion ? "Guardar Cambios" : "Crear Tarea"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
