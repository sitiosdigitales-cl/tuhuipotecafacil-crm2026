"use client";

import { useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  Clock,
  Play,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  Eye,
  Pencil,
  MessageSquare,
  Paperclip,
  Timer,
} from "lucide-react";
import { ESTADOS_TAREA_CONFIG, TIPOS_TAREA_CONFIG } from "@/tipos";
import type { Tarea, EstadoTarea } from "@/tipos";

interface TableroKanbanProps {
  tareas: Tarea[];
  onMoverTarea: (tareaId: string, nuevoEstado: EstadoTarea) => void;
  onVerTarea: (tarea: Tarea) => void;
  onEditarTarea: (tarea: Tarea) => void;
}

const COLUMNAS: { estado: EstadoTarea; icono: React.ReactNode; color: string }[] = [
  { estado: "PENDIENTE", icono: <Clock size={14} />, color: "#F59E0B" },
  { estado: "EN_PROGRESO", icono: <Play size={14} />, color: "#3B82F6" },
  { estado: "COMPLETADA", icono: <CheckCircle size={14} />, color: "#10B981" },
  { estado: "VENCIDA", icono: <AlertTriangle size={14} />, color: "#EF4444" },
];

const prioridadStyles: Record<string, { bg: string; text: string; dot: string }> = {
  BAJA: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  MEDIA: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
  ALTA: { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500" },
  URGENTE: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

export function TableroKanban({
  tareas,
  onMoverTarea,
  onVerTarea,
  onEditarTarea,
}: TableroKanbanProps) {
  const tareasPorColumna = useMemo(() => {
    const map: Record<EstadoTarea, Tarea[]> = {
      PENDIENTE: [],
      EN_PROGRESO: [],
      COMPLETADA: [],
      VENCIDA: [],
    };
    tareas.forEach((t) => {
      if (map[t.estado]) map[t.estado].push(t);
    });
    return map;
  }, [tareas]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const tareaId = result.draggableId;
    const nuevoEstado = destination.droppableId as EstadoTarea;
    onMoverTarea(tareaId, nuevoEstado);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 h-[calc(100vh-200px)] overflow-x-auto pb-4">
        {COLUMNAS.map(({ estado, icono, color }) => {
          const tareasColumna = tareasPorColumna[estado];
          const config = ESTADOS_TAREA_CONFIG[estado];

          return (
            <div
              key={estado}
              className="min-w-[300px] w-[300px] flex-shrink-0 flex flex-col"
            >
              {/* Column Header */}
              <div className="bg-white rounded-2xl border border-slate-100/80 p-4 mb-3 flex-shrink-0 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      {icono}
                    </div>
                    <div>
                      <span className="text-[12px] font-bold text-slate-800 block">
                        {config.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {tareasColumna.length} tarea{tareasColumna.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold"
                    style={{
                      backgroundColor: `${color}10`,
                      color,
                    }}
                  >
                    {tareasColumna.length}
                  </div>
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={estado}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 rounded-2xl p-2.5 overflow-y-auto transition-all duration-200 ${
                      snapshot.isDraggingOver
                        ? "bg-blue-50/80 border-2 border-dashed border-blue-300"
                        : "bg-slate-50/30 border-2 border-transparent"
                    }`}
                  >
                    {tareasColumna.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 min-h-[200px]">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                          style={{ backgroundColor: `${color}10`, color }}
                        >
                          {icono}
                        </div>
                        <p className="text-[12px] text-slate-400 font-medium mb-1">
                          Sin tareas
                        </p>
                        <p className="text-[10px] text-slate-300">
                          Arrastra tareas aquí
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {tareasColumna.map((tarea, index) => (
                          <Draggable
                            key={tarea.id}
                            draggableId={tarea.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`group bg-white rounded-xl border transition-all duration-200 ${
                                  snapshot.isDragging
                                    ? "shadow-2xl ring-2 ring-blue-500/30 scale-[1.02] rotate-[1deg] z-50"
                                    : "border-slate-100 hover:shadow-lg hover:border-slate-200 hover:-translate-y-0.5"
                                }`}
                              >
                                {/* Priority indicator */}
                                <div
                                  className="h-1 rounded-t-xl"
                                  style={{
                                    backgroundColor: prioridadStyles[tarea.prioridad].dot,
                                  }}
                                />

                                <div className="p-3.5">
                                  {/* Header */}
                                  <div className="flex items-start justify-between mb-2.5">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-[12px] font-bold text-slate-800 leading-tight mb-1">
                                        {tarea.titulo}
                                      </h4>
                                      {tarea.descripcion && (
                                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                                          {tarea.descripcion}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Badges */}
                                  <div className="flex items-center gap-1.5 mb-3">
                                    <span
                                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${prioridadStyles[tarea.prioridad].bg} ${prioridadStyles[tarea.prioridad].text}`}
                                    >
                                      {tarea.prioridad}
                                    </span>
                                    <span
                                      className="text-[9px] font-semibold px-2 py-0.5 rounded-md"
                                      style={{
                                        backgroundColor: `${TIPOS_TAREA_CONFIG[tarea.tipo].color}12`,
                                        color: TIPOS_TAREA_CONFIG[tarea.tipo].color,
                                      }}
                                    >
                                      {TIPOS_TAREA_CONFIG[tarea.tipo].label}
                                    </span>
                                  </div>

                                  {/* Lead info */}
                                  {tarea.leadNombre && (
                                    <div className="flex items-center gap-2 mb-2.5 p-2 bg-slate-50/80 rounded-lg">
                                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-500 rounded-md flex items-center justify-center text-[8px] font-bold text-white">
                                        {tarea.leadNombre.split(" ").map((n) => n[0]).join("")}
                                      </div>
                                      <span className="text-[10px] text-slate-600 font-medium truncate">
                                        {tarea.leadNombre}
                                      </span>
                                    </div>
                                  )}

                                  {/* Meta info */}
                                  <div className="flex items-center gap-3 mb-3">
                                    {tarea.fechaVencimiento && (
                                      <div className="flex items-center gap-1">
                                        <Calendar size={10} className="text-slate-400" />
                                        <span
                                          className={`text-[10px] ${
                                            new Date(tarea.fechaVencimiento) < new Date() &&
                                            tarea.estado !== "COMPLETADA"
                                              ? "text-red-500 font-semibold"
                                              : "text-slate-500"
                                          }`}
                                        >
                                          {new Date(tarea.fechaVencimiento).toLocaleDateString("es-CL", {
                                            day: "numeric",
                                            month: "short",
                                          })}
                                        </span>
                                      </div>
                                    )}
                                    {tarea.duracionEstimada && (
                                      <div className="flex items-center gap-1">
                                        <Timer size={10} className="text-slate-400" />
                                        <span className="text-[10px] text-slate-500">
                                          {tarea.duracionEstimada}min
                                        </span>
                                      </div>
                                    )}
                                    {tarea.comentarios.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <MessageSquare size={10} className="text-slate-400" />
                                        <span className="text-[10px] text-slate-500">
                                          {tarea.comentarios.length}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Footer */}
                                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center text-[8px] font-bold text-white">
                                        {tarea.nombreEjecutivo
                                          ?.split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </div>
                                      <span className="text-[10px] text-slate-600 font-medium">
                                        {tarea.nombreEjecutivo?.split(" ")[0] || "Sin asignar"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onVerTarea(tarea);
                                        }}
                                        className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Ver detalle"
                                      >
                                        <Eye size={12} className="text-blue-500" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditarTarea(tarea);
                                        }}
                                        className="p-1.5 hover:bg-amber-50 rounded-lg transition-colors"
                                        title="Editar"
                                      >
                                        <Pencil size={12} className="text-amber-500" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
