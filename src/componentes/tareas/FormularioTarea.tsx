"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
  MessageSquare,
  Phone,
  Mail,
  Zap,
  ChevronDown,
} from "lucide-react";
import { ESTADOS_TAREA_CONFIG, TIPOS_TAREA_CONFIG } from "@/tipos";
import type { Tarea, EstadoTarea, TipoTarea, Prioridad } from "@/tipos";
import { useLeads } from "@/lib/contexts/LeadContext";
import { useUser } from "@/lib/contexts/UserContext";

interface FormularioTareaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarea?: Tarea | null;
  onSubmit: (datos: Partial<Tarea>) => void;
}

const prioridades: { value: Prioridad; label: string; color: string; dot: string }[] = [
  { value: "BAJA", label: "Baja", color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  { value: "MEDIA", label: "Media", color: "bg-blue-50 text-blue-600 border-blue-200", dot: "bg-blue-500" },
  { value: "ALTA", label: "Alta", color: "bg-orange-50 text-orange-600 border-orange-200", dot: "bg-orange-500" },
  { value: "URGENTE", label: "Urgente", color: "bg-red-50 text-red-600 border-red-200", dot: "bg-red-500" },
];

const TIPO_ICONOS: Record<string, typeof ClipboardList> = {
  SEGUIMIENTO: MessageSquare,
  DOCUMENTACION: FileText,
  REUNION: Calendar,
  LLAMADA: Phone,
  EMAIL: Mail,
  OTRO: Zap,
};

export function FormularioTarea({ open, onOpenChange, tarea, onSubmit }: FormularioTareaProps) {
  const esEdicion = !!tarea;
  const { leads } = useLeads();
  const { usuarios } = useUser();
  const ejecutivos = usuarios.filter((u) => u.estado === "ACTIVO" && u.rol !== "SUPER_ADMIN");

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitulo(tarea.titulo);
      setDescripcion(tarea.descripcion || "");
      setTipo(tarea.tipo);
      setPrioridad(tarea.prioridad);
      setEstado(tarea.estado);
      setLeadId(tarea.leadId || "");
      setEjecutivoId(tarea.asignadoA || "");
      setFechaVencimiento(tarea.fechaVencimiento ? new Date(tarea.fechaVencimiento).toISOString().slice(0, 16) : "");
      setRecordatorio(tarea.recordatorio ? new Date(tarea.recordatorio).toISOString().slice(0, 16) : "");
      setDuracionEstimada(tarea.duracionEstimada?.toString() || "");
      setEtiquetasInput(tarea.etiquetas?.join(", ") || "");
    } else {
      setTitulo(""); setDescripcion(""); setTipo("SEGUIMIENTO"); setPrioridad("MEDIA");
      setEstado("PENDIENTE"); setLeadId(""); setEjecutivoId("");
      setFechaVencimiento(""); setRecordatorio(""); setDuracionEstimada(""); setEtiquetasInput("");
    }
    setErrores({});
  }, [tarea, open]);

  const validar = () => {
    const nuevosErrores: Record<string, string> = {};
    if (!titulo.trim()) nuevosErrores.titulo = "El título es obligatorio";
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
      tipo, prioridad, estado,
      leadId: leadId || undefined,
      leadNombre: leadSeleccionado ? `${leadSeleccionado.nombre} ${leadSeleccionado.apellido}` : undefined,
      asignadoA: ejecutivoId || undefined,
      nombreEjecutivo: ejecutivoSeleccionado ? `${ejecutivoSeleccionado.nombre} ${ejecutivoSeleccionado.apellido}` : undefined,
      fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : undefined,
      recordatorio: recordatorio ? new Date(recordatorio) : undefined,
      duracionEstimada: duracionEstimada ? parseInt(duracionEstimada) : undefined,
      etiquetas: etiquetasInput ? etiquetasInput.split(",").map((e) => e.trim()).filter(Boolean) : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg p-0">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                <ClipboardList size={20} className="text-white" />
              </div>
              <div>
                <SheetTitle className="text-base text-white">
                  {esEdicion ? "Editar Tarea" : "Nueva Tarea"}
                </SheetTitle>
                <SheetDescription className="text-[11px] text-blue-100">
                  {esEdicion ? "Modifica los detalles de la tarea" : "Completa los campos para crear una nueva tarea"}
                </SheetDescription>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5 overflow-y-auto max-h-[calc(100vh-160px)]">
          {/* Información Básica */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Información Básica</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-700">Título de la tarea *</Label>
              <Input
                value={titulo}
                onChange={(e) => { setTitulo(e.target.value); if (errores.titulo) setErrores((p) => ({ ...p, titulo: "" })); }}
                placeholder="Ej: Llamar al cliente para seguimiento..."
                className={`h-10 text-[12px] rounded-xl ${errores.titulo ? "border-red-400 bg-red-50/50" : titulo ? "border-emerald-200 bg-emerald-50/30" : ""}`}
              />
              {errores.titulo && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {errores.titulo}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-700">Descripción</Label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalles, contexto o instrucciones..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Clasificación */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clasificación</span>
            </div>

            {/* Tipo como cards */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-700">Tipo</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(TIPOS_TAREA_CONFIG).map(([k, v]) => {
                  const Icon = TIPO_ICONOS[k] || Zap;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setTipo(k as TipoTarea)}
                      className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-[9px] font-semibold transition-all ${
                        tipo === k
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={14} />
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prioridad como pills */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-700">Prioridad</Label>
              <div className="flex gap-1.5">
                {prioridades.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPrioridad(p.value)}
                    className={`flex-1 h-9 rounded-xl text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                      prioridad === p.value ? `${p.color} ring-1 ring-current/20` : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Estado (solo en edición) */}
            {esEdicion && (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700">Estado</Label>
                <div className="flex gap-1.5">
                  {Object.entries(ESTADOS_TAREA_CONFIG).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setEstado(k as EstadoTarea)}
                      className={`flex-1 h-9 rounded-xl text-[10px] font-bold border transition-all ${
                        estado === k ? "text-white border-transparent" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                      style={estado === k ? { backgroundColor: v.color, borderColor: v.color } : undefined}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Asignación */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Asignación</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700">Lead asociado</Label>
                <div className="relative">
                  <select
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none"
                  >
                    <option value="">Sin lead asociado</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>{l.nombre} {l.apellido}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700">Asignado a</Label>
                <div className="relative">
                  <select
                    value={ejecutivoId}
                    onChange={(e) => setEjecutivoId(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none"
                  >
                    <option value="">Sin asignar</option>
                    {ejecutivos.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Programación */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Programación</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar size={10} className="text-slate-400" /> Vencimiento
                </Label>
                <Input type="datetime-local" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} className="h-10 text-[12px] rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Clock size={10} className="text-slate-400" /> Duración
                </Label>
                <div className="relative">
                  <Input type="number" value={duracionEstimada} onChange={(e) => setDuracionEstimada(e.target.value)} placeholder="30" min="0" className="h-10 text-[12px] pr-12 rounded-xl" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">min</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                <Clock size={10} className="text-slate-400" /> Recordatorio
              </Label>
              <Input type="datetime-local" value={recordatorio} onChange={(e) => setRecordatorio(e.target.value)} className="h-10 text-[12px] rounded-xl" />
            </div>
          </div>

          {/* Etiquetas */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <Tag size={10} className="text-slate-400" /> Etiquetas
            </Label>
            <Input value={etiquetasInput} onChange={(e) => setEtiquetasInput(e.target.value)} placeholder="Separadas por coma: urgente, seguimiento, banco" className="h-10 text-[12px] rounded-xl" />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
            <CheckCircle size={14} />
            {esEdicion ? "Guardar Cambios" : "Crear Tarea"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
