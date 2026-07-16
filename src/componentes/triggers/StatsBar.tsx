"use client";

import { Zap, CheckCircle, AlertTriangle, Activity } from "lucide-react";

interface StatsBarProps {
  total: number;
  activos: number;
  ejecuciones: number;
  tasaExito: number;
}

export function StatsBar({ total, activos, ejecuciones, tasaExito }: StatsBarProps) {
  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="relative flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight mb-1">
            Triggers Automaticos
          </h1>
          <p className="text-amber-200 text-[11px] font-medium">
            Reglas que se activan segun condiciones especificas del sistema
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-[10px] text-amber-200">Total</div>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-300">{activos}</div>
            <div className="text-[10px] text-amber-200">Activos</div>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-300">{ejecuciones.toLocaleString()}</div>
            <div className="text-[10px] text-amber-200">Ejecuciones</div>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-300">{tasaExito}%</div>
            <div className="text-[10px] text-amber-200">Exito</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function KPIGrid({ stats }: { stats: { total: number; ejecuciones: number; exitosas: number; fallidas: number; activos: number } }) {
  const tasaExito = stats.ejecuciones > 0 ? Math.round((stats.exitosas / stats.ejecuciones) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-amber-500" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Ejecuciones</span>
        </div>
        <div className="text-xl font-bold text-slate-900">{stats.ejecuciones.toLocaleString()}</div>
        <div className="text-[10px] text-slate-400 mt-1">Total procesadas</div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CheckCircle size={18} className="text-emerald-500" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Exitosas</span>
        </div>
        <div className="text-xl font-bold text-emerald-600">{stats.exitosas.toLocaleString()}</div>
        <div className="text-[10px] text-emerald-500 mt-1">{tasaExito}% exito</div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Fallidas</span>
        </div>
        <div className="text-xl font-bold text-red-600">{stats.fallidas.toLocaleString()}</div>
        <div className="text-[10px] text-red-500 mt-1">Requieren revision</div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Activity size={18} className="text-blue-500" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Activos</span>
        </div>
        <div className="text-xl font-bold text-blue-600">{stats.activos}</div>
        <div className="text-[10px] text-blue-500 mt-1">de {stats.total} totales</div>
      </div>
    </div>
  );
}