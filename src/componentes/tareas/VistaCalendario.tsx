"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Pencil,
  Calendar,
  User,
  Timer,
  LayoutGrid,
  Rows3,
  Sun,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ESTADOS_TAREA_CONFIG, TIPOS_TAREA_CONFIG } from "@/tipos";
import type { Tarea, EstadoTarea, TipoTarea } from "@/tipos";

interface VistaCalendarioProps {
  tareas: Tarea[];
  onVerTarea: (tarea: Tarea) => void;
  onEditarTarea: (tarea: Tarea) => void;
}

type VistaCalendario = "mes" | "semana" | "dia";

const DIAS_SEMANA_COMPLETOS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const DIAS_SEMANA_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const estadoColores: Record<EstadoTarea, string> = {
  PENDIENTE: "#F59E0B",
  EN_PROGRESO: "#3B82F6",
  COMPLETADA: "#10B981",
  VENCIDA: "#EF4444",
};

const horasDelDia = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 a 20:00

export function VistaCalendario({
  tareas,
  onVerTarea,
  onEditarTarea,
}: VistaCalendarioProps) {
  const hoy = new Date();
  const [vistaActiva, setVistaActiva] = useState<VistaCalendario>("mes");
  const [fechaActual, setFechaActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
  const [horaActual, setHoraActual] = useState(new Date());
  const timeRef = useRef<NodeJS.Timeout | null>(null);

  // Actualizar hora actual cada minuto
  useEffect(() => {
    timeRef.current = setInterval(() => setHoraActual(new Date()), 60000);
    return () => {
      if (timeRef.current) clearInterval(timeRef.current);
    };
  }, []);

  // Obtener inicio de la semana (lunes)
  const inicioSemana = useMemo(() => {
    const d = new Date(fechaActual);
    const dia = d.getDay();
    const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [fechaActual]);

  // Días de la semana actual
  const diasSemana = useMemo(() => {
    const dias: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(inicioSemana);
      d.setDate(d.getDate() + i);
      dias.push(d);
    }
    return dias;
  }, [inicioSemana]);

  // Tareas agrupadas por día
  const tareasPorDia = useMemo(() => {
    const map: Record<string, Tarea[]> = {};
    tareas.forEach((t) => {
      if (!t.fechaVencimiento) return;
      const fv = new Date(t.fechaVencimiento);
      const key = `${fv.getFullYear()}-${fv.getMonth()}-${fv.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tareas]);

  const getTareasDelDia = (fecha: Date) => {
    const key = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
    return tareasPorDia[key] || [];
  };

  // Navegación
  const irAAnterior = () => {
    const nueva = new Date(fechaActual);
    if (vistaActiva === "mes") nueva.setMonth(nueva.getMonth() - 1);
    else if (vistaActiva === "semana") nueva.setDate(nueva.getDate() - 7);
    else nueva.setDate(nueva.getDate() - 1);
    setFechaActual(nueva);
  };

  const irASiguiente = () => {
    const nueva = new Date(fechaActual);
    if (vistaActiva === "mes") nueva.setMonth(nueva.getMonth() + 1);
    else if (vistaActiva === "semana") nueva.setDate(nueva.getDate() + 7);
    else nueva.setDate(nueva.getDate() + 1);
    setFechaActual(nueva);
  };

  const irAHoy = () => {
    setFechaActual(new Date());
    setDiaSeleccionado(new Date());
    if (vistaActiva === "dia") {
      // keep dia view
    }
  };

  const esHoy = (fecha: Date) =>
    fecha.getDate() === hoy.getDate() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getFullYear() === hoy.getFullYear();

  const esMismaFecha = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const tituloVista = () => {
    if (vistaActiva === "mes") {
      return `${MESES[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;
    }
    if (vistaActiva === "semana") {
      const fin = new Date(inicioSemana);
      fin.setDate(fin.getDate() + 6);
      if (inicioSemana.getMonth() === fin.getMonth()) {
        return `${inicioSemana.getDate()} - ${fin.getDate()} ${MESES[inicioSemana.getMonth()]} ${inicioSemana.getFullYear()}`;
      }
      return `${inicioSemana.getDate()} ${MESES[inicioSemana.getMonth()].slice(0, 3)} - ${fin.getDate()} ${MESES[fin.getMonth()].slice(0, 3)} ${fin.getFullYear()}`;
    }
    return `${DIAS_SEMANA_COMPLETOS[fechaActual.getDay() === 0 ? 6 : fechaActual.getDay() - 1]} ${fechaActual.getDate()} de ${MESES[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;
  };

  // Posición de la línea de hora actual
  const getPosicionHora = () => {
    const hora = horaActual.getHours();
    const minuto = horaActual.getMinutes();
    return ((hora - 7) * 60 + minuto) * (56 / 60); // 56px por hora
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* Panel izquierdo - Calendario principal */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100/80 shadow-soft overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={irAAnterior}
                className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ChevronLeft size={18} className="text-slate-600" />
              </button>
              <h2 className="text-base font-bold text-slate-900 min-w-[200px] text-center">
                {tituloVista()}
              </h2>
              <button
                onClick={irASiguiente}
                className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ChevronRight size={18} className="text-slate-600" />
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={irAHoy}>
              Hoy
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {/* Leyenda */}
            <div className="hidden lg:flex items-center gap-3 mr-4">
              {Object.entries(estadoColores).map(([estado, color]) => (
                <div key={estado} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span>{ESTADOS_TAREA_CONFIG[estado as EstadoTarea].label}</span>
                </div>
              ))}
            </div>

            {/* Selector de vista */}
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setVistaActiva("mes")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                  vistaActiva === "mes"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <LayoutGrid size={12} /> Mes
              </button>
              <button
                onClick={() => setVistaActiva("semana")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                  vistaActiva === "semana"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Rows3 size={12} /> Semana
              </button>
              <button
                onClick={() => setVistaActiva("dia")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                  vistaActiva === "dia"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Sun size={12} /> Día
              </button>
            </div>
          </div>
        </div>

        {/* Vista Mes */}
        {vistaActiva === "mes" && (
          <VistaMes
            fechaActual={fechaActual}
            tareasPorDia={tareasPorDia}
            getTareasDelDia={getTareasDelDia}
            esHoy={esHoy}
            onDiaClick={(fecha) => {
              setDiaSeleccionado(fecha);
              setFechaActual(fecha);
              setVistaActiva("dia");
            }}
            onVerTarea={onVerTarea}
            onEditarTarea={onEditarTarea}
          />
        )}

        {/* Vista Semana */}
        {vistaActiva === "semana" && (
          <VistaSemana
            diasSemana={diasSemana}
            getTareasDelDia={getTareasDelDia}
            esHoy={esHoy}
            esMismaFecha={esMismaFecha}
            fechaActual={fechaActual}
            horaActual={horaActual}
           getPosicionHora={getPosicionHora}
            onDiaClick={(fecha) => {
              setDiaSeleccionado(fecha);
              setFechaActual(fecha);
              setVistaActiva("dia");
            }}
            onVerTarea={onVerTarea}
            onEditarTarea={onEditarTarea}
          />
        )}

        {/* Vista Día */}
        {vistaActiva === "dia" && (
          <VistaDia
            fecha={diaSeleccionado || fechaActual}
            getTareasDelDia={getTareasDelDia}
            esHoy={esHoy}
            horaActual={horaActual}
           getPosicionHora={getPosicionHora}
            onVerTarea={onVerTarea}
            onEditarTarea={onEditarTarea}
          />
        )}
      </div>

      {/* Panel lateral derecho */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* Mini calendario */}
        <MiniCalendario
          fechaActual={fechaActual}
          onFechaClick={(fecha) => {
            setFechaActual(fecha);
            setDiaSeleccionado(fecha);
            setVistaActiva("dia");
          }}
        />

        {/* Tareas del día seleccionado */}
        <PanelDiaSeleccionado
          fecha={diaSeleccionado || new Date()}
          tareas={getTareasDelDia(diaSeleccionado || new Date())}
          onVerTarea={onVerTarea}
          onEditarTarea={onEditarTarea}
        />
      </div>
    </div>
  );
}

// ==================== VISTA MES ====================
function VistaMes({
  fechaActual,
  tareasPorDia,
  getTareasDelDia,
  esHoy,
  onDiaClick,
  onVerTarea,
  onEditarTarea,
}: {
  fechaActual: Date;
  tareasPorDia: Record<string, Tarea[]>;
  getTareasDelDia: (fecha: Date) => Tarea[];
  esHoy: (fecha: Date) => boolean;
  onDiaClick: (fecha: Date) => void;
  onVerTarea: (tarea: Tarea) => void;
  onEditarTarea: (tarea: Tarea) => void;
}) {
  const diasDelMes = useMemo(() => {
    const primerDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    const ultimoDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
    const diasEnMes = ultimoDia.getDate();

    let diaSemana = primerDia.getDay() - 1;
    if (diaSemana < 0) diaSemana = 6;

    const dias: (Date | null)[] = [];
    for (let i = 0; i < diaSemana; i++) dias.push(null);
    for (let i = 1; i <= diasEnMes; i++) {
      dias.push(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), i));
    }
    return dias;
  }, [fechaActual]);

  return (
    <div className="flex flex-col flex-1">
      {/* Header días */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
        {DIAS_SEMANA_CORTOS.map((dia) => (
          <div key={dia} className="p-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {dia}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1">
        {diasDelMes.map((dia, idx) => {
          if (!dia) {
            return <div key={`empty-${idx}`} className="min-h-[100px] bg-slate-50/30 border-b border-r border-slate-100" />;
          }

          const tareasDelDia = getTareasDelDia(dia);
          const hoy = esHoy(dia);
          const esFinDeSemana = idx % 7 >= 5;

          return (
            <div
              key={dia.getTime()}
              onClick={() => onDiaClick(dia)}
              className={`min-h-[100px] p-2 border-b border-r border-slate-100 cursor-pointer transition-all duration-150 hover:bg-blue-50/30 ${
                esFinDeSemana ? "bg-slate-50/50" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[12px] font-semibold w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                    hoy
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  {dia.getDate()}
                </span>
                {tareasDelDia.length > 0 && (
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                    {tareasDelDia.length}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {tareasDelDia.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] truncate cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: `${estadoColores[t.estado]}15`,
                      color: estadoColores[t.estado],
                      borderLeft: `2px solid ${estadoColores[t.estado]}`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onVerTarea(t);
                    }}
                  >
                    <span className="truncate font-medium">{t.titulo}</span>
                  </div>
                ))}
                {tareasDelDia.length > 3 && (
                  <div className="text-[8px] text-slate-400 font-medium pl-1">
                    +{tareasDelDia.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== VISTA SEMANA ====================
function VistaSemana({
  diasSemana,
  getTareasDelDia,
  esHoy,
  esMismaFecha,
  fechaActual,
  horaActual,
  getPosicionHora,
  onDiaClick,
  onVerTarea,
  onEditarTarea,
}: {
  diasSemana: Date[];
  getTareasDelDia: (fecha: Date) => Tarea[];
  esHoy: (fecha: Date) => boolean;
  esMismaFecha: (a: Date, b: Date) => boolean;
  fechaActual: Date;
  horaActual: Date;
  getPosicionHora: () => number;
  onDiaClick: (fecha: Date) => void;
  onVerTarea: (tarea: Tarea) => void;
  onEditarTarea: (tarea: Tarea) => void;
}) {
  const mostrarLineaHora = esHoy(horaActual);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header días */}
      <div className="grid grid-cols-8 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
        <div className="p-3" /> {/* Espacio para columna de horas */}
        {diasSemana.map((dia) => {
          const hoy = esHoy(dia);
          return (
            <div
              key={dia.getTime()}
              onClick={() => onDiaClick(dia)}
              className={`p-3 text-center cursor-pointer transition-colors hover:bg-blue-50/50 ${
                hoy ? "bg-blue-50/80" : ""
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                {DIAS_SEMANA_CORTOS[dia.getDay() === 0 ? 6 : dia.getDay() - 1]}
              </div>
              <div
                className={`text-lg font-bold mt-0.5 w-9 h-9 mx-auto flex items-center justify-center rounded-xl ${
                  hoy ? "bg-blue-600 text-white" : "text-slate-700"
                }`}
              >
                {dia.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid de horas */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8 relative">
          {/* Columna de horas */}
          <div className="border-r border-slate-100">
            {horasDelDia.map((hora) => (
              <div
                key={hora}
                className="h-14 border-b border-slate-100 flex items-start justify-end pr-2 pt-1"
              >
                <span className="text-[9px] font-medium text-slate-400">
                  {`${hora.toString().padStart(2, "0")}:00`}
                </span>
              </div>
            ))}
          </div>

          {/* Columnas de días */}
          {diasSemana.map((dia) => {
            const tareasDelDia = getTareasDelDia(dia);
            const hoy = esHoy(dia);

            return (
              <div
                key={dia.getTime()}
                className={`relative ${hoy ? "bg-blue-50/20" : ""}`}
              >
                {horasDelDia.map((hora) => (
                  <div
                    key={hora}
                    className="h-14 border-b border-r border-slate-100 hover:bg-slate-50/50 transition-colors"
                  />
                ))}

                {/* Eventos del día */}
                {tareasDelDia.map((tarea) => {
                  const fv = new Date(tarea.fechaVencimiento!);
                  const horaInicio = fv.getHours();
                  const minutoInicio = fv.getMinutes();
                  if (horaInicio < 7 || horaInicio > 20) return null;

                  const top = (horaInicio - 7) * 56 + (minutoInicio / 60) * 56;
                  const duracion = tarea.duracionEstimada || 30;
                  const altura = Math.max((duracion / 60) * 56, 28);

                  return (
                    <div
                      key={tarea.id}
                      className="absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 cursor-pointer hover:shadow-md transition-all overflow-hidden group z-10"
                      style={{
                        top: `${top}px`,
                        height: `${altura}px`,
                        backgroundColor: `${estadoColores[tarea.estado]}20`,
                        borderLeft: `3px solid ${estadoColores[tarea.estado]}`,
                      }}
                      onClick={() => onVerTarea(tarea)}
                    >
                      <div className="text-[9px] font-bold truncate" style={{ color: estadoColores[tarea.estado] }}>
                        {tarea.titulo}
                      </div>
                      {altura > 30 && (
                        <div className="text-[8px] text-slate-500 truncate">
                          {fv.getHours().toString().padStart(2, "0")}:{minutoInicio.toString().padStart(2, "0")}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Línea de hora actual */}
                {hoy && mostrarLineaHora && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${getPosicionHora()}px` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-1.5" />
                      <div className="flex-1 h-0.5 bg-red-500" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==================== VISTA DÍA ====================
function VistaDia({
  fecha,
  getTareasDelDia,
  esHoy,
  horaActual,
  getPosicionHora,
  onVerTarea,
  onEditarTarea,
}: {
  fecha: Date;
  getTareasDelDia: (fecha: Date) => Tarea[];
  esHoy: (fecha: Date) => boolean;
  horaActual: Date;
  getPosicionHora: () => number;
  onVerTarea: (tarea: Tarea) => void;
  onEditarTarea: (tarea: Tarea) => void;
}) {
  const tareasDelDia = getTareasDelDia(fecha);
  const hoy = esHoy(fecha);
  const mostrarLineaHora = hoy;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header del día */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-100 bg-slate-50/30">
        <div className="text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase">
            {DIAS_SEMANA_COMPLETOS[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1]}
          </div>
          <div
            className={`text-3xl font-bold w-14 h-14 mx-auto flex items-center justify-center rounded-2xl mt-1 ${
              hoy ? "bg-blue-600 text-white shadow-lg" : "text-slate-700 bg-slate-100"
            }`}
          >
            {fecha.getDate()}
          </div>
        </div>
        <div>
          <div className="text-sm font-bold text-slate-800">
            {MESES[fecha.getMonth()]} {fecha.getFullYear()}
          </div>
          <div className="text-[11px] text-slate-400">
            {tareasDelDia.length} tarea{tareasDelDia.length !== 1 ? "s" : ""} programada{tareasDelDia.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Timeline del día */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex">
          {/* Columna de horas */}
          <div className="w-16 flex-shrink-0 border-r border-slate-100">
            {horasDelDia.map((hora) => (
              <div
                key={hora}
                className="h-16 border-b border-slate-100 flex items-start justify-end pr-3 pt-1"
              >
                <span className="text-[10px] font-medium text-slate-400">
                  {`${hora.toString().padStart(2, "0")}:00`}
                </span>
              </div>
            ))}
          </div>

          {/* Columna de eventos */}
          <div className="flex-1 relative">
            {horasDelDia.map((hora) => (
              <div
                key={hora}
                className="h-16 border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
              />
            ))}

            {/* Eventos */}
            {tareasDelDia.map((tarea) => {
              const fv = new Date(tarea.fechaVencimiento!);
              const horaInicio = fv.getHours();
              const minutoInicio = fv.getMinutes();
              if (horaInicio < 7 || horaInicio > 20) return null;

              const top = (horaInicio - 7) * 64 + (minutoInicio / 60) * 64;
              const duracion = tarea.duracionEstimada || 30;
              const altura = Math.max((duracion / 60) * 64, 40);

              return (
                <div
                  key={tarea.id}
                  className="absolute left-2 right-4 rounded-xl p-3 cursor-pointer hover:shadow-lg transition-all group z-10"
                  style={{
                    top: `${top}px`,
                    height: `${altura}px`,
                    backgroundColor: `${estadoColores[tarea.estado]}15`,
                    borderLeft: `4px solid ${estadoColores[tarea.estado]}`,
                  }}
                  onClick={() => onVerTarea(tarea)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold truncate" style={{ color: estadoColores[tarea.estado] }}>
                        {tarea.titulo}
                      </div>
                      {altura > 50 && (
                        <>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {fv.getHours().toString().padStart(2, "0")}:{minutoInicio.toString().padStart(2, "0")}
                            {tarea.duracionEstimada && ` • ${tarea.duracionEstimada}min`}
                          </div>
                          {tarea.leadNombre && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {tarea.leadNombre}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerTarea(tarea);
                        }}
                        className="p-1 hover:bg-white/80 rounded transition-colors"
                      >
                        <Eye size={12} style={{ color: estadoColores[tarea.estado] }} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditarTarea(tarea);
                        }}
                        className="p-1 hover:bg-white/80 rounded transition-colors"
                      >
                        <Pencil size={12} style={{ color: estadoColores[tarea.estado] }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Línea de hora actual */}
            {hoy && mostrarLineaHora && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: `${getPosicionHora() * (64 / 56)}px` }}
              >
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 shadow-sm" />
                  <div className="flex-1 h-0.5 bg-red-500" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MINI CALENDARIO ====================
function MiniCalendario({
  fechaActual,
  onFechaClick,
}: {
  fechaActual: Date;
  onFechaClick: (fecha: Date) => void;
}) {
  const [mesMini, setMesMini] = useState(fechaActual.getMonth());
  const [anoMini, setAnoMini] = useState(fechaActual.getFullYear());
  const hoy = new Date();

  const diasDelMes = useMemo(() => {
    const primerDia = new Date(anoMini, mesMini, 1);
    const ultimoDia = new Date(anoMini, mesMini + 1, 0);
    const diasEnMes = ultimoDia.getDate();

    let diaSemana = primerDia.getDay() - 1;
    if (diaSemana < 0) diaSemana = 6;

    const dias: (number | null)[] = [];
    for (let i = 0; i < diaSemana; i++) dias.push(null);
    for (let i = 1; i <= diasEnMes; i++) dias.push(i);
    return dias;
  }, [mesMini, anoMini]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 shadow-soft overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-slate-100">
        <button
          onClick={() => {
            if (mesMini === 0) {
              setMesMini(11);
              setAnoMini(anoMini - 1);
            } else setMesMini(mesMini - 1);
          }}
          className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded-md transition-colors"
        >
          <ChevronLeft size={14} className="text-slate-500" />
        </button>
        <span className="text-[11px] font-bold text-slate-700">
          {MESES[mesMini].slice(0, 3)} {anoMini}
        </span>
        <button
          onClick={() => {
            if (mesMini === 11) {
              setMesMini(0);
              setAnoMini(anoMini + 1);
            } else setMesMini(mesMini + 1);
          }}
          className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded-md transition-colors"
        >
          <ChevronRight size={14} className="text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px p-2">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d} className="text-center text-[9px] font-bold text-slate-400 py-1">
            {d}
          </div>
        ))}
        {diasDelMes.map((dia, idx) => {
          if (!dia) return <div key={`empty-${idx}`} />;
          const esHoyMini =
            dia === hoy.getDate() &&
            mesMini === hoy.getMonth() &&
            anoMini === hoy.getFullYear();

          return (
            <button
              key={dia}
              onClick={() =>
                onFechaClick(new Date(anoMini, mesMini, dia))
              }
              className={`w-7 h-7 text-[10px] font-medium rounded-lg flex items-center justify-center transition-colors ${
                esHoyMini
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {dia}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== PANEL DÍA SELECCIONADO ====================
function PanelDiaSeleccionado({
  fecha,
  tareas,
  onVerTarea,
  onEditarTarea,
}: {
  fecha: Date;
  tareas: Tarea[];
  onVerTarea: (tarea: Tarea) => void;
  onEditarTarea: (tarea: Tarea) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 shadow-soft overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Calendar size={18} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-[12px] font-bold text-slate-800">
              {fecha.toLocaleDateString("es-CL", { weekday: "long" })}
            </h3>
            <p className="text-[10px] text-slate-400">
              {fecha.getDate()} de {MESES[fecha.getMonth()]}
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 max-h-[300px] overflow-y-auto">
        {tareas.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Clock size={18} className="text-slate-300" />
            </div>
            <p className="text-[11px] text-slate-400">Sin tareas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tareas.map((tarea) => {
              const fv = new Date(tarea.fechaVencimiento!);
              return (
                <div
                  key={tarea.id}
                  className="p-2.5 bg-slate-50/80 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer group"
                  onClick={() => onVerTarea(tarea)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: estadoColores[tarea.estado] }}
                        />
                        <span className="text-[10px] font-bold text-slate-700 truncate">
                          {fv.getHours().toString().padStart(2, "0")}:{fv.getMinutes().toString().padStart(2, "0")}
                        </span>
                      </div>
                      <h4 className="text-[11px] font-semibold text-slate-800 truncate pl-3.5">
                        {tarea.titulo}
                      </h4>
                      {tarea.leadNombre && (
                        <p className="text-[9px] text-slate-400 truncate pl-3.5 mt-0.5">
                          {tarea.leadNombre}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerTarea(tarea);
                        }}
                        className="p-1 hover:bg-white rounded transition-colors"
                      >
                        <Eye size={10} className="text-blue-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditarTarea(tarea);
                        }}
                        className="p-1 hover:bg-white rounded transition-colors"
                      >
                        <Pencil size={10} className="text-amber-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
