"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useLeads } from "@/modulos/leads";
import { Target, Calendar } from "lucide-react";

const META_MENSUAL = 180;

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const vsMeta = data.aprobados - META_MENSUAL;
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={12} className="text-blue-500" />
          <span className="text-[11px] font-bold text-slate-800">{label} 2026</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Aprobados</div>
            <div className="text-[14px] font-bold text-slate-900">{data.aprobados}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">vs Meta</div>
            <div className={`text-[14px] font-bold ${vsMeta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {vsMeta >= 0 ? '+' : ''}{vsMeta}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function AprobacionesMensuales() {
  const { leads } = useLeads();

  const datos = useMemo(() => {
    const porMes: Record<number, number> = {};
    leads.forEach((l) => {
      if (["APROBADO", "FIRMA_DIGITAL", "NOTARIA"].includes(l.etapa)) {
        const fecha = new Date(l.creadoEn);
        const mes = fecha.getMonth();
        porMes[mes] = (porMes[mes] || 0) + 1;
      }
    });

    return MESES.map((mes, i) => ({
      mes,
      aprobados: porMes[i] || 0,
    }));
  }, [leads]);

  const totalAprobados = datos.reduce((acc, d) => acc + d.aprobados, 0);
  const mesActual = new Date().getMonth();
  const aprobadosMes = datos[mesActual]?.aprobados || 0;
  const vsMeta = aprobadosMes - META_MENSUAL;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Créditos aprobados</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Evolución mensual</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <div className="text-[10px] text-blue-600 font-semibold">Mes Actual</div>
          <div className="text-[14px] font-bold text-blue-700">{aprobadosMes}</div>
          <div className={`text-[9px] font-semibold ${vsMeta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {vsMeta >= 0 ? '+' : ''}{vsMeta}% vs anterior
          </div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-2 text-center">
          <div className="text-[10px] text-emerald-600 font-semibold">Meta Mensual</div>
          <div className="text-[14px] font-bold text-emerald-700">{META_MENSUAL}</div>
          <div className="text-[9px] text-emerald-500">{Math.round((aprobadosMes / META_MENSUAL) * 100)}% alcanzado</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-2 text-center">
          <div className="text-[10px] text-purple-600 font-semibold">Total Año</div>
          <div className="text-[14px] font-bold text-purple-700">{totalAprobados}</div>
          <div className="text-[9px] text-purple-500">Promedio {Math.round(totalAprobados / (mesActual + 1))}</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={datos} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="mes" tick={{ fontSize: 9, fill: "#94A3B8" }} />
          <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="aprobados" radius={[4, 4, 0, 0]}>
            {datos.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === mesActual ? "#3B82F6" : "#CBD5E1"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
