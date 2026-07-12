"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronRight, Building2, TrendingUp, Award, BarChart3 } from "lucide-react";
import { useLeads } from "@/lib/contexts/LeadContext";
import { formatoMonedaAbreviado, formatoUF } from "@/lib/utils";

const COLORES_BANCOS: Record<string, string> = {
  "Banco de Chile": "#1A56DB",
  "Santander": "#EC0000",
  "Bci": "#0071CE",
  "Itaú": "#F7941D",
  "Scotiabank": "#EC0000",
};

export function RendimientoBancos() {
  const { leads } = useLeads();

  const datos = useMemo(() => {
    const porBanco: Record<string, { monto: number; cantidad: number }> = {};
    leads.forEach((l) => {
      const banco = l.banco || "Sin banco";
      if (!porBanco[banco]) porBanco[banco] = { monto: 0, cantidad: 0 };
      porBanco[banco].monto += l.montoSolicitado || 0;
      porBanco[banco].cantidad += 1;
    });

    return Object.entries(porBanco)
      .map(([nombre, data]) => ({
        nombre,
        montoTotal: data.monto,
        creditos: data.cantidad,
        color: COLORES_BANCOS[nombre] || "#6B7280",
        tendencia: 0,
      }))
      .sort((a, b) => b.montoTotal - a.montoTotal);
  }, [leads]);

  const totalMontos = datos.reduce((acc, b) => acc + b.montoTotal, 0);
  const bancoLider = datos[0];

  if (datos.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Rendimiento por banco</h3>
        <p className="text-[11px] text-slate-400 text-center py-8">Sin datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Rendimiento por banco</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Distribución de créditos</p>
        </div>
      </div>

      {bancoLider && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 mb-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: bancoLider.color }}>
                {bancoLider.nombre.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Banco líder</div>
                <div className="text-[13px] font-bold">{bancoLider.nombre}</div>
                <div className="text-[10px] text-slate-400">{bancoLider.creditos} créditos &bull; {formatoMonedaAbreviado(bancoLider.montoTotal)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[14px] font-bold text-emerald-400">
                +{bancoLider.tendencia > 0 ? bancoLider.tendencia : 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {datos.map((banco, i) => {
          const porcentaje = totalMontos > 0 ? (banco.montoTotal / totalMontos) * 100 : 0;
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: banco.color }} />
                  <span className="text-[11px] font-semibold text-slate-700">{banco.nombre}</span>
                  <span className="text-[10px] text-slate-400">{banco.creditos} créditos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-700">{formatoMonedaAbreviado(banco.montoTotal)}</span>
                  {banco.tendencia > 0 && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+{banco.tendencia}%</span>}
                  {banco.tendencia < 0 && <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded">{banco.tendencia}%</span>}
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${porcentaje}%`, backgroundColor: banco.color }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium">Total financiado</span>
          <div className="text-right">
            <div className="text-[12px] font-bold text-slate-700">{formatoMonedaAbreviado(totalMontos)}</div>
            <div className="text-[10px] text-slate-400">{formatoUF(totalMontos)}</div>
          </div>
        </div>
      </div>

      <Link href="/bancos" className="flex items-center justify-center gap-1 mt-3 py-2 text-[11px] text-blue-600 font-semibold hover:bg-blue-50 rounded-xl transition-colors">
        Ver todos <ChevronRight size={14} />
      </Link>
    </div>
  );
}
