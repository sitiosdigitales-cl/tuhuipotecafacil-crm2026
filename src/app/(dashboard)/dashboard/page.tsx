"use client";

import { TarjetasKPI } from "@/componentes/dashboard/TarjetasKPI";
import { GraficoEmbudo } from "@/componentes/dashboard/GraficoEmbudo";
import { GraficoConversion } from "@/componentes/dashboard/GraficoConversion";
import { LeadsPorOrigen } from "@/componentes/dashboard/LeadsPorOrigen";
import { RankingEjecutivos } from "@/componentes/dashboard/RankingEjecutivos";
import { RendimientoBancos } from "@/componentes/dashboard/RendimientoBancos";
import { AprobacionesMensuales } from "@/componentes/dashboard/AprobacionesMensuales";
import { TarjetaComisiones } from "@/componentes/dashboard/TarjetaComisiones";
import { ActividadTiempoReal } from "@/componentes/dashboard/ActividadTiempoReal";
import { useUserData } from "@/lib/hooks/useUserData";
import { formatoMonedaAbreviado } from "@/lib/utils";
import { Users, CheckCircle, DollarSign, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { usuarioActual, esSuperAdmin, stats, kpis } = useUserData();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-1">
              {esSuperAdmin ? "Panel de Control" : `Bienvenido, ${usuarioActual.nombre}`}
            </h2>
            <p className="text-blue-200 text-[10px] sm:text-[11px]">
              {esSuperAdmin
                ? `Vista consolidada • ${stats.totalLeads} leads totales`
                : `Tus estadísticas • ${stats.totalLeads} leads asignados`}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Users size={12} className="text-blue-200" />
                <span className="text-[9px] sm:text-[10px] text-blue-200">Leads</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalLeads}</div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <CheckCircle size={12} className="text-emerald-300" />
                <span className="text-[9px] sm:text-[10px] text-blue-200">Aprobados</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.aprobados}</div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <DollarSign size={12} className="text-blue-200" />
                <span className="text-[9px] sm:text-[10px] text-blue-200">Monto</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{formatoMonedaAbreviado(stats.montoTotal)}</div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <TrendingUp size={12} className="text-amber-300" />
                <span className="text-[9px] sm:text-[10px] text-blue-200">Conversión</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.tasaConversion}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <TarjetasKPI kpis={kpis} />

      {/* Fila 1: Embudo + Conversión + Leads por origen */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        <GraficoEmbudo />
        <GraficoConversion />
        <LeadsPorOrigen />
      </div>

      {/* Fila 2: Ejecutivos + Bancos + Aprobaciones + Comisiones */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <RankingEjecutivos />
        <RendimientoBancos />
        <AprobacionesMensuales />
        <TarjetaComisiones />
      </div>

      {/* Actividad en Tiempo Real */}
      <ActividadTiempoReal />
    </div>
  );
}
