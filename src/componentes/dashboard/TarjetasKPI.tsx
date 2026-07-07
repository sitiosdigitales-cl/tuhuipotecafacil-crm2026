"use client";

import {
  Users,
  UserPlus,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

interface KPIItem {
  titulo: string;
  valor: string;
  valorSecundario?: string;
  cambio: number;
  cambioLabel: string;
  icono: string;
  subtitulo?: string;
}

const iconos: Record<string, React.ReactNode> = {
  "users": <Users size={16} />,
  "user-plus": <UserPlus size={16} />,
  "check-circle": <CheckCircle size={16} />,
  "clock": <Clock size={16} />,
  "dollar-sign": <DollarSign size={16} />,
  "trending-up": <TrendingUp size={16} />,
  "award": <Award size={16} />,
};

const coloresIcono = [
  "from-blue-500/10 to-blue-500/5 text-blue-600",
  "from-indigo-500/10 to-indigo-500/5 text-indigo-600",
  "from-emerald-500/10 to-emerald-500/5 text-emerald-600",
  "from-amber-500/10 to-amber-500/5 text-amber-600",
  "from-violet-500/10 to-violet-500/5 text-violet-600",
  "from-cyan-500/10 to-cyan-500/5 text-cyan-600",
  "from-rose-500/10 to-rose-500/5 text-rose-600",
];

interface TarjetasKPIProps {
  kpis?: KPIItem[];
}

export function TarjetasKPI({ kpis = [] }: TarjetasKPIProps) {
  if (kpis.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {kpis.map((kpi, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100/80 dark:border-slate-700 card-hover cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${coloresIcono[i % coloresIcono.length]} flex items-center justify-center transition-transform group-hover:scale-105`}>
              {iconos[kpi.icono]}
            </div>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-1">{kpi.titulo}</div>
          <div className="text-[20px] font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-0.5">{kpi.valor}</div>
          {kpi.valorSecundario && (
            <div className="text-[10px] text-blue-600 font-semibold mb-1">{kpi.valorSecundario}</div>
          )}
          {kpi.subtitulo && !kpi.valorSecundario && (
            <div className="text-[10px] text-slate-400 mb-1">{kpi.subtitulo}</div>
          )}
          <div className="flex items-center gap-1 mt-1">
            {kpi.cambio > 0 ? (
              <div className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                <ArrowUpRight size={10} />
                <span className="text-[9px] font-semibold">+{Math.abs(kpi.cambio)}%</span>
              </div>
            ) : kpi.cambio < 0 ? (
              <div className="flex items-center gap-0.5 text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                <ArrowDownRight size={10} />
                <span className="text-[9px] font-semibold">{Math.abs(kpi.cambio)}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">
                <Minus size={10} />
                <span className="text-[9px] font-semibold">0%</span>
              </div>
            )}
            <span className="text-[9px] text-slate-400 dark:text-slate-500 ml-1">{kpi.cambioLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
