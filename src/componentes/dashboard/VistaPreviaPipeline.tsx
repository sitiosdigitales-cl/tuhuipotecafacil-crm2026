"use client";

import { generarLeads, ETAPAS_CONFIG } from "@/datos/mock";
import { formatoMonedaAbreviado } from "@/lib/utils";
import type { Etapa } from "@/tipos";
import { LayoutGrid, List, ChevronRight } from "lucide-react";

const ETAPAS_VISIBLES: Etapa[] = [
  "NUEVO_LEAD",
  "CONTACTO_INICIAL",
  "CONTACTADO",
  "INTERESADO",
  "CALIFICACION_COMERCIAL",
  "DOCS_PENDIENTES",
  "DOCS_COMPLETAS",
  "EVALUACION_BANCARIA",
  "PREAPROBADO",
  "APROBADO",
  "FIRMA_DIGITAL",
  "NOTARIA",
  "CREDITO_PAGADO",
];

export function VistaPreviaPipeline() {
  const leads = generarLeads();

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-slate-900">Pipeline Comercial</h3>
          <select className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10">
            <option>Todos los ejecutivos</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors">
            Ver pipeline completo <ChevronRight size={12} />
          </button>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button className="p-1.5 bg-white rounded-md shadow-sm">
              <LayoutGrid size={13} className="text-slate-600" />
            </button>
            <button className="p-1.5 rounded-md">
              <List size={13} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {ETAPAS_VISIBLES.map((etapa) => {
          const config = ETAPAS_CONFIG[etapa];
          const leadsEnEtapa = leads.filter((l) => l.etapa === etapa).slice(0, 2);

          return (
            <div key={etapa} className="min-w-[150px] w-[150px] flex-shrink-0">
              <div className="flex items-center gap-1.5 mb-2.5 px-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                <span className="text-[10px] font-semibold text-slate-700 truncate">{config.label}</span>
                <span className="text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md font-medium">
                  {leads.filter((l) => l.etapa === etapa).length}
                </span>
              </div>
              <div className="space-y-2">
                {leadsEnEtapa.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 hover:shadow-soft hover:border-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white text-[7px] font-bold">
                        {lead.nombre[0]}{lead.apellido[0]}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-800 truncate">
                        {lead.nombre} {lead.apellido}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-700 mb-1">
                      {formatoMonedaAbreviado(lead.montoSolicitado || 0)}
                    </div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded">{lead.tipoCredito}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{lead.origen}</span>
                      <span className="text-[10px] text-slate-400">Hace {lead.diasEnEtapa}d</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
