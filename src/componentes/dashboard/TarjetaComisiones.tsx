"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle, Wallet, Users, ArrowRight } from "lucide-react";
import { formatoMoneda, formatoUF } from "@/lib/utils";

const comisiones = {
  total: 245780000,
  pendientes: 98450000,
  aprobadas: 87630000,
  pagadas: 59700000,
  cambio: 16.3,
};

const topEjecutivos = [
  { nombre: "Andrés P.", comision: 42500000, aprobados: 38 },
  { nombre: "Carolina M.", comision: 35200000, aprobados: 32 },
  { nombre: "Diego S.", comision: 28900000, aprobados: 28 },
];

export function TarjetaComisiones() {
  const totalMesAnterior = comisiones.total / (1 + comisiones.cambio / 100);
  const progresoPagado = (comisiones.pagadas / comisiones.total) * 100;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Comisiones del mes</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Resumen de ganancias</p>
        </div>
        <select className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10">
          <option>Julio 2026</option>
          <option>Junio 2026</option>
          <option>Mayo 2026</option>
        </select>
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
        <div className="text-[12px] text-blue-200 font-medium mt-0.5">{formatoUF(comisiones.total)}</div>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-md">
            <TrendingUp size={10} />
            <span className="text-[10px] font-semibold">+{comisiones.cambio}%</span>
          </div>
          <span className="text-[10px] text-blue-200">vs mes anterior</span>
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
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block">Pendientes</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{((comisiones.pendientes / comisiones.total) * 100).toFixed(0)}% del total</span>
            </div>
          </div>
          <span className="text-[12px] font-bold text-amber-700">{formatoMoneda(comisiones.pendientes)}</span>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-blue-50/80 rounded-xl border border-blue-100/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet size={14} className="text-blue-600" />
            </div>
            <div>
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block">Aprobadas</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{((comisiones.aprobadas / comisiones.total) * 100).toFixed(0)}% del total</span>
            </div>
          </div>
          <span className="text-[12px] font-bold text-blue-700">{formatoMoneda(comisiones.aprobadas)}</span>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-100/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={14} className="text-emerald-600" />
            </div>
            <div>
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block">Pagadas</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{progresoPagado.toFixed(0)}% cobrado</span>
            </div>
          </div>
          <span className="text-[12px] font-bold text-emerald-700">{formatoMoneda(comisiones.pagadas)}</span>
        </div>
      </div>

      {/* Barra de progreso global */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Progreso de cobro</span>
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{progresoPagado.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${progresoPagado}%` }}
          />
        </div>
      </div>

      {/* Top ejecutivos */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Top ejecutivos</span>
          <Link href="/comisiones" className="text-[11px] text-blue-600 font-semibold hover:text-blue-700">Ver todos</Link>
        </div>
        <div className="space-y-1.5">
          {topEjecutivos.map((ejecutivo, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-slate-50/80 dark:bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white ${
                  i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500' :
                  i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                  'bg-gradient-to-br from-amber-600 to-amber-700'
                }`}>
                  {i + 1}
                </div>
                <span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium">{ejecutivo.nombre}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100">{formatoMoneda(ejecutivo.comision)}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{ejecutivo.aprobados} créditos</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botón de acción */}
      <Link href="/comisiones" className="w-full flex items-center justify-center gap-2 gradient-primary text-white text-[11px] font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15">
        Ver detalle de comisiones
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}