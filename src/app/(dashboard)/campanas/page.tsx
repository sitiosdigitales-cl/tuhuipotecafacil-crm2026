"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  DollarSign,
  Eye,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  MousePointerClick,
  RefreshCw,
  Send,
  Smartphone,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { formatoMoneda, formatoMonedaAbreviado } from "@/lib/utils";

type EstadoCampana = "ACTIVA" | "PROGRAMADA" | "PAUSADA" | "FINALIZADA";
type TipoCampana = "EMAIL" | "WHATSAPP" | "SMS" | "REDES_SOCIALES" | "REFERIDO";
type TabCampana = "todas" | "activas" | "programadas" | "finalizadas";

interface CampanaApi {
  id: string;
  nombre: string;
  tipo: TipoCampana;
  estado: EstadoCampana;
  descripcion?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  presupuesto?: number | string | null;
  gastado?: number | string | null;
  audiencia?: number | string | null;
  enviados?: number | string | null;
  abiertos?: number | string | null;
  clics?: number | string | null;
  conversiones?: number | string | null;
  ingresos?: number | string | null;
  roi?: number | string | null;
  segmento?: string | null;
  plantilla?: string | null;
  creador?: string | null;
  creadoEn?: string | null;
}

interface Campana {
  id: string;
  nombre: string;
  tipo: TipoCampana;
  estado: EstadoCampana;
  descripcion: string;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  presupuesto: number;
  gastado: number;
  audiencia: number;
  enviados: number;
  abiertos: number;
  clics: number;
  conversiones: number;
  ingresos: number;
  roi: number;
  segmento: string;
  plantilla: string;
  creador: string;
  creadoEn: Date;
}

interface RespuestaCampanas {
  success: boolean;
  data?: CampanaApi[];
  error?: string;
}

const estadoConfig: Record<EstadoCampana, { label: string; classes: string }> = {
  ACTIVA: { label: "Activa", classes: "bg-emerald-50 text-emerald-700" },
  FINALIZADA: { label: "Finalizada", classes: "bg-slate-100 text-slate-700" },
  PAUSADA: { label: "Pausada", classes: "bg-amber-50 text-amber-700" },
  PROGRAMADA: { label: "Programada", classes: "bg-blue-50 text-blue-700" },
};

const tipoConfig: Record<TipoCampana, { label: string; classes: string; icono: LucideIcon }> = {
  EMAIL: { label: "Email", classes: "bg-blue-50 text-blue-700", icono: Mail },
  REFERIDO: { label: "Referidos", classes: "bg-amber-50 text-amber-700", icono: Users },
  REDES_SOCIALES: { label: "Redes sociales", classes: "bg-pink-50 text-pink-700", icono: Users },
  SMS: { label: "SMS", classes: "bg-purple-50 text-purple-700", icono: Smartphone },
  WHATSAPP: { label: "WhatsApp", classes: "bg-green-50 text-green-700", icono: MessageSquare },
};

