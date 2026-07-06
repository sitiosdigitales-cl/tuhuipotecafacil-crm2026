"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  LayoutDashboard,
  List,
  Columns3,
  CalendarDays,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  Clock,
  Play,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
  User,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/componentes/ui/confirm-dialog";
import { FormularioTarea } from "@/componentes/tareas/FormularioTarea";
import { FiltrosTareas, FILTROS_VACIOS } from "@/componentes/tareas/FiltrosTareas";
import type { FiltrosTareasState } from "@/componentes/tareas/FiltrosTareas";
import { DashboardTareas } from "@/componentes/tareas/DashboardTareas";
import { TableroKanban } from "@/componentes/tareas/TableroKanban";
import { VistaCalendario } from "@/componentes/tareas/VistaCalendario";
import { TAREAS_MOCK } from "@/datos/mock";
import { ESTADOS_TAREA_CONFIG, TIPOS_TAREA_CONFIG } from "@/tipos";
import type { Tarea, EstadoTarea, Prioridad } from "@/tipos";

type VistaActiva = "dashboard" | "lista" | "kanban" | "calendario";

const vistas: { id: VistaActiva; label: string; icono: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icono: <LayoutDashboard size={14} /> },
  { id: "lista", label: "Lista", icono: <List size={14} /> },
  { id: "kanban", label: "Kanban", icono: <Columns3 size={14} /> },
  { id: "calendario", label: "Calendario", icono: <CalendarDays size={14} /> },
];

const prioridadStyles: Record<string, string> = {
  BAJA: "bg-slate-100 text-slate-600",
  MEDIA: "bg-blue-50 text-blue-600 border border-blue-100",
  ALTA: "bg-orange-50 text-orange-600 border border-orange-100",
  URGENTE: "bg-red-50 text-red-600 border border-red-100",
};

const estadoIcono: Record<EstadoTarea, React.ReactNode> = {
  PENDIENTE: <Clock size={13} className="text-amber-500" />,
  EN_PROGRESO: <Play size={13} className="text-blue-500" />,
  COMPLETADA: <CheckCircle size={13} className="text-emerald-500" />,
  VENCIDA: <AlertTriangle size={13} className="text-red-500" />,
};

