"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  Landmark,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { formatoMoneda, formatoMonedaAbreviado } from "@/lib/utils";

interface Comision {
  id: string;
  ejecutivoId: string;
  ejecutivoNombre: string;
  mes: string;
  anio: number;
  creditosAprobados: number;
  montoTotal: number;
  tasaComision: number;
  comisionTotal: number;
  pagado: boolean;
}

interface RespuestaComisiones {
  success: boolean;
  data?: Comision[];
  error?: string;
}

function numero(value: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function solicitarComisiones(signal?: AbortSignal): Promise<Comision[]> {
  const response = await fetch("/api/comisiones", {
    credentials: "include",
    signal,
  });
  const body = (await response.json().catch(() => null)) as RespuestaComisiones | null;

  if (!response.ok || !body?.success || !Array.isArray(body.data)) {
    throw new Error(body?.error || "No se pudieron cargar las comisiones");
  }

  return body.data;
}

export default function ComisionesPage() {
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  const cargarComisiones = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      setComisiones(await solicitarComisiones());
    } catch (cause) {
      setComisiones([]);
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar las comisiones");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    solicitarComisiones(controller.signal)
      .then((data) => {
        setComisiones(data);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setComisiones([]);
        setError(cause instanceof Error ? cause.message : "No se pudieron cargar las comisiones");
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });

    return () => controller.abort();
  }, []);

  const stats = useMemo(() => {
    return comisiones.reduce(
      (totales, comision) => {
        const total = numero(comision.comisionTotal);
        totales.totalComisiones += total;
        totales.montoFinanciado += numero(comision.montoTotal);
        totales.creditosAprobados += numero(comision.creditosAprobados);

        if (comision.pagado) {
          totales.totalPagado += total;
        } else {
          totales.totalPendiente += total;
        }

        return totales;
      },
      {
        creditosAprobados: 0,
        montoFinanciado: 0,
        totalComisiones: 0,
        totalPagado: 0,
        totalPendiente: 0,
      }
    );
  }, [comisiones]);

  async function cambiarEstadoPago(comision: Comision) {
    const nuevoEstado = !comision.pagado;
    setActualizandoId(comision.id);

    try {
      const response = await fetch(`/api/comisiones/${encodeURIComponent(comision.id)}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagado: nuevoEstado }),
      });
      const body = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !body?.success) {
        throw new Error(body?.error || "No se pudo actualizar la comisión");
      }

      setComisiones((actuales) =>
        actuales.map((actual) =>
          actual.id === comision.id ? { ...actual, pagado: nuevoEstado } : actual
        )
      );
      toast.success(nuevoEstado ? "Comisión marcada como pagada" : "Comisión marcada como pendiente");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "No se pudo actualizar la comisión");
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 p-6 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Comisiones</h1>
            <p className="mt-1 text-[11px] font-medium text-emerald-100">
              Registros financieros almacenados en el CRM
            </p>
          </div>
          <button
            type="button"
            onClick={() => void cargarComisiones()}
            disabled={cargando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-[11px] font-semibold transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-5" aria-label="Resumen de comisiones">
        <Kpi
          icono={DollarSign}
          etiqueta="Total comisiones"
          valor={formatoMonedaAbreviado(stats.totalComisiones)}
          color="emerald"
        />
        <Kpi
          icono={CheckCircle2}
          etiqueta="Pagadas"
          valor={formatoMonedaAbreviado(stats.totalPagado)}
          color="blue"
        />
        <Kpi
          icono={Clock3}
          etiqueta="Pendientes"
          valor={formatoMonedaAbreviado(stats.totalPendiente)}
          color="amber"
        />
        <Kpi
          icono={FileText}
          etiqueta="Créditos aprobados"
          valor={String(stats.creditosAprobados)}
          color="purple"
        />
        <Kpi
          icono={Landmark}
          etiqueta="Monto financiado"
          valor={formatoMonedaAbreviado(stats.montoFinanciado)}
          color="cyan"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-soft">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Comisiones registradas</h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Solo se muestran datos persistidos; esta vista no completa cifras con ejemplos.
            </p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            {comisiones.length} {comisiones.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        {cargando ? (
          <EstadoMensaje icono={Loader2} texto="Cargando comisiones..." animado />
        ) : error ? (
          <EstadoMensaje icono={Clock3} texto={error} />
        ) : comisiones.length === 0 ? (
          <EstadoMensaje icono={FileText} texto="No hay comisiones registradas" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <Encabezado>Ejecutivo</Encabezado>
                  <Encabezado>Periodo</Encabezado>
                  <Encabezado align="right">Créditos</Encabezado>
                  <Encabezado align="right">Monto financiado</Encabezado>
                  <Encabezado align="right">Tasa</Encabezado>
                  <Encabezado align="right">Comisión</Encabezado>
                  <Encabezado align="center">Estado</Encabezado>
                  <Encabezado align="right">Acción</Encabezado>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {comisiones.map((comision) => (
                  <tr key={comision.id} className="transition-colors hover:bg-slate-50/60">
                    <Celda>
                      <div className="font-semibold text-slate-700">{comision.ejecutivoNombre}</div>
                      <div className="mt-0.5 text-[9px] text-slate-400">ID: {comision.ejecutivoId}</div>
                    </Celda>
                    <Celda>{comision.mes} {comision.anio}</Celda>
                    <Celda align="right">{numero(comision.creditosAprobados)}</Celda>
                    <Celda align="right" className="font-semibold text-blue-600">
                      {formatoMoneda(numero(comision.montoTotal))}
                    </Celda>
                    <Celda align="right">{numero(comision.tasaComision)}%</Celda>
                    <Celda align="right" className="font-bold text-emerald-600">
                      {formatoMoneda(numero(comision.comisionTotal))}
                    </Celda>
                    <Celda align="center">
                      <span
                        className={`inline-flex rounded-lg px-2 py-1 text-[9px] font-bold ${
                          comision.pagado
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {comision.pagado ? "Pagada" : "Pendiente"}
                      </span>
                    </Celda>
                    <Celda align="right">
                      <button
                        type="button"
                        onClick={() => void cambiarEstadoPago(comision)}
                        disabled={actualizandoId === comision.id}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actualizandoId === comision.id
                          ? "Guardando..."
                          : comision.pagado
                            ? "Marcar pendiente"
                            : "Marcar pagada"}
                      </button>
                    </Celda>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const kpiColors = {
  emerald: "bg-emerald-100 text-emerald-600",
  blue: "bg-blue-100 text-blue-600",
  amber: "bg-amber-100 text-amber-600",
  purple: "bg-purple-100 text-purple-600",
  cyan: "bg-cyan-100 text-cyan-600",
} as const;

const textAlign = {
  center: "text-center",
  left: "text-left",
  right: "text-right",
} as const;

function Kpi({
  icono: Icono,
  etiqueta,
  valor,
  color,
}: {
  icono: typeof DollarSign;
  etiqueta: string;
  valor: string;
  color: keyof typeof kpiColors;
}) {
  return (
    <div className="rounded-2xl border border-slate-100/80 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpiColors[color]}`}>
          <Icono size={18} />
        </div>
        <span className="text-[10px] font-medium text-slate-400">{etiqueta}</span>
      </div>
      <div className="text-lg font-bold text-slate-800">{valor}</div>
    </div>
  );
}

function EstadoMensaje({
  icono: Icono,
  texto,
  animado = false,
}: {
  icono: typeof FileText;
  texto: string;
  animado?: boolean;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 text-center">
      <Icono size={24} className={`text-slate-300 ${animado ? "animate-spin" : ""}`} />
      <p className="text-[12px] font-medium text-slate-500">{texto}</p>
    </div>
  );
}

function Encabezado({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <th className={`px-4 py-3 ${textAlign[align]} text-[9px] font-bold uppercase tracking-wide text-slate-400`}>
      {children}
    </th>
  );
}

function Celda({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 ${textAlign[align]} text-[11px] text-slate-600 ${className}`}>
      {children}
    </td>
  );
}