function numero(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fecha(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function porcentaje(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

function normalizarCampana(row: CampanaApi): Campana {
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    estado: row.estado,
    descripcion: row.descripcion || "Sin descripción",
    fechaInicio: fecha(row.fechaInicio),
    fechaFin: fecha(row.fechaFin),
    presupuesto: numero(row.presupuesto),
    gastado: numero(row.gastado),
    audiencia: numero(row.audiencia),
    enviados: numero(row.enviados),
    abiertos: numero(row.abiertos),
    clics: numero(row.clics),
    conversiones: numero(row.conversiones),
    ingresos: numero(row.ingresos),
    roi: numero(row.roi),
    segmento: row.segmento || "Sin segmento",
    plantilla: row.plantilla || "Sin plantilla",
    creador: row.creador || "Sin responsable",
    creadoEn: fecha(row.creadoEn) || new Date(0),
  };
}

async function solicitarCampanas(signal?: AbortSignal): Promise<Campana[]> {
  const response = await fetch("/api/campanas", { credentials: "include", signal });
  const body = (await response.json().catch(() => null)) as RespuestaCampanas | null;

  if (!response.ok || !body?.success || !Array.isArray(body.data)) {
    throw new Error(body?.error || "No se pudieron cargar las campañas");
  }

  return body.data.map(normalizarCampana);
}

export default function CampanasPage() {
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [tabActiva, setTabActiva] = useState<TabCampana>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoCampana | "todos">("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarCampanas = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      setCampanas(await solicitarCampanas());
    } catch (cause) {
      setCampanas([]);
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar las campañas");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    solicitarCampanas(controller.signal)
      .then((data) => {
        setCampanas(data);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setCampanas([]);
        setError(cause instanceof Error ? cause.message : "No se pudieron cargar las campañas");
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });

    return () => controller.abort();
  }, []);

  const stats = useMemo(() => {
    const total = campanas.reduce(
      (acumulado, campana) => {
        acumulado.abiertos += campana.abiertos;
        acumulado.clics += campana.clics;
        acumulado.conversiones += campana.conversiones;
        acumulado.enviados += campana.enviados;
        acumulado.gastado += campana.gastado;
        acumulado.ingresos += campana.ingresos;
        acumulado.presupuesto += campana.presupuesto;
        acumulado.roi += campana.roi;
        acumulado.estados[campana.estado] += 1;
        return acumulado;
      },
      {
        abiertos: 0,
        clics: 0,
        conversiones: 0,
        enviados: 0,
        gastado: 0,
        ingresos: 0,
        presupuesto: 0,
        roi: 0,
        estados: { ACTIVA: 0, FINALIZADA: 0, PAUSADA: 0, PROGRAMADA: 0 },
      }
    );

    return {
      ...total,
      totalCampanas: campanas.length,
      roiPromedio: campanas.length > 0 ? Math.round(total.roi / campanas.length) : 0,
    };
  }, [campanas]);

  const campanasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es-CL");

    return campanas
      .filter((campana) => {
        const coincideTab =
          tabActiva === "todas" ||
          (tabActiva === "activas" && campana.estado === "ACTIVA") ||
          (tabActiva === "programadas" && campana.estado === "PROGRAMADA") ||
          (tabActiva === "finalizadas" && ["FINALIZADA", "PAUSADA"].includes(campana.estado));
        const coincideTexto =
          !texto ||
          campana.nombre.toLocaleLowerCase("es-CL").includes(texto) ||
          campana.descripcion.toLocaleLowerCase("es-CL").includes(texto);
        const coincideTipo = filtroTipo === "todos" || campana.tipo === filtroTipo;
        return coincideTab && coincideTexto && coincideTipo;
      })
      .sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime());
  }, [busqueda, campanas, filtroTipo, tabActiva]);

  const tabs: { id: TabCampana; label: string; count: number }[] = [
    { id: "todas", label: "Todas", count: stats.totalCampanas },
    { id: "activas", label: "Activas", count: stats.estados.ACTIVA },
    { id: "programadas", label: "Programadas", count: stats.estados.PROGRAMADA },
    {
      id: "finalizadas",
      label: "Finalizadas",
      count: stats.estados.FINALIZADA + stats.estados.PAUSADA,
    },
  ];

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-red-600 p-6 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Campañas de Marketing</h1>
            <p className="mt-1 text-[11px] font-medium text-pink-100">
              Rendimiento calculado desde registros almacenados en el CRM
            </p>
          </div>
          <button
            type="button"
            onClick={() => void cargarCampanas()}
            disabled={cargando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-[11px] font-semibold transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
        <div className="relative mt-5 flex gap-7 text-center">
          <ResumenCabecera label="Total" value={stats.totalCampanas} />
          <ResumenCabecera label="Activas" value={stats.estados.ACTIVA} />
          <ResumenCabecera label="ROI promedio" value={`${stats.roiPromedio}%`} />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Métricas de campañas">
        <Kpi icono={Send} label="Enviados" value={stats.enviados.toLocaleString("es-CL")} detail="mensajes" />
        <Kpi icono={Eye} label="Tasa apertura" value={`${porcentaje(stats.abiertos, stats.enviados)}%`} detail={`${stats.abiertos.toLocaleString("es-CL")} aperturas`} />
        <Kpi icono={MousePointerClick} label="Tasa clics" value={`${porcentaje(stats.clics, stats.abiertos)}%`} detail={`${stats.clics.toLocaleString("es-CL")} clics`} />
        <Kpi icono={Target} label="Conversiones" value={stats.conversiones.toLocaleString("es-CL")} detail={`${formatoMonedaAbreviado(stats.ingresos)} ingresos`} />
      </section>

      <section className="rounded-2xl border border-slate-100/80 bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <DollarSign size={16} className="text-emerald-500" /> Presupuesto registrado
          </h2>
          <span className="text-[11px] font-semibold text-slate-500">
            {formatoMoneda(stats.gastado)} / {formatoMoneda(stats.presupuesto)}
          </span>
        </div>
        <div className="mb-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
            style={{ width: `${Math.min(100, porcentaje(stats.gastado, stats.presupuesto))}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{porcentaje(stats.gastado, stats.presupuesto)}% utilizado</span>
          <span>{formatoMoneda(Math.max(0, stats.presupuesto - stats.gastado))} restante</span>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100/80 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTabActiva(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-semibold transition-all ${
                  tabActiva === tab.id
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 ${tabActiva === tab.id ? "bg-white/20" : "bg-slate-200"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              aria-label="Buscar campaña"
              placeholder="Buscar campaña..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              className="h-9 rounded-xl border border-slate-200/60 bg-slate-50 px-3 text-[11px] text-slate-600 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10"
            />
            <select
              aria-label="Filtrar por tipo"
              value={filtroTipo}
              onChange={(event) => setFiltroTipo(event.target.value as TipoCampana | "todos")}
              className="h-9 rounded-xl border border-slate-200/60 bg-slate-50 px-3 text-[11px] text-slate-600 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10"
            >
              <option value="todos">Todos los tipos</option>
              {Object.entries(tipoConfig).map(([id, config]) => (
                <option key={id} value={id}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {cargando ? (
        <EstadoMensaje icono={Loader2} texto="Cargando campañas..." animado />
      ) : error ? (
        <EstadoMensaje icono={Clock3} texto={error} />
      ) : campanasFiltradas.length === 0 ? (
        <EstadoMensaje icono={FileText} texto="No hay campañas para este filtro" />
      ) : (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-label="Campañas registradas">
          {campanasFiltradas.map((campana) => (
            <CampanaCard key={campana.id} campana={campana} />
          ))}
        </section>
      )}
    </div>
  );
}

function CampanaCard({ campana }: { campana: Campana }) {
  const tipo = tipoConfig[campana.tipo] || tipoConfig.EMAIL;
  const estado = estadoConfig[campana.estado] || estadoConfig.PROGRAMADA;
  const IconoTipo = tipo.icono;

  return (
    <article className="rounded-2xl border border-slate-100/80 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tipo.classes}`}>
            <IconoTipo size={17} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-bold text-slate-800">{campana.nombre}</h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${tipo.classes}`}>{tipo.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${estado.classes}`}>{estado.label}</span>
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] font-bold text-slate-700">{formatoMonedaAbreviado(campana.presupuesto)}</div>
          <div className="text-[9px] text-slate-400">presupuesto</div>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-[10px] text-slate-500">{campana.descripcion}</p>

      <dl className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3 text-center">
        <Metrica label="Enviados" value={campana.enviados.toLocaleString("es-CL")} />
        <Metrica label="Apertura" value={`${porcentaje(campana.abiertos, campana.enviados)}%`} />
        <Metrica label="Clics" value={`${porcentaje(campana.clics, campana.abiertos)}%`} />
        <Metrica label="Conversiones" value={campana.conversiones.toLocaleString("es-CL")} />
      </dl>

      <div className="mt-4 grid gap-2 text-[10px] text-slate-500 sm:grid-cols-2">
        <Info icono={Calendar} texto={periodoCampana(campana)} />
        <Info icono={Users} texto={campana.segmento} />
        <Info icono={FileText} texto={campana.plantilla} />
        <Info icono={CheckCircle2} texto={`${campana.creador} · ROI ${campana.roi}%`} />
      </div>
    </article>
  );
}

