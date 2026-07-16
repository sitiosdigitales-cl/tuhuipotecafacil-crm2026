"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  X,
  Settings,
  Check,
  Trash2,
  FileText,
  Clock,
  Calendar,
  RefreshCw,
  Users,
  HardDrive,
  Plug,
  Zap,
  Activity,
  ChevronRight,
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
  Database,
  Shield,
} from "lucide-react";
import { useNotificaciones } from "@/lib/contexts/NotificationContext";
import { useLeads } from "@/modulos/leads";
import { useUser } from "@/modulos/usuarios";

const iconoRecordatorio = (icono: string) => {
  const clases = "w-8 h-8 rounded-xl flex items-center justify-center";
  switch (icono) {
    case "refresh-cw": return <div className={`${clases} bg-blue-50 dark:bg-blue-900/30`}><RefreshCw size={14} className="text-blue-500" /></div>;
    case "users": return <div className={`${clases} bg-green-50 dark:bg-green-900/30`}><Users size={14} className="text-green-500" /></div>;
    case "building": return <div className={`${clases} bg-purple-50 dark:bg-purple-900/30`}><Plug size={14} className="text-purple-500" /></div>;
    case "hard-drive": return <div className={`${clases} bg-slate-100 dark:bg-slate-700`}><HardDrive size={14} className="text-slate-500" /></div>;
    case "database": return <div className={`${clases} bg-indigo-50 dark:bg-indigo-900/30`}><Database size={14} className="text-indigo-500" /></div>;
    case "shield": return <div className={`${clases} bg-amber-50 dark:bg-amber-900/30`}><Shield size={14} className="text-amber-500" /></div>;
    default: return <div className={`${clases} bg-slate-100 dark:bg-slate-700`}><Bell size={14} className="text-slate-500" /></div>;
  }
};

const iconoResumen = (icono: string) => {
  const clases = "w-7 h-7 rounded-lg flex items-center justify-center";
  switch (icono) {
    case "users": return <div className={`${clases} bg-blue-50 dark:bg-blue-900/30`}><Users size={13} className="text-blue-500" /></div>;
    case "database": return <div className={`${clases} bg-green-50 dark:bg-green-900/30`}><HardDrive size={13} className="text-green-500" /></div>;
    case "plug": return <div className={`${clases} bg-purple-50 dark:bg-purple-900/30`}><Plug size={13} className="text-purple-500" /></div>;
    case "zap": return <div className={`${clases} bg-amber-50 dark:bg-amber-900/30`}><Zap size={13} className="text-amber-500" /></div>;
    case "activity": return <div className={`${clases} bg-emerald-50 dark:bg-emerald-900/30`}><Activity size={13} className="text-emerald-500" /></div>;
    default: return <div className={`${clases} bg-slate-100 dark:bg-slate-700`}><Bell size={13} className="text-slate-500" /></div>;
  }
};

const iconoActividad = (icono: string, color: string) => {
  const clases = "w-8 h-8 rounded-xl flex items-center justify-center";
  switch (icono) {
    case "user-plus": return <div className={`${clases}`} style={{ backgroundColor: `${color}12` }}><Users size={14} style={{ color }} /></div>;
    case "file-text": return <div className={`${clases}`} style={{ backgroundColor: `${color}12` }}><FileText size={14} style={{ color }} /></div>;
    case "bell": return <div className={`${clases}`} style={{ backgroundColor: `${color}12` }}><Clock size={14} style={{ color }} /></div>;
    case "calendar": return <div className={`${clases}`} style={{ backgroundColor: `${color}12` }}><Calendar size={14} style={{ color }} /></div>;
    case "check-circle": return <div className={`${clases}`} style={{ backgroundColor: `${color}12` }}><Activity size={14} style={{ color }} /></div>;
    default: return <div className={`${clases}`} style={{ backgroundColor: `${color}12` }}><Bell size={14} style={{ color }} /></div>;
  }
};

function getIconoTipo(tipo: string) {
  const clases = "w-8 h-8 rounded-xl flex items-center justify-center";
  switch (tipo) {
    case "exito": return <div className={`${clases} bg-emerald-50 dark:bg-emerald-900/30`}><CheckCircle size={14} className="text-emerald-500" /></div>;
    case "advertencia": return <div className={`${clases} bg-amber-50 dark:bg-amber-900/30`}><AlertTriangle size={14} className="text-amber-500" /></div>;
    case "error": return <div className={`${clases} bg-red-50 dark:bg-red-900/30`}><X size={14} className="text-red-500" /></div>;
    case "sistema": return <div className={`${clases} bg-slate-100 dark:bg-slate-700`}><Settings size={14} className="text-slate-500" /></div>;
    default: return <div className={`${clases} bg-blue-50 dark:bg-blue-900/30`}><Bell size={14} className="text-blue-500" /></div>;
  }
}

function formatearTiempo(fecha: Date): string {
  const ahora = new Date();
  const diff = ahora.getTime() - new Date(fecha).getTime();
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);

  if (minutos < 1) return "Ahora";
  if (minutos < 60) return `Hace ${minutos}m`;
  if (horas < 24) return `Hace ${horas}h`;
  return `Hace ${dias}d`;
}

interface PanelDerechoProps {
  onClose?: () => void;
  colapsado?: boolean;
  onToggleColapsado?: () => void;
}

