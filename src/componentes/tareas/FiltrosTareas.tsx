"use client";

import { useState } from "react";
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { USUARIOS_MOCK } from "@/datos/mock";
import { ESTADOS_TAREA_CONFIG, TIPOS_TAREA_CONFIG } from "@/tipos";
import type { EstadoTarea, TipoTarea, Prioridad } from "@/tipos";

export interface FiltrosTareasState {
  busqueda: string;
  ejecutivo: string;
  prioridades: Prioridad[];
  tipos: TipoTarea[];
  estados: EstadoTarea[];
  lead: string;
  fechaDesde: string;
  fechaHasta: string;
}

interface FiltrosTareasProps {
  filtros: FiltrosTareasState;
  onCambiarFiltros: (filtros: FiltrosTareasState) => void;
  totalResultados: number;
}

const prioridades: { value: Prioridad; label: string; color: string; activeColor: string }[] = [
  { value: "BAJA", label: "Baja", color: "bg-slate-100 text-slate-500 border-slate-200", activeColor: "bg-slate-600 text-white border-slate-600" },
  { value: "MEDIA", label: "Media", color: "bg-slate-50 text-slate-500 border-slate-200", activeColor: "bg-blue-500 text-white border-blue-500" },
  { value: "ALTA", label: "Alta", color: "bg-slate-50 text-slate-500 border-slate-200", activeColor: "bg-orange-500 text-white border-orange-500" },
  { value: "URGENTE", label: "Urgente", color: "bg-slate-50 text-slate-500 border-slate-200", activeColor: "bg-red-500 text-white border-red-500" },
];

const ejecutivos = USUARIOS_MOCK.filter(
  (u) => u.estado === "ACTIVO" && u.rol !== "SUPER_ADMIN"
);

export const FILTROS_VACIOS: FiltrosTareasState = {
  busqueda: "",
  ejecutivo: "",
  prioridades: [],
  tipos: [],
  estados: [],
  lead: "",
  fechaDesde: "",
  fechaHasta: "",
};

export function FiltrosTareas({
  filtros,
  onCambiarFiltros,
  totalResultados,
}: FiltrosTareasProps) {
  const [expandido, setExpandido] = useState(false);

  const tieneFiltrosActivos =
    filtros.ejecutivo ||
    filtros.prioridades.length > 0 ||
    filtros.tipos.length > 0 ||
    filtros.estados.length > 0 ||
    filtros.lead ||
    filtros.fechaDesde ||
    filtros.fechaHasta;

  const cantidadFiltros =
    (filtros.prioridades.length > 0 ? 1 : 0) +
    (filtros.tipos.length > 0 ? 1 : 0) +
    (filtros.estados.length > 0 ? 1 : 0) +
    (filtros.ejecutivo ? 1 : 0) +
    (filtros.lead ? 1 : 0) +
    (filtros.fechaDesde ? 1 : 0) +
    (filtros.fechaHasta ? 1 : 0);

  const limpiarFiltros = () => {
    onCambiarFiltros({ ...FILTROS_VACIOS, busqueda: filtros.busqueda });
  };

  const toggleArrayFilter = (
    key: "prioridades" | "tipos" | "estados",
    value: string
  ) => {
    const current = filtros[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onCambiarFiltros({ ...filtros, [key]: next });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 shadow-soft overflow-hidden">
      {/* Barra principal */}
      <div className="flex items-center gap-4 p-4">
        <div className="relative flex-1 max-w-lg">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Buscar tareas por título, descripción o lead..."
            value={filtros.busqueda}
            onChange={(e) =>
              onCambiarFiltros({ ...filtros, busqueda: e.target.value })
            }
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="font-bold text-slate-700 text-sm">
            {totalResultados}
          </span>
          resultado{totalResultados !== 1 ? "s" : ""}
        </div>

        <div className="w-px h-6 bg-slate-200" />

        <Button
          variant={expandido ? "default" : "outline"}
          size="sm"
          onClick={() => setExpandido(!expandido)}
          className="gap-1.5"
        >
          <SlidersHorizontal size={13} />
          Filtros
          {cantidadFiltros > 0 && (
            <span className="w-5 h-5 bg-white/20 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
              {cantidadFiltros}
            </span>
          )}
          {expandido ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </Button>

        {tieneFiltrosActivos && (
          <Button
            variant="ghost"
            size="sm"
            onClick={limpiarFiltros}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1"
          >
            <X size={13} /> Limpiar filtros
          </Button>
        )}
      </div>

      {/* Panel expandido */}
      {expandido && (
        <div className="px-5 pb-5 pt-0 border-t border-slate-100">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 pt-4">
            {/* Ejecutivo */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Ejecutivo
              </label>
              <select
                value={filtros.ejecutivo}
                onChange={(e) =>
                  onCambiarFiltros({ ...filtros, ejecutivo: e.target.value })
                }
                className="w-full h-9 px-3 bg-white border border-slate-200/60 rounded-xl text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-colors"
              >
                <option value="">Todos los ejecutivos</option>
                {ejecutivos.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} {u.apellido}
                  </option>
                ))}
              </select>
            </div>

            {/* Prioridades */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Prioridad
              </label>
              <div className="flex flex-wrap gap-1.5">
                {prioridades.map((p) => {
                  const activo = filtros.prioridades.includes(p.value);
                  return (
                    <button
                      key={p.value}
                      onClick={() => toggleArrayFilter("prioridades", p.value)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                        activo
                          ? p.activeColor
                          : `${p.color} hover:bg-slate-100`
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tipos */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Tipo de Tarea
              </label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(TIPOS_TAREA_CONFIG).map(([k, v]) => {
                  const activo = filtros.tipos.includes(k as TipoTarea);
                  return (
                    <button
                      key={k}
                      onClick={() => toggleArrayFilter("tipos", k)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                        activo
                          ? "text-white border-transparent"
                          : "bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100"
                      }`}
                      style={
                        activo
                          ? { backgroundColor: v.color, borderColor: v.color }
                          : undefined
                      }
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fechas */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Rango de Fechas
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="date"
                    value={filtros.fechaDesde}
                    onChange={(e) =>
                      onCambiarFiltros({
                        ...filtros,
                        fechaDesde: e.target.value,
                      })
                    }
                    className="w-full h-9 px-2.5 bg-white border border-slate-200/60 rounded-xl text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="date"
                    value={filtros.fechaHasta}
                    onChange={(e) =>
                      onCambiarFiltros({
                        ...filtros,
                        fechaHasta: e.target.value,
                      })
                    }
                    className="w-full h-9 px-2.5 bg-white border border-slate-200/60 rounded-xl text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Estados */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-4">
              Estado
            </label>
            <div className="inline-flex gap-2">
              {Object.entries(ESTADOS_TAREA_CONFIG).map(([k, v]) => {
                const activo = filtros.estados.includes(k as EstadoTarea);
                return (
                  <button
                    key={k}
                    onClick={() => toggleArrayFilter("estados", k)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                      activo
                        ? "text-white border-transparent"
                        : "bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100"
                    }`}
                    style={
                      activo
                        ? { backgroundColor: v.color, borderColor: v.color }
                        : undefined
                    }
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {tieneFiltrosActivos && !expandido && (
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          {filtros.ejecutivo && (
            <FilterChip
              label={`Ejecutivo: ${ejecutivos.find((u) => u.id === filtros.ejecutivo)?.nombre || ""}`}
              onRemove={() => onCambiarFiltros({ ...filtros, ejecutivo: "" })}
            />
          )}
          {filtros.prioridades.map((p) => (
            <FilterChip
              key={p}
              label={`Prioridad: ${p}`}
              onRemove={() => toggleArrayFilter("prioridades", p)}
            />
          ))}
          {filtros.tipos.map((t) => (
            <FilterChip
              key={t}
              label={`Tipo: ${TIPOS_TAREA_CONFIG[t].label}`}
              onRemove={() => toggleArrayFilter("tipos", t)}
            />
          ))}
          {filtros.estados.map((e) => (
            <FilterChip
              key={e}
              label={`Estado: ${ESTADOS_TAREA_CONFIG[e].label}`}
              onRemove={() => toggleArrayFilter("estados", e)}
            />
          ))}
          {filtros.fechaDesde && (
            <FilterChip
              label={`Desde: ${filtros.fechaDesde}`}
              onRemove={() => onCambiarFiltros({ ...filtros, fechaDesde: "" })}
            />
          )}
          {filtros.fechaHasta && (
            <FilterChip
              label={`Hasta: ${filtros.fechaHasta}`}
              onRemove={() => onCambiarFiltros({ ...filtros, fechaHasta: "" })}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-semibold">
      {label}
      <button
        onClick={onRemove}
        className="w-3.5 h-3.5 flex items-center justify-center hover:bg-blue-100 rounded-full transition-colors"
      >
        <X size={10} />
      </button>
    </span>
  );
}
