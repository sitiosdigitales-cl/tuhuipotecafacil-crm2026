"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronRight, Medal, Crown } from "lucide-react";
import { useLeads } from "@/modulos/leads";
import { formatoMonedaAbreviado } from "@/lib/utils";

const COLORES = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899"];

export function RankingEjecutivos() {
  const { leads } = useLeads();

  const ejecutivos = useMemo(() => {
    const porEjecutivo: Record<string, { monto: number; cantidad: number; aprobados: number }> = {};
    leads.forEach((l) => {
      const nombre = l.nombreEjecutivo || "Sin asignar";
      if (!porEjecutivo[nombre]) porEjecutivo[nombre] = { monto: 0, cantidad: 0, aprobados: 0 };
      porEjecutivo[nombre].monto += l.montoSolicitado || 0;
      porEjecutivo[nombre].cantidad += 1;
      if (["APROBADO", "FIRMA_DIGITAL", "NOTARIA"].includes(l.etapa)) {
        porEjecutivo[nombre].aprobados += 1;
      }
    });

    return Object.entries(porEjecutivo)
      .filter(([nombre]) => nombre !== "Sin asignar")
      .map(([nombre, data], i) => ({
        nombre,
        montoTotal: data.monto,
        leads: data.cantidad,
        aprobados: data.aprobados,
        conversion: data.cantidad > 0 ? Math.round((data.aprobados / data.cantidad) * 100) : 0,
        ticketPromedio: data.aprobados > 0 ? Math.round(data.monto / data.aprobados) : 0,
        color: COLORES[i % COLORES.length],
      }))
      .sort((a, b) => b.montoTotal - a.montoTotal);
  }, [leads]);

  if (ejecutivos.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Ranking ejecutivos</h3>
        <p className="text-[11px] text-slate-400 text-center py-8">Sin datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Ranking ejecutivos</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Top performers del mes</p>
        </div>
      </div>

      {/* Podio top 3 */}
      {ejecutivos.length >= 3 && (
        <div className="flex items-end justify-center gap-2 mb-4">
          {[1, 0, 2].map((pos) => {
            const ej = ejecutivos[pos];
            if (!ej) return null;
            const heights = ["h-16", "h-20", "h-14"];
            const icons = [<Medal size={14} />, <Crown size={16} />, <Medal size={14} />];
            const bgColors = ["from-slate-300 to-slate-400", "from-amber-400 to-amber-500", "from-amber-600 to-amber-700"];
            return (
              <div key={pos} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${ej.color} flex items-center justify-center text-white text-[10px] font-bold mb-1`}>
                  {ej.nombre.split(" ").map(n => n[0]).join("")}
                </div>
                <span className="text-[9px] font-semibold text-slate-700 mb-1">{ej.nombre.split(" ")[0]}</span>
                <div className={`w-16 ${heights[pos]} bg-gradient-to-br ${bgColors[pos]} rounded-t-lg flex items-center justify-center text-white`}>
                  {icons[pos]}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista de ejecutivos */}
      <div className="space-y-2">
        {ejecutivos.slice(0, 5).map((ej, i) => (
          <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: ej.color }}>
              {ej.nombre.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-slate-800 truncate">{ej.nombre}</div>
              <div className="text-[9px] text-slate-400">{ej.aprobados} aprobados &bull; {ej.conversion}% conv.</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-800">{formatoMonedaAbreviado(ej.montoTotal)}</div>
              <div className="text-[9px] text-slate-400">{formatoMonedaAbreviado(ej.ticketPromedio)}</div>
            </div>
          </div>
        ))}
      </div>

      <Link href="/usuarios" className="flex items-center justify-center gap-1 mt-3 py-2 text-[11px] text-blue-600 font-semibold hover:bg-blue-50 rounded-xl transition-colors">
        Ver ranking completo <ChevronRight size={14} />
      </Link>
    </div>
  );
}