export function PanelDerecho({ _onClose, colapsado = false, onToggleColapsado }: PanelDerechoProps) {
  const { notificaciones, noLeidas, marcarComoLeida, marcarTodasLeidas, eliminarNotificacion } = useNotificaciones();
  const { leads } = useLeads();
  const { usuarios } = useUser();
  const [mostrarTodas, setMostrarTodas] = useState(false);

  // Datos reales del sistema
  const resumenSistema = [
    { icono: "users", titulo: "Usuarios Activos", valor: usuarios.filter(u => u.estado === "ACTIVO").length.toString(), cambio: "+2" },
    { icono: "database", titulo: "Leads Totales", valor: leads.length.toString(), cambio: `+${leads.filter(l => l.etapa === "NUEVO_LEAD").length}` },
    { icono: "zap", titulo: "Conversiones", valor: leads.filter(l => ["APROBADO", "FIRMA_DIGITAL", "NOTARIA"].includes(l.etapa)).length.toString(), cambio: "0" },
  ];

  const recordatoriosSistema = [
    { icono: "refresh-cw", titulo: "Actualizar datos", descripcion: "Última actualización hace 2 horas" },
    { icono: "users", titulo: "Leads sin asignar", descripcion: `${leads.filter(l => !l.nombreEjecutivo).length} leads pendientes` },
    { icono: "database", titulo: "Respaldo de Seguridad", descripcion: "Último respaldo: Hoy 02:00 AM", href: "/backups", color: "text-blue-500" },
    { icono: "shield", titulo: "Auditoría del Sistema", descripcion: "Revisar registros de actividad", href: "/auditoria", color: "text-amber-500" },
  ];

  // Mostrar solo las primeras 5 en el panel
  const notificacionesVisuales = mostrarTodas ? notificaciones.slice(0, 10) : notificaciones.slice(0, 5);

  return (
    <aside className={`h-screen bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-l border-slate-200/60 dark:border-slate-700/60 flex flex-col fixed right-0 top-0 z-30 overflow-y-auto transition-all duration-300 ${colapsado ? 'w-0 overflow-hidden' : 'w-[320px]'}`}>
      {/* Header con botón de colapsar */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-700 p-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Panel Lateral</span>
        <button
          onClick={onToggleColapsado}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={colapsado ? "Expandir panel" : "Contraer panel"}
        >
          {colapsado ? (
            <PanelRightOpen size={16} className="text-slate-500" />
          ) : (
            <PanelRightClose size={16} className="text-slate-500" />
          )}
        </button>
      </div>

      {/* Notificaciones - Conectado al contexto */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">Notificaciones</h3>
            {noLeidas > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                {noLeidas}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {noLeidas > 0 && (
              <button
                onClick={() => marcarTodasLeidas()}
                className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
              >
                <Check size={10} /> Leído
              </button>
            )}
            <button
              onClick={() => setMostrarTodas(!mostrarTodas)}
              className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold"
            >
              {mostrarTodas ? "Ver menos" : "Ver todas"}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {notificacionesVisuales.length === 0 ? (
            <div className="py-6 text-center">
              <Bell size={20} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Sin notificaciones</p>
            </div>
          ) : (
            notificacionesVisuales.map((notif) => (
              <div
                key={notif.id}
                className={`group flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer ${
                  !notif.leida
                    ? "bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
                onClick={() => {
                  marcarComoLeida(notif.id);
                  if (notif.accionUrl) {
                    window.location.href = notif.accionUrl;
                  }
                }}
              >
                {getIconoTipo(notif.tipo)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">
                      {notif.titulo}
                    </span>
                    {!notif.leida && (
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">
                    {formatearTiempo(notif.fecha)}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    eliminarNotificacion(notif.id);
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={10} className="text-slate-400" />
                </button>
              </div>
            ))
          )}
        </div>

        {notificaciones.length > 5 && !mostrarTodas && (
          <button
            onClick={() => setMostrarTodas(true)}
            className="w-full mt-3 py-2 text-[10px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg"
          >
            Ver {notificaciones.length - 5} notificaciones más
          </button>
        )}
      </div>

      {/* Recordatorios del sistema */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">Recordatorios</h3>
        </div>
        <div className="space-y-1">
          {recordatoriosSistema.map((rec, i) => (
            <Link
              key={i}
              href={rec.href || "#"}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {iconoRecordatorio(rec.icono)}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">{rec.titulo}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{rec.descripcion}</div>
              </div>
              {rec.href && <ChevronRight size={12} className="text-slate-400" />}
            </Link>
          ))}
        </div>
      </div>

      {/* Actividad en tiempo real */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">Actividad reciente</h3>
          <Link href="/reportes" className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5">
            Ver más <ChevronRight size={10} />
          </Link>
        </div>
        <div className="space-y-1">
          {leads.slice(0, 5).map((lead) => (
            <div key={lead.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              {iconoActividad("lead", "blue")}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{lead.nombre} {lead.apellido}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{lead.etapa}</div>
                <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-medium">{lead.origen}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Asistente IA */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700">
        <Link href="/asistente">
          <div className="bg-gradient-to-br from-violet-50 via-purple-50/50 to-blue-50 dark:from-violet-900/20 dark:via-purple-900/10 dark:to-blue-900/20 rounded-2xl p-4 border border-violet-100/50 dark:border-violet-800/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/20 group-hover:shadow-purple-600/30 transition-shadow">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Asistente IA</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">Activo</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">Tu asistente inteligente para tomar mejores decisiones.</p>
            <div className="w-full gradient-primary text-white text-[11px] font-semibold py-2 rounded-xl text-center group-hover:opacity-90 transition-opacity shadow-lg shadow-purple-600/15">
              Abrir asistente
            </div>
          </div>
        </Link>
      </div>

      {/* Resumen del sistema */}
      <div className="p-5">
        <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-4">Resumen del sistema</h3>
        <div className="space-y-2">
          {resumenSistema.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-2.5">
                {iconoResumen(item.icono)}
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{item.titulo}</span>
              </div>
              <span className="text-[12px] font-bold text-slate-900 dark:text-slate-100">{item.valor}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
