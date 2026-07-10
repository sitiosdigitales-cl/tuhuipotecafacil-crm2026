"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Play,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Tag,
  Send,
  History,
  MessageSquare,
  Timer,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/componentes/ui/confirm-dialog";
import { ESTADOS_TAREA_CONFIG, TIPOS_TAREA_CONFIG } from "@/tipos";
import type { Tarea, EstadoTarea } from "@/tipos";

const prioridadStyles: Record<string, { label: string; class: string }> = {
  BAJA: { label: "Baja", class: "bg-slate-100 text-slate-600" },
  MEDIA: { label: "Media", class: "bg-blue-50 text-blue-600 border border-blue-100" },
  ALTA: { label: "Alta", class: "bg-orange-50 text-orange-600 border border-orange-100" },
  URGENTE: { label: "Urgente", class: "bg-red-50 text-red-600 border border-red-100" },
};

const estadoIcono: Record<EstadoTarea, React.ReactNode> = {
  PENDIENTE: <Clock size={14} className="text-amber-500" />,
  EN_PROGRESO: <Play size={14} className="text-blue-500" />,
  COMPLETADA: <CheckCircle size={14} className="text-emerald-500" />,
  VENCIDA: <AlertTriangle size={14} className="text-red-500" />,
};

export default function TareaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [tarea, setTarea] = useState<Tarea | null>(null);
  const [cargando, setCargando] = useState(true);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [eliminarOpen, setEliminarOpen] = useState(false);

  useEffect(() => {
    async function cargarTarea() {
      try {
        const res = await fetch(`/api/tareas/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setTarea({
            ...json.data,
            fechaVencimiento: json.data.fechaVencimiento ? new Date(json.data.fechaVencimiento) : undefined,
            creadoEn: json.data.creadoEn ? new Date(json.data.creadoEn) : new Date(),
            comentarios: json.data.comentarios || [],
            historial: json.data.historial || [],
            etiquetas: json.data.etiquetas ? (typeof json.data.etiquetas === "string" ? json.data.etiquetas.split(",") : json.data.etiquetas) : [],
          });
        }
      } catch {
        setTarea(null);
      } finally {
        setCargando(false);
      }
    }
    cargarTarea();
  }, [id]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-slate-500">Cargando tarea...</span>
      </div>
    );
  }

  if (!tarea) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <FileText size={24} className="text-slate-300" />
        </div>
        <h2 className="text-sm font-bold text-slate-600 mb-1">
          Tarea no encontrada
        </h2>
        <p className="text-[11px] text-slate-400 mb-4">
          La tarea que buscas no existe o fue eliminada.
        </p>
        <Button onClick={() => router.push("/tareas")} size="sm">
          Volver a Tareas
        </Button>
      </div>
    );
  }

  const cambiarEstado = async (nuevoEstado: EstadoTarea) => {
    if (!tarea) return;
    try {
      await fetch(`/api/tareas/${tarea.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      setTarea((prev) => prev ? { ...prev, estado: nuevoEstado } : prev);
    } catch {
      // Error silencioso
    }
  };

  const agregarComentario = async () => {
    if (!nuevoComentario.trim() || !tarea) return;
    const comentario = {
      id: `c-${Date.now()}`,
      autor: "Usuario Actual",
      contenido: nuevoComentario.trim(),
      creadoEn: new Date(),
    };
    try {
      await fetch(`/api/tareas/${tarea.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comentarios: [...(tarea.comentarios || []), comentario],
        }),
      });
      setTarea((prev) => prev ? {
        ...prev,
        comentarios: [...(prev.comentarios || []), comentario],
      } : prev);
      setNuevoComentario("");
    } catch {
      // Error silencioso
    }
  };

  const handleEliminar = async () => {
    if (!tarea) return;
    try {
      await fetch(`/api/tareas/${tarea.id}`, { method: "DELETE" });
      router.push("/tareas");
    } catch {
      // Error silencioso
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/tareas")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              {tarea.titulo}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${ESTADOS_TAREA_CONFIG[tarea.estado].color}15`,
                  color: ESTADOS_TAREA_CONFIG[tarea.estado].color,
                }}
              >
                {ESTADOS_TAREA_CONFIG[tarea.estado].label}
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${prioridadStyles[tarea.prioridad].class}`}
              >
                {prioridadStyles[tarea.prioridad].label}
              </span>
              <span
                className="text-[9px] font-semibold px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${TIPOS_TAREA_CONFIG[tarea.tipo].color}15`,
                  color: TIPOS_TAREA_CONFIG[tarea.tipo].color,
                }}
              >
                {TIPOS_TAREA_CONFIG[tarea.tipo].label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tarea.estado !== "COMPLETADA" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => cambiarEstado("COMPLETADA")}
              className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              <CheckCircle size={13} /> Completar
            </Button>
          )}
          {tarea.estado === "COMPLETADA" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => cambiarEstado("PENDIENTE")}
              className="gap-1.5"
            >
              <Play size={13} /> Reabrir
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEliminarOpen(true)}
            className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50"
          >
            <Trash2 size={13} /> Eliminar
          </Button>
        </div>
      </div>

      {/* Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna izquierda - Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Lead asociado */}
          {tarea.leadNombre && (
            <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
              <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <User size={13} className="text-blue-500" />
                Lead Asociado
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-[11px] font-bold">
                  {tarea.leadNombre
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="text-[12px] font-bold text-slate-800">
                    {tarea.leadNombre}
                  </div>
                  <button
                    onClick={() =>
                      router.push(`/clientes/${tarea.leadId}`)
                    }
                    className="text-[10px] text-blue-500 hover:underline"
                  >
                    Ver perfil completo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Descripción */}
          {tarea.descripcion && (
            <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
              <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <FileText size={13} className="text-slate-400" />
                Descripción
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {tarea.descripcion}
              </p>
            </div>
          )}

          {/* Comentarios */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
            <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <MessageSquare size={13} className="text-purple-500" />
              Comentarios ({tarea.comentarios.length})
            </h3>
            <div className="space-y-3 mb-4">
              {tarea.comentarios.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-4">
                  Sin comentarios aún
                </p>
              ) : (
                tarea.comentarios.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0 mt-0.5">
                      {c.autor
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-slate-700">
                          {c.autor}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(c.creadoEn).toLocaleDateString("es-CL")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {c.contenido}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Input comentario */}
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && agregarComentario()}
                placeholder="Escribe un comentario..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
              />
              <Button
                size="sm"
                onClick={agregarComentario}
                disabled={!nuevoComentario.trim()}
              >
                <Send size={13} />
              </Button>
            </div>
          </div>
        </div>

        {/* Columna derecha - Detalles + Historial */}
        <div className="space-y-4">
          {/* Detalles */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
            <h3 className="text-xs font-bold text-slate-800 mb-3">
              Detalles
            </h3>
            <div className="space-y-3">
              <DetalleRow
                icon={<User size={12} className="text-slate-400" />}
                label="Asignado a"
                value={
                  tarea.nombreEjecutivo || "Sin asignar"
                }
              />
              <DetalleRow
                icon={<Calendar size={12} className="text-slate-400" />}
                label="Vencimiento"
                value={
                  tarea.fechaVencimiento
                    ? new Date(tarea.fechaVencimiento).toLocaleDateString(
                        "es-CL"
                      )
                    : "Sin fecha"
                }
                highlighted={
                  tarea.fechaVencimiento &&
                  new Date(tarea.fechaVencimiento) < new Date() &&
                  tarea.estado !== "COMPLETADA"
                }
              />
              <DetalleRow
                icon={<Timer size={12} className="text-slate-400" />}
                label="Duración estimada"
                value={
                  tarea.duracionEstimada
                    ? `${tarea.duracionEstimada} min`
                    : "No definida"
                }
              />
              <DetalleRow
                icon={<Calendar size={12} className="text-slate-400" />}
                label="Creado"
                value={new Date(tarea.creadoEn).toLocaleDateString("es-CL")}
              />
              {tarea.recordatorio && (
                <DetalleRow
                  icon={<Clock size={12} className="text-amber-400" />}
                  label="Recordatorio"
                  value={new Date(tarea.recordatorio).toLocaleString("es-CL")}
                />
              )}
              {tarea.etiquetas && tarea.etiquetas.length > 0 && (
                <div className="flex items-start gap-2">
                  <Tag size={12} className="text-slate-400 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {tarea.etiquetas.map((et) => (
                      <span
                        key={et}
                        className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                      >
                        {et}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Historial */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
            <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <History size={13} className="text-indigo-500" />
              Historial
            </h3>
            <div className="space-y-3">
              {tarea.historial.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-4">
                  Sin historial
                </p>
              ) : (
                [...tarea.historial]
                  .reverse()
                  .map((h, idx) => (
                    <div key={h.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            idx === 0 ? "bg-blue-500" : "bg-slate-300"
                          }`}
                        />
                        {idx < tarea.historial.length - 1 && (
                          <div className="w-px flex-1 bg-slate-200 mt-1" />
                        )}
                      </div>
                      <div className="pb-3">
                        <p className="text-[10px] font-semibold text-slate-700">
                          {h.accion}
                        </p>
                        <p className="text-[9px] text-slate-400">
                          {h.usuario} •{" "}
                          {new Date(h.fecha).toLocaleDateString("es-CL")}
                        </p>
                        {h.detalle && (
                          <p className="text-[9px] text-slate-500 mt-0.5 italic">
                            {h.detalle}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Eliminar */}
      <ConfirmDialog
        open={eliminarOpen}
        onOpenChange={setEliminarOpen}
        title="Eliminar Tarea"
        description={`¿Eliminar "${tarea.titulo}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleEliminar}
      />
    </div>
  );
}

function DetalleRow({
  icon,
  label,
  value,
  highlighted,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="flex-1">
        <span className="text-[9px] text-slate-400">{label}</span>
        <div
          className={`text-[11px] font-medium ${
            highlighted ? "text-red-500" : "text-slate-700"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