function periodoCampana(campana: Campana): string {
  if (!campana.fechaInicio && !campana.fechaFin) return "Sin periodo definido";
  const inicio = campana.fechaInicio?.toLocaleDateString("es-CL") || "Sin inicio";
  const fin = campana.fechaFin?.toLocaleDateString("es-CL") || "Sin fin";
  return `${inicio} — ${fin}`;
}

function ResumenCabecera({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[10px] text-pink-100">{label}</div>
    </div>
  );
}

function Kpi({
  icono: Icono,
  label,
  value,
  detail,
}: {
  icono: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100/80 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
          <Icono size={18} />
        </div>
        <span className="text-[10px] font-medium text-slate-400">{label}</span>
      </div>
      <div className="text-xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-[10px] text-slate-400">{detail}</div>
    </div>
  );
}

function Metrica({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-[12px] font-bold text-slate-700">{value}</dd>
    </div>
  );
}

function Info({ icono: Icono, texto }: { icono: LucideIcon; texto: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Icono size={12} className="shrink-0 text-slate-400" />
      <span className="truncate">{texto}</span>
    </div>
  );
}

function EstadoMensaje({
  icono: Icono,
  texto,
  animado = false,
}: {
  icono: LucideIcon;
  texto: string;
  animado?: boolean;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100/80 bg-white px-6 text-center shadow-soft">
      <Icono size={24} className={`text-slate-300 ${animado ? "animate-spin" : ""}`} />
      <p className="text-[12px] font-medium text-slate-500">{texto}</p>
    </div>
  );
}
