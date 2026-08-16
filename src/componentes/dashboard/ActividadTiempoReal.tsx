"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Edit,
  FileText,
  Filter,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";

import {
  formatearTiempoRelativo,
  getIconoActividad,
  useActivities,
} from "@/lib/contexts/ActivityContext";

const ICONOS_ACTIVIDAD: Record<string, typeof Clock> = {
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Edit,
  FileText,
  Mail,
  MessageSquare,
  Phone,
};

const ETIQUETAS_ACTIVIDAD: Record<string, string> = {
  llamada: "Llamada",
  email: "Email",
  whatsapp: "WhatsApp",
  documento: "Documento",
  reunion: "Reunión",
  sistema: "Sistema",
  tarea: "Tarea",
  cambio_estado: "Etapa",
  nota: "Nota",
};

export function ActividadTiempoReal() {
  const router = useRouter();
  const { actividades } = useActivities();
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const actividadesRecientes = useMemo(
    () =>
      [...actividades]
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
        .slice(0, 12),
    [actividades]
  );

  const actividadesFiltradas = useMemo(() => {
    if (filtroTipo === "todos") return actividadesRecientes;
    return actividadesRecientes.filter(
      (actividad) => actividad.tipo === filtroTipo
    );
  }, [actividadesRecientes, filtroTipo]);

  const tiposDisponibles = useMemo(
    () => [...new Set(actividadesRecientes.map((actividad) => actividad.tipo))],
    [actividadesRecientes]
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/80 dark:border-slate-700 shadow-soft overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-slate-400 dark:text-slate-500" />
          <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
            Actividad Reciente
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
            <CheckCircle size={10} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
              PERSISTIDA
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMostrarFiltros((actual) => !actual)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
            mostrarFiltros
              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          <Filter size={10} />
          Filtros
        </button>
      </div>

      {mostrarFiltros && (
        <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFiltroTipo("todos")}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                filtroTipo === "todos"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              Todos
            </button>
            {tiposDisponibles.map((tipo) => {
              const config = getIconoActividad(tipo);
              const Icono = ICONOS_ACTIVIDAD[config.icono] || Clock;
              return (
                <button
                  type="button"
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                    filtroTipo === tipo
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  <Icono size={10} />
                  {ETIQUETAS_ACTIVIDAD[tipo] || tipo}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 dark:bg-slate-700">
        {actividadesFiltradas.slice(0, 8).map((actividad) => {
          const config = getIconoActividad(actividad.tipo);
          const Icono = ICONOS_ACTIVIDAD[config.icono] || Clock;
          return (
            <button
              type="button"
              key={actividad.id}
              onClick={() => router.push(`/clientes/${actividad.leadId}`)}
              className="bg-white dark:bg-slate-800 p-4 hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                  <Icono size={16} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate block">
                    {actividad.titulo}
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 mt-0.5">
                    {actividad.descripcion}
                  </p>
                  <span className="text-[9px] text-slate-300 dark:text-slate-500 mt-1 block">
                    {formatearTiempoRelativo(actividad.fecha)} · {actividad.usuario}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
        {actividadesFiltradas.length === 0 && (
          <div className="col-span-full bg-white dark:bg-slate-800 px-5 py-10 text-center">
            <Clock size={24} className="text-slate-200 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              No hay actividad confirmada para este filtro.
            </p>
          </div>
        )}
      </div>

      <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
        <button
          type="button"
          onClick={() => router.push("/actividades")}
          className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors"
        >
          Ver toda la actividad <ArrowRight size={10} />
        </button>
      </div>
    </div>
  );
}
