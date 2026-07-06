"use client";

import { useMemo } from "react";
import {
  ClipboardList,
  Clock,
  Play,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { ESTADOS_TAREA_CONFIG, TIPOS_TAREA_CONFIG } from "@/tipos";
import type { Tarea, EstadoTarea, TipoTarea } from "@/tipos";

interface DashboardTareasProps {
  tareas: Tarea[];
}

const estadoColores: Record<EstadoTarea, string> = {
  PENDIENTE: "#F59E0B",
  EN_PROGRESO: "#3B82F6",
  COMPLETADA: "#10B981",
  VENCIDA: "#EF4444",
};

const prioridadColores: Record<string, string> = {
  BAJA: "#94A3B8",
  MEDIA: "#3B82F6",
  ALTA: "#F97316",
  URGENTE: "#EF4444",
};

const ejecutivoColores = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-cyan-500 to-cyan-600",
];

export function DashboardTareas({ tareas }: DashboardTareasProps) {
  // eslint-disable-next-line react-hooks/purity -- Timestamp estable, calculado una vez
  const ahora = useMemo(() => Date.now(), []);
  const stats = useMemo(() => {
    const total = tareas.length;
    const pendientes = tareas.filter((t) => t.estado === "PENDIENTE").length;
    const enProgreso = tareas.filter((t) => t.estado === "EN_PROGRESO").length;
    const completadas = tareas.filter((t) => t.estado === "COMPLETADA").length;
    const vencidas = tareas.filter((t) => t.estado === "VENCIDA").length;

    const porTipo: Record<string, number> = {};
    tareas.forEach((t) => {
      porTipo[t.tipo] = (porTipo[t.tipo] || 0) + 1;
    });

    const porPrioridad: Record<string, number> = {};
    tareas.forEach((t) => {
      porPrioridad[t.prioridad] = (porPrioridad[t.prioridad] || 0) + 1;
    });

    const porEjecutivo: Record<string, { total: number; completadas: number; vencidas: number }> = {};
    tareas.forEach((t) => {
      if (t.nombreEjecutivo) {
        if (!porEjecutivo[t.nombreEjecutivo]) {
          porEjecutivo[t.nombreEjecutivo] = { total: 0, completadas: 0, vencidas: 0 };
        }
        porEjecutivo[t.nombreEjecutivo].total++;
        if (t.estado === "COMPLETADA") {
          porEjecutivo[t.nombreEjecutivo].completadas++;
        }
        if (t.estado === "VENCIDA") {
          porEjecutivo[t.nombreEjecutivo].vencidas++;
        }
      }
    });

    const proximasAVencer = tareas
      .filter((t) => {
        if (!t.fechaVencimiento || t.estado === "COMPLETADA") return false;
        return new Date(t.fechaVencimiento) > new Date();
      })
      .sort(
        (a, b) =>
          new Date(a.fechaVencimiento!).getTime() -
          new Date(b.fechaVencimiento!).getTime()
      )
      .slice(0, 5);

    const tareasUrgentes = tareas.filter(
      (t) =>
        (t.prioridad === "URGENTE" || t.prioridad === "ALTA") &&
        t.estado !== "COMPLETADA"
    );

    return {
      total,
      pendientes,
      enProgreso,
      completadas,
      vencidas,
      porTipo,
      porPrioridad,
      porEjecutivo,
      proximasAVencer,
      tareasUrgentes,
      tasaCompletado:
        total > 0 ? Math.round((completadas / total) * 100) : 0,
      tasaVencimiento:
        total > 0 ? Math.round((vencidas / total) * 100) : 0,
    };
  }, [tareas]);

  const maxEjecutivo = Math.max(
    ...Object.values(stats.porEjecutivo).map((e) => e.total),
    1
  );

  return (
    <div className="space-y-5">
      {/* KPIs Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICardPrincipal
          icon={<ClipboardList size={20} />}
          label="Total Tareas"
          value={stats.total}
          sublabel={`${stats.pendientes} pendientes`}
          color="blue"
          trend={null}
        />
        <KPICardPrincipal
          icon={<CheckCircle size={20} />}
          label="Completadas"
          value={stats.completadas}
          sublabel={`${stats.tasaCompletado}% tasa éxito`}
          color="emerald"
          trend={{ value: stats.tasaCompletado, isPositive: true }}
        />
        <KPICardPrincipal
          icon={<Play size={20} />}
          label="En Progreso"
          value={stats.enProgreso}
          sublabel="activas ahora"
          color="blue"
          trend={null}
        />
        <KPICardPrincipal
          icon={<AlertTriangle size={20} />}
          label="Vencidas"
          value={stats.vencidas}
          sublabel={`${stats.tasaVencimiento}% del total`}
          color="red"
          trend={{ value: stats.tasaVencimiento, isPositive: false }}
        />
      </div>

      {/* Fila de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Embudo de estados */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">
              Distribución por Estado
            </h3>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Target size={14} className="text-blue-500" />
            </div>
          </div>
          <div className="space-y-3">
            {(["PENDIENTE", "EN_PROGRESO", "COMPLETADA", "VENCIDA"] as EstadoTarea[]).map(
              (estado, idx) => {
                const count = stats[
                  estado === "PENDIENTE"
                    ? "pendientes"
                    : estado === "EN_PROGRESO"
                    ? "enProgreso"
                    : estado === "COMPLETADA"
                    ? "completadas"
                    : "vencidas"
                ];
                const porcentaje = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={estado} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: estadoColores[estado] }}
                        />
                        <span className="text-[11px] font-medium text-slate-600">
                          {ESTADOS_TAREA_CONFIG[estado].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-800">
                          {count}
                        </span>
                        <span className="text-[10px] text-slate-400 w-10 text-right">
                          {porcentaje.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${porcentaje}%`,
                          backgroundColor: estadoColores[estado],
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Distribución por tipo */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">
              Por Tipo de Tarea
            </h3>
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-purple-500" />
            </div>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.porTipo)
              .sort(([, a], [, b]) => b - a)
              .map(([tipo, count]) => {
                const config = TIPOS_TAREA_CONFIG[tipo as TipoTarea];
                const porcentaje = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={tipo} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${config.color}15` }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-slate-600">
                          {config.label}
                        </span>
                        <span className="text-[11px] font-bold text-slate-800">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${porcentaje}%`,
                            backgroundColor: config.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Prioridad con dona */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">
              Por Prioridad
            </h3>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={14} className="text-amber-500" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-6">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {(() => {
                  const entries = Object.entries(stats.porPrioridad);
                  const total = entries.reduce((s, [, v]) => s + v, 0);
                  let offset = 0;
                  return entries.map(([prioridad, count]) => {
                    const porcentaje = total > 0 ? (count / total) * 100 : 0;
                    const dash = porcentaje;
                    const el = (
                      <circle
                        key={prioridad}
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke={prioridadColores[prioridad] || "#94A3B8"}
                        strokeWidth="3.5"
                        strokeDasharray={`${dash} ${100 - dash}`}
                        strokeDashoffset={`${-offset}`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    );
                    offset += dash;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-800">
                  {stats.total}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">
                  tareas
                </span>
              </div>
            </div>
            <div className="space-y-2.5">
              {Object.entries(stats.porPrioridad).map(([prioridad, count]) => (
                <div key={prioridad} className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: prioridadColores[prioridad] || "#94A3B8",
                    }}
                  />
                  <div className="flex-1 min-w-[80px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-600 font-medium">
                        {prioridad}
                      </span>
                      <span className="text-[11px] font-bold text-slate-800 ml-3">
                        {count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fila 2: Ejecutivos + Próximas a vencer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ranking ejecutivos */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">
              Rendimiento por Ejecutivo
            </h3>
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <User size={14} className="text-indigo-500" />
            </div>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.porEjecutivo)
              .sort(([, a], [, b]) => b.total - a.total)
              .slice(0, 5)
              .map(([nombre, data], idx) => {
                const tasaExito = data.total > 0 ? Math.round((data.completadas / data.total) * 100) : 0;
                return (
                  <div
                    key={nombre}
                    className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="text-[10px] font-bold text-slate-400 w-4">
                      #{idx + 1}
                    </div>
                    <div className={`w-10 h-10 bg-gradient-to-br ${ejecutivoColores[idx % ejecutivoColores.length]} rounded-xl flex items-center justify-center text-[11px] font-bold text-white shadow-sm`}>
                      {nombre.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-700 truncate">
                          {nombre}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {data.vencidas > 0 && (
                            <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                              {data.vencidas} vencidas
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-600">
                            {data.completadas}/{data.total}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${maxEjecutivo > 0 ? (data.total / maxEjecutivo) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600">
                          {tasaExito}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Próximas a vencer + Urgentes */}
        <div className="space-y-4">
          {/* Próximas a vencer */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                Próximas a Vencer
              </h3>
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                <Calendar size={14} className="text-orange-500" />
              </div>
            </div>
            <div className="space-y-2">
              {stats.proximasAVencer.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <CheckCircle size={20} className="text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Todo al día
                  </p>
                </div>
              ) : (
                stats.proximasAVencer.map((t) => {
                  const fv = new Date(t.fechaVencimiento!);
                  const diasRestantes = Math.ceil(
                    (fv.getTime() - ahora) / 86400000
                  );
                  const esUrgente = diasRestantes <= 1;
                  const esCercano = diasRestantes <= 3;

                  return (
                    <div
                      key={t.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        esUrgente
                          ? "bg-red-50/80 border border-red-100"
                          : esCercano
                          ? "bg-amber-50/80 border border-amber-100"
                          : "bg-slate-50/80 border border-slate-100"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            esUrgente
                              ? "bg-red-100"
                              : esCercano
                              ? "bg-amber-100"
                              : "bg-blue-100"
                          }`}
                        >
                          <Calendar
                            size={16}
                            className={
                              esUrgente
                                ? "text-red-500"
                                : esCercano
                                ? "text-amber-500"
                                : "text-blue-500"
                            }
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-slate-700 truncate">
                          {t.titulo}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-slate-400">
                            {t.leadNombre || "Sin lead"}
                          </span>
                          <span className="text-[9px] text-slate-300">•</span>
                          <span className="text-[9px] text-slate-400">
                            {t.nombreEjecutivo?.split(" ")[0] || "Sin asignar"}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div
                          className={`text-[11px] font-bold ${
                            esUrgente
                              ? "text-red-600"
                              : esCercano
                              ? "text-amber-600"
                              : "text-blue-600"
                          }`}
                        >
                          {diasRestantes === 0
                            ? "Hoy"
                            : diasRestantes === 1
                            ? "Mañana"
                            : `${diasRestantes}d`}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          {fv.toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Tareas urgentes */}
          {stats.tareasUrgentes.length > 0 && (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Zap size={14} className="text-red-500" />
                  </div>
                  <h3 className="text-sm font-bold text-red-800">
                    Requieren Atención
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  {stats.tareasUrgentes.length}
                </span>
              </div>
              <div className="space-y-2">
                {stats.tareasUrgentes.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 p-2 bg-white/60 rounded-lg"
                  >
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-medium text-slate-700 truncate flex-1">
                      {t.titulo}
                    </span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      t.prioridad === "URGENTE"
                        ? "bg-red-100 text-red-600"
                        : "bg-orange-100 text-orange-600"
                    }`}>
                      {t.prioridad}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICardPrincipal({
  icon,
  label,
  value,
  sublabel,
  color,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sublabel: string;
  color: "blue" | "emerald" | "amber" | "red" | "purple" | "indigo";
  trend: { value: number; isPositive: boolean } | null;
}) {
  const colorStyles = {
    blue: {
      iconBg: "bg-blue-50",
      iconText: "text-blue-500",
      ring: "ring-blue-500/10",
    },
    emerald: {
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-500",
      ring: "ring-emerald-500/10",
    },
    amber: {
      iconBg: "bg-amber-50",
      iconText: "text-amber-500",
      ring: "ring-amber-500/10",
    },
    red: {
      iconBg: "bg-red-50",
      iconText: "text-red-500",
      ring: "ring-red-500/10",
    },
    purple: {
      iconBg: "bg-purple-50",
      iconText: "text-purple-500",
      ring: "ring-purple-500/10",
    },
    indigo: {
      iconBg: "bg-indigo-50",
      iconText: "text-indigo-500",
      ring: "ring-indigo-500/10",
    },
  };

  const styles = colorStyles[color];

  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 ${styles.iconBg} rounded-xl flex items-center justify-center ring-1 ${styles.ring}`}
        >
          <div className={styles.iconText}>{icon}</div>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-0.5 text-[10px] font-bold ${
              trend.isPositive ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {trend.isPositive ? (
              <ArrowUpRight size={12} />
            ) : (
              <ArrowDownRight size={12} />
            )}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-0.5">{value}</div>
      <div className="text-[11px] text-slate-500 font-medium">{label}</div>
      <div className="text-[10px] text-slate-400 mt-1">{sublabel}</div>
    </div>
  );
}
