"use client";

import Link from "next/link";
import { useMemo } from "react";
import { TrendingUp, DollarSign, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { useLeads } from "@/modulos/leads";
import { formatoMoneda } from "@/lib/utils";

const COMISION_POR_CREDITO = 500000; // $500.000 por crédito aprobado

export function TarjetaComisiones() {
  const { leads } = useLeads();

  const comisiones = useMemo(() => {
    const aprobados = leads.filter((l) =>
      ["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CREDITO_PAGADO", "CLIENTE_FINALIZADO"].includes(l.etapa)
    );
    const total = aprobados.length * COMISION_POR_CREDITO;
    const pagadas = leads.filter((l) =>
      ["CREDITO_PAGADO", "CLIENTE_FINALIZADO"].includes(l.etapa)
    ).length * COMISION_POR_CREDITO;
    const pendientes = total - pagadas;

    // Top ejecutivos por comisiones
    const porEjecutivo: Record<string, { comision: number; aprobados: number }> = {};
    aprobados.forEach((l) => {
      const nombre = l.nombreEjecutivo || "Sin asignar";
      if (!porEjecutivo[nombre]) porEjecutivo[nombre] = { comision: 0, aprobados: 0 };
      porEjecutivo[nombre].comision += COMISION_POR_CREDITO;
      porEjecutivo[nombre].aprobados += 1;
    });

    const topEjecutivos = Object.entries(porEjecutivo)
      .filter(([n]) => n !== "Sin asignar")
      .map(([nombre, data]) => ({
        nombre: nombre.split(" ")[0] + " " + (nombre.split(" ")[1]?.[0] || ""),
        ...data,
      }))
      .sort((a, b) => b.comision - a.comision)
      .slice(0, 3);

    return {
      total,
      pagadas,
      pendientes,
      progresoPagado: total > 0 ? (pagadas / total) * 100 : 0,
      topEjecutivos,
      creditosAprobados: aprobados.length,
    };
  }, [leads]);

  if (leads.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Comisiones del mes</h3>
        <p className="text-[11px] text-slate-400 text-center py-8">Sin datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Comisiones del mes</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            {comisiones.creditosAprobados} créditos aprobados
          </p>
        </div>
      </div>

      {/* Monto total */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 mb-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <DollarSign size={16} className="text-white" />
          </div>
          <span className="text-[11px] text-blue-100 font-medium">Total comisiones</span>
        </div>
        <div className="text-[24px] font-bold tracking-tight">{formatoMoneda(comisiones.total)}</div>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-md">
            <TrendingUp size={10} />
            <span className="text-[10px] font-semibold">{comisiones.creditosAprobados} créditos</span>
          </div>
          <span className="text-[10px] text-blue-200">x ${COMISION_POR_CREDITO.toLocaleString("es-CL")} c/u</span>
        </div>
      </div>

      {/* Estados de comisiones */}
      <div className="space-y-2.5 mb-4">
        <div className="flex items-center justify-between p-2.5 bg-amber-50/80 rounded-xl border border-amber-100/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock size={14} className="text-amber-600" />
            </div>
            <div>
              <span className="text-[11px] text-slate-700 font-semibold block">Pendientes</span>
              <span className="text-[11px] text-slate-400">
                {comisiones.total > 0 ? ((comisiones.pendientes / comisiones.total) * 100).toFixed(0) : 0}% del total
              </span>
            </div>
          </div>
          <span className="text-[12px] font-bold text-amber-700">{formatoMoneda(comisiones.pendientes)}</span>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-100/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={14} className="text-emerald-600" />
            </div>
            <div>
              <span className="text-[11px] text-slate-700 font-semibold block">Pagadas</span>
              <span className="text-[11px] text-slate-400">{comisiones.progresoPagado.toFixed(0)}% cobrado</span>
            </div>
          </div>
          <span className="text-[12px] font-bold text-emerald-700">{formatoMoneda(comisiones.pagadas)}</span>
        </div>
      </div>

      {/* Barra de progreso global */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Progreso de cobro</span>
          <span className="text-[10px] font-bold text-slate-700">{comisiones.progresoPagado.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${comisiones.progresoPagado}%` }}
          />
        </div>
      </div>

      {/* Top ejecutivos */}
      {comisiones.topEjecutivos.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-medium">Top ejecutivos</span>
            <Link href="/comisiones" className="text-[11px] text-blue-600 font-semibold hover:text-blue-700">Ver todos</Link>
          </div>
          <div className="space-y-1.5">
            {comisiones.topEjecutivos.map((ejecutivo, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-slate-50/80 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white ${
                    i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500' :
                    i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                    'bg-gradient-to-br from-amber-600 to-amber-700'
                  }`}>
                    {i + 1}
                  </div>
                  <span className="text-[10px] text-slate-700 font-medium">{ejecutivo.nombre}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-900">{formatoMoneda(ejecutivo.comision)}</span>
                  <span className="text-[10px] text-slate-400 block">{ejecutivo.aprobados} créditos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón de acción */}
      <Link href="/comisiones" className="w-full flex items-center justify-center gap-2 gradient-primary text-white text-[11px] font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15">
        Ver detalle de comisiones
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
