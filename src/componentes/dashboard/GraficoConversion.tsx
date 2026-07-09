"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useLeads } from "@/lib/contexts/LeadContext";

const COLORES_ETAPAS: Record<string, string> = {
  NUEVO_LEAD: "#3B82F6", CONTACTO_INICIAL: "#6366F1", CONTACTADO: "#8B5CF6",
  INTERESADO: "#A855F7", CALIFICACION_COMERCIAL: "#D946EF", DOCS_PENDIENTES: "#F97316",
  DOCS_COMPLETAS: "#22C55E", EVALUACION_BANCARIA: "#06B6D4", PREAPROBADO: "#14B8A6", APROBADO: "#10B981",
};

const LABELS_CORTOS: Record<string, string> = {
  NUEVO_LEAD: "Nuevo Lead", CONTACTO_INICIAL: "Contacto", CONTACTADO: "Contactado",
  INTERESADO: "Interesado", CALIFICACION_COMERCIAL: "Calificación", DOCS_PENDIENTES: "Doc. Pend.",
  DOCS_COMPLETAS: "Doc. Comp.", EVALUACION_BANCARIA: "Evaluación", PREAPROBADO: "Preaprobado", APROBADO: "Aprobado",
};

export function GraficoConversion() {
  const { leads } = useLeads();

  const datos = useMemo(() => {
    const total = leads.length || 1;
    const etapas = ["NUEVO_LEAD", "CONTACTO_INICIAL", "CONTACTADO", "INTERESADO", "CALIFICACION_COMERCIAL", "DOCS_PENDIENTES", "DOCS_COMPLETAS", "EVALUACION_BANCARIA", "PREAPROBADO", "APROBADO"];
    return etapas.map((etapa) => ({
      etapa: LABELS_CORTOS[etapa] || etapa,
      porcentaje: Math.round((leads.filter((l) => l.etapa === etapa).length / total) * 100),
      leads: leads.filter((l) => l.etapa === etapa).length,
      color: COLORES_ETAPAS[etapa] || "#6B7280",
    }));
  }, [leads]);

  const promedio = datos.length > 0 ? Math.round(datos.reduce((a, d) => a + d.porcentaje, 0) / datos.length) : 0;
  const dropoffMayor = datos.reduce((max, curr, i) => {
    if (i === 0) return { diff: 0, label: "" };
    const diff = datos[i - 1].porcentaje - curr.porcentaje;
    return diff > max.diff ? { diff, label: curr.etapa } : max;
  }, { diff: 0, label: "" });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100/80 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Conversión por etapa</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Tasa de avance del pipeline</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 text-center">
          <div className="text-[9px] text-blue-600 font-semibold">Conversión Final</div>
          <div className="text-[18px] font-bold text-blue-700">
            {datos[datos.length - 1]?.porcentaje || 0}%
          </div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2.5 text-center">
          <div className="text-[9px] text-emerald-600 font-semibold">Promedio</div>
          <div className="text-[18px] font-bold text-emerald-700">{promedio}%</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5 text-center">
          <div className="text-[9px] text-amber-600 font-semibold">Mayor Drop-off</div>
          <div className="text-[18px] font-bold text-amber-700">
            {dropoffMayor.diff > 0 ? `-${dropoffMayor.diff}%` : "0%"}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={datos} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="etapa" tick={{ fontSize: 8, fill: "#94A3B8" }} angle={-35} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} domain={[0, 100]} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #E2E8F0", padding: "8px 12px" }}
            formatter={(value: any, name: any, props: any) => [`${value}% (${props?.payload?.leads || 0} leads)`, props?.payload?.etapa || name]}
          />
          <ReferenceLine y={promedio} stroke="#10B981" strokeDasharray="5 5" label={{ value: `Promedio ${promedio}%`, position: "right", fill: "#10B981", fontSize: 10 }} />
          <Line type="monotone" dataKey="porcentaje" stroke="#3B82F6" strokeWidth={2} dot={{ fill: "#3B82F6", r: 4 }} activeDot={{ r: 6, fill: "#3B82F6" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