export default function TareasPage() {
  const router = useRouter();
  const [tareas, setTareas] = useState<Tarea[]>(TAREAS_MOCK);
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>("dashboard");
  const [filtros, setFiltros] = useState<FiltrosTareasState>(FILTROS_VACIOS);
  const [formularioOpen, setFormularioOpen] = useState(false);
  const [tareaAEditar, setTareaAEditar] = useState<Tarea | null>(null);
  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [tareaAEliminar, setTareaAEliminar] = useState<Tarea | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const TAREAS_POR_PAGINA = 10;

  const tareasFiltradas = useMemo(() => {
    return tareas.filter((t) => {
      if (
        filtros.busqueda &&
        !t.titulo.toLowerCase().includes(filtros.busqueda.toLowerCase()) &&
        !t.descripcion?.toLowerCase().includes(filtros.busqueda.toLowerCase()) &&
        !t.leadNombre?.toLowerCase().includes(filtros.busqueda.toLowerCase())
      )
        return false;
      if (
        filtros.ejecutivo &&
        t.asignadoA !== filtros.ejecutivo
      )
        return false;
      if (
        filtros.prioridades.length > 0 &&
        !filtros.prioridades.includes(t.prioridad)
      )
        return false;
      if (
        filtros.tipos.length > 0 &&
        !filtros.tipos.includes(t.tipo)
      )
        return false;
      if (
        filtros.estados.length > 0 &&
        !filtros.estados.includes(t.estado)
      )
        return false;
      if (filtros.fechaDesde) {
        const desde = new Date(filtros.fechaDesde);
        const fv = t.fechaVencimiento ? new Date(t.fechaVencimiento) : t.creadoEn;
        if (fv < desde) return false;
      }
      if (filtros.fechaHasta) {
        const hasta = new Date(filtros.fechaHasta);
        hasta.setHours(23, 59, 59);
        const fv = t.fechaVencimiento ? new Date(t.fechaVencimiento) : t.creadoEn;
        if (fv > hasta) return false;
      }
      return true;
    });
  }, [tareas, filtros]);

  const totalPaginas = Math.ceil(tareasFiltradas.length / TAREAS_POR_PAGINA);
  const tareasPaginadas = tareasFiltradas.slice(
    (paginaActual - 1) * TAREAS_POR_PAGINA,
    paginaActual * TAREAS_POR_PAGINA
  );

  const handleSubmitTarea = (datos: Partial<Tarea>) => {
    if (tareaAEditar) {
      setTareas((prev) =>
        prev.map((t) =>
          t.id === tareaAEditar.id
            ? {
                ...t,
                ...datos,
                historial: [
                  ...t.historial,
                  {
                    id: `h-${Date.now()}`,
                    accion: "Editada",
                    usuario: "Usuario Actual",
                    fecha: new Date(),
                  },
                ],
              }
            : t
        )
      );
    } else {
      const nuevaTarea: Tarea = {
        id: `t-${Date.now()}`,
        titulo: datos.titulo || "",
        descripcion: datos.descripcion,
        estado: datos.estado || "PENDIENTE",
        tipo: datos.tipo || "SEGUIMIENTO",
        prioridad: datos.prioridad || "MEDIA",
        leadId: datos.leadId,
        leadNombre: datos.leadNombre,
        asignadoA: datos.asignadoA,
        nombreEjecutivo: datos.nombreEjecutivo,
        fechaVencimiento: datos.fechaVencimiento,
        recordatorio: datos.recordatorio,
        duracionEstimada: datos.duracionEstimada,
        etiquetas: datos.etiquetas,
        comentarios: [],
        historial: [
          {
            id: `h-${Date.now()}`,
            accion: "Creada",
            usuario: "Usuario Actual",
            fecha: new Date(),
          },
        ],
        creadoEn: new Date(),
      };
      setTareas((prev) => [nuevaTarea, ...prev]);
    }
    setTareaAEditar(null);
  };

  const handleEditarTarea = (tarea: Tarea) => {
    setTareaAEditar(tarea);
    setFormularioOpen(true);
  };

  const handleVerTarea = (tarea: Tarea) => {
    router.push(`/tareas/${tarea.id}`);
  };

  const handleEliminarTarea = () => {
    if (!tareaAEliminar) return;
    setTareas((prev) => prev.filter((t) => t.id !== tareaAEliminar.id));
    setTareaAEliminar(null);
  };

  const handleMoverTarea = (tareaId: string, nuevoEstado: EstadoTarea) => {
    setTareas((prev) =>
      prev.map((t) =>
        t.id === tareaId
          ? {
              ...t,
              estado: nuevoEstado,
              historial: [
                ...t.historial,
                {
                  id: `h-${Date.now()}`,
                  accion: `Movido a ${ESTADOS_TAREA_CONFIG[nuevoEstado].label}`,
                  usuario: "Usuario Actual",
                  fecha: new Date(),
                },
              ],
            }
          : t
      )
    );
  };

  return (
    <div className="space-y-5">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Gestión de Tareas
            </h1>
            <p className="text-blue-200 text-[11px] font-medium">
              Administra y da seguimiento a todas las actividades del equipo
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{tareas.length}</div>
              <div className="text-[10px] text-blue-200">Total</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">
                {tareas.filter((t) => t.estado === "COMPLETADA").length}
              </div>
              <div className="text-[10px] text-blue-200">Completadas</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-red-300">
                {tareas.filter((t) => t.estado === "VENCIDA").length}
              </div>
              <div className="text-[10px] text-blue-200">Vencidas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Tabs de vista */}
          <div className="flex bg-white rounded-xl p-1 border border-slate-200/60 shadow-sm">
            {vistas.map((v) => (
              <button
                key={v.id}
                onClick={() => setVistaActiva(v.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                  vistaActiva === v.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {v.icono}
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </div>
        <Button
          size="default"
          onClick={() => {
            setTareaAEditar(null);
            setFormularioOpen(true);
          }}
          className="gap-2 shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} /> Nueva Tarea
        </Button>
      </div>

      {/* Filtros */}
      {vistaActiva !== "kanban" && (
        <FiltrosTareas
          filtros={filtros}
          onCambiarFiltros={(f) => {
            setFiltros(f);
            setPaginaActual(1);
          }}
          totalResultados={tareasFiltradas.length}
        />
      )}

      {/* Vistas */}
      {vistaActiva === "dashboard" && (
        <DashboardTareas tareas={tareasFiltradas} />
      )}

      {vistaActiva === "lista" && (
        <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-soft">
          {/* Stats bar */}
          <div className="flex items-center gap-6 px-5 py-3 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <span className="text-[11px] text-slate-600">
                <span className="font-bold">{tareasFiltradas.filter((t) => t.estado === "PENDIENTE").length}</span> pendientes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-[11px] text-slate-600">
                <span className="font-bold">{tareasFiltradas.filter((t) => t.estado === "EN_PROGRESO").length}</span> en progreso
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-[11px] text-slate-600">
                <span className="font-bold">{tareasFiltradas.filter((t) => t.estado === "COMPLETADA").length}</span> completadas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-[11px] text-slate-600">
                <span className="font-bold">{tareasFiltradas.filter((t) => t.estado === "VENCIDA").length}</span> vencidas
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tarea
                  </th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ejecutivo
                  </th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Vence
                  </th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tareasPaginadas.map((tarea) => (
                  <tr
                    key={tarea.id}
                    className="group hover:bg-blue-50/30 transition-colors cursor-pointer"
                    onClick={() => handleVerTarea(tarea)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-1.5 h-10 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: ESTADOS_TAREA_CONFIG[tarea.estado].color,
                          }}
                        />
                        <div>
                          <div className="text-[12px] font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {tarea.titulo}
                          </div>
                          {tarea.descripcion && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[250px] mt-0.5">
                              {tarea.descripcion}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {tarea.leadNombre ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-500 rounded-md flex items-center justify-center text-[8px] font-bold text-white">
                            {tarea.leadNombre.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <span className="text-[11px] text-slate-600 font-medium">
                            {tarea.leadNombre}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-md flex items-center justify-center text-[8px] font-bold text-white">
                          {tarea.nombreEjecutivo
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium">
                          {tarea.nombreEjecutivo?.split(" ")[0] || "Sin asignar"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                        style={{
                          backgroundColor: `${TIPOS_TAREA_CONFIG[tarea.tipo].color}12`,
                          color: TIPOS_TAREA_CONFIG[tarea.tipo].color,
                        }}
                      >
                        {TIPOS_TAREA_CONFIG[tarea.tipo].label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: prioridadStyles[tarea.prioridad] === "bg-slate-100 text-slate-600" ? "#94A3B8" :
                              prioridadStyles[tarea.prioridad] === "bg-blue-50 text-blue-600 border border-blue-100" ? "#3B82F6" :
                              prioridadStyles[tarea.prioridad] === "bg-orange-50 text-orange-600 border border-orange-100" ? "#F97316" : "#EF4444"
                          }}
                        />
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${prioridadStyles[tarea.prioridad]}`}
                        >
                          {tarea.prioridad}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5"
                        style={{
                          backgroundColor: `${ESTADOS_TAREA_CONFIG[tarea.estado].color}12`,
                          color: ESTADOS_TAREA_CONFIG[tarea.estado].color,
                        }}
                      >
                        {estadoIcono[tarea.estado]}
                        {ESTADOS_TAREA_CONFIG[tarea.estado].label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {tarea.fechaVencimiento ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={11} className={
                            new Date(tarea.fechaVencimiento) < new Date() &&
                            tarea.estado !== "COMPLETADA"
                              ? "text-red-400"
                              : "text-slate-400"
                          } />
                          <span
                            className={`text-[11px] font-medium ${
                              new Date(tarea.fechaVencimiento) < new Date() &&
                              tarea.estado !== "COMPLETADA"
                                ? "text-red-500"
                                : "text-slate-600"
                            }`}
                          >
                            {new Date(tarea.fechaVencimiento).toLocaleDateString("es-CL", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div
                        className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleVerTarea(tarea)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={14} className="text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleEditarTarea(tarea)}
                          className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil size={14} className="text-amber-500" />
                        </button>
                        <button
                          onClick={() => {
                            setTareaAEliminar(tarea);
                            setEliminarOpen(true);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {tareasPaginadas.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList size={24} className="text-slate-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-600 mb-1">
                Sin resultados
              </h3>
              <p className="text-[11px] text-slate-400">
                No se encontraron tareas con los filtros aplicados
              </p>
            </div>
          )}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/30">
              <span className="text-[11px] text-slate-400">
                Mostrando{" "}
                <span className="font-semibold text-slate-600">
                  {(paginaActual - 1) * TAREAS_POR_PAGINA + 1}-
                  {Math.min(
                    paginaActual * TAREAS_POR_PAGINA,
                    tareasFiltradas.length
                  )}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-slate-600">
                  {tareasFiltradas.length}
                </span>{" "}
                tareas
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPaginaActual(Math.max(1, paginaActual - 1))
                  }
                  disabled={paginaActual === 1}
                >
                  Anterior
                </Button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPaginaActual(p)}
                      className={`w-8 h-8 rounded-lg text-[11px] font-semibold transition-all ${
                        paginaActual === p
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPaginaActual(
                      Math.min(totalPaginas, paginaActual + 1)
                    )
                  }
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {vistaActiva === "kanban" && (
        <TableroKanban
          tareas={tareas}
          onMoverTarea={handleMoverTarea}
          onVerTarea={handleVerTarea}
          onEditarTarea={handleEditarTarea}
        />
      )}

      {vistaActiva === "calendario" && (
        <VistaCalendario
          tareas={tareas}
          onVerTarea={handleVerTarea}
          onEditarTarea={handleEditarTarea}
        />
      )}

      {/* Formulario */}
      <FormularioTarea
        open={formularioOpen}
        onOpenChange={(open) => {
          setFormularioOpen(open);
          if (!open) setTareaAEditar(null);
        }}
        tarea={tareaAEditar}
        onSubmit={handleSubmitTarea}
      />

      {/* Eliminar */}
      <ConfirmDialog
        open={eliminarOpen}
        onOpenChange={setEliminarOpen}
        title="Eliminar Tarea"
        description={`¿Eliminar "${tareaAEliminar?.titulo}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleEliminarTarea}
      />
    </div>
  );
}
