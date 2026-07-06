"use client";

import { useState } from "react";
import {
  UserPlus,
  FileText,
  Bell,
  Calendar,
  CheckCircle,
  ChevronRight,
  Phone,
  Mail,
  MessageSquare,
  GitBranch,
  Clock,
  Filter,
  RefreshCw,
} from "lucide-react";

const actividades = [
  { 
    id: "1", 
    titulo: "Nuevo lead desde Facebook Ads", 
    detalle: "María González solicitó información sobre crédito hipotecario", 
    tiempo: "Hace 2 min", 
    icono: "user-plus", 
    color: "#3B82F6",
    usuario: "Sistema",
    tipo: "lead"
  },
  { 
    id: "2", 
    titulo: "Documento subido por cliente", 
    detalle: "Carlos Rojas cargó certificado de AFP", 
    tiempo: "Hace 12 min", 
    icono: "file-text", 
    color: "#22C55E",
    usuario: "Carlos Rojas",
    tipo: "documento"
  },
  { 
    id: "3", 
    titulo: "Recordatorio enviado", 
    detalle: "Se envió email de seguimiento a Juan Pérez", 
    tiempo: "Hace 25 min", 
    icono: "bell", 
    color: "#F59E0B",
    usuario: "Sistema",
    tipo: "seguimiento"
  },
  { 
    id: "4", 
    titulo: "Reunión agendada", 
    detalle: "Ana Torres programó revisión de condiciones", 
    tiempo: "Hace 45 min", 
    icono: "calendar", 
    color: "#8B5CF6",
    usuario: "Andrés Pérez",
    tipo: "reunion"
  },
  { 
    id: "5", 
    titulo: "Crédito aprobado", 
    detalle: "Diego Díaz completó evaluación bancaria", 
    tiempo: "Hace 1 hora", 
    icono: "check-circle", 
    color: "#10B981",
    usuario: "Banco Chile",
    tipo: "aprobacion"
  },
  { 
    id: "6", 
    titulo: "Llamada realizada", 
    detalle: "Carolina Muñoz contactó a Sofía Martínez", 
    tiempo: "Hace 1.5 horas", 
    icono: "phone", 
    color: "#06B6D4",
    usuario: "Carolina Muñoz",
    tipo: "llamada"
  },
  { 
    id: "7", 
    titulo: "Cambio de etapa", 
    detalle: "Roberto Silva pasó a Evaluación Bancaria", 
    tiempo: "Hace 2 horas", 
    icono: "git-branch", 
    color: "#D946EF",
    usuario: "Sistema",
    tipo: "cambio"
  },
  { 
    id: "8", 
    titulo: "Email enviado", 
    detalle: "Propuesta comercial enviada a Fernanda Rojas", 
    tiempo: "Hace 3 horas", 
    icono: "mail", 
    color: "#3B82F6",
    usuario: "Diego Silva",
    tipo: "email"
  },
];

const iconoMap: Record<string, React.ReactNode> = {
  "user-plus": <UserPlus size={14} />,
  "file-text": <FileText size={14} />,
  "bell": <Bell size={14} />,
  "calendar": <Calendar size={14} />,
  "check-circle": <CheckCircle size={14} />,
  "phone": <Phone size={14} />,
  "mail": <Mail size={14} />,
  "message-square": <MessageSquare size={14} />,
  "git-branch": <GitBranch size={14} />,
};

const tipoConfig: Record<string, { label: string; color: string }> = {
  lead: { label: "Lead", color: "bg-blue-100 text-blue-700" },
  documento: { label: "Documento", color: "bg-emerald-100 text-emerald-700" },
  seguimiento: { label: "Seguimiento", color: "bg-amber-100 text-amber-700" },
  reunion: { label: "Reunión", color: "bg-purple-100 text-purple-700" },
  aprobacion: { label: "Aprobación", color: "bg-emerald-100 text-emerald-700" },
  llamada: { label: "Llamada", color: "bg-cyan-100 text-cyan-700" },
  cambio: { label: "Cambio", color: "bg-pink-100 text-pink-700" },
  email: { label: "Email", color: "bg-blue-100 text-blue-700" },
};

export function FeedActividad() {
  const [filtroActivo, setFiltroActivo] = useState<string>("todos");

  const actividadesFiltradas = filtroActivo === "todos" 
    ? actividades 
    : actividades.filter(a => a.tipo === filtroActivo);

  const stats = {
    leads: actividades.filter(a => a.tipo === "lead").length,
    documentos: actividades.filter(a => a.tipo === "documento").length,
    llamadas: actividades.filter(a => a.tipo === "llamada").length,
    total: actividades.length,
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-slate-900">Actividad en tiempo real</h3>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[11px] text-emerald-600 font-semibold">En vivo</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <RefreshCw size={14} className="text-slate-400" />
          </button>
          <button className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors">
            Ver toda <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-blue-50/80 rounded-lg p-2 text-center">
          <div className="text-[14px] font-bold text-blue-700">{stats.leads}</div>
          <div className="text-[10px] text-blue-500 font-medium">Leads</div>
        </div>
        <div className="bg-emerald-50/80 rounded-lg p-2 text-center">
          <div className="text-[14px] font-bold text-emerald-700">{stats.documentos}</div>
          <div className="text-[10px] text-emerald-500 font-medium">Docs</div>
        </div>
        <div className="bg-cyan-50/80 rounded-lg p-2 text-center">
          <div className="text-[14px] font-bold text-cyan-700">{stats.llamadas}</div>
          <div className="text-[10px] text-cyan-500 font-medium">Llamadas</div>
        </div>
        <div className="bg-slate-50/80 rounded-lg p-2 text-center">
          <div className="text-[14px] font-bold text-slate-700">{stats.total}</div>
          <div className="text-[10px] text-slate-500 font-medium">Total</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFiltroActivo("todos")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
            filtroActivo === "todos"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Todos
        </button>
        {Object.entries(tipoConfig).slice(0, 5).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFiltroActivo(key)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
              filtroActivo === key
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Timeline de actividades */}
      <div className="relative">
        {/* Línea conectora */}
        <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />

        <div className="space-y-1">
          {actividadesFiltradas.map((act, i) => (
            <div 
              key={act.id} 
              className="relative flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50/80 transition-all cursor-pointer group"
            >
              {/* Icono con indicador */}
              <div className="relative z-10">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 group-hover:shadow-md"
                  style={{ backgroundColor: `${act.color}15`, color: act.color }}
                >
                  {iconoMap[act.icono]}
                </div>
                {i === 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold text-slate-800">{act.titulo}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${tipoConfig[act.tipo]?.color}`}>
                    {tipoConfig[act.tipo]?.label}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 leading-relaxed">{act.detalle}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-slate-400">{act.usuario}</span>
                  <span className="text-[10px] text-slate-300">•</span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock size={8} />
                    {act.tiempo}
                  </span>
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors">
                  <Mail size={12} className="text-blue-500" />
                </button>
                <button className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors">
                  <Phone size={12} className="text-emerald-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <button className="w-full flex items-center justify-center gap-2 py-2 text-[11px] text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
          <Filter size={12} />
          Cargar más actividades
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}