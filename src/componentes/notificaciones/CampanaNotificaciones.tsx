"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCircle,
  Trash2,
  ExternalLink,
  Settings,
  X,
  AlertTriangle,
} from "lucide-react";
import { useNotificaciones } from "@/lib/contexts/NotificationContext";

export function CampanaNotificaciones() {
  const { notificaciones, noLeidas, marcarComoLeida, marcarTodasLeidas, eliminarNotificacion } = useNotificaciones();
  const [abierta, setAbierta] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAbierta(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatearTiempo = (fecha: Date): string => {
    const ahora = new Date();
    const diff = ahora.getTime() - new Date(fecha).getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return "Ahora";
    if (minutos < 60) return `Hace ${minutos}m`;
    if (horas < 24) return `Hace ${horas}h`;
    return `Hace ${dias}d`;
  };

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case "exito": return <CheckCircle size={16} className="text-emerald-500" />;
      case "advertencia": return <AlertTriangle size={16} className="text-amber-500" />;
      case "error": return <X size={16} className="text-red-500" />;
      case "sistema": return <Settings size={16} className="text-slate-500" />;
      default: return <Bell size={16} className="text-blue-500" />;
    }
  };

  // Solo mostrar las 20 más recientes en el dropdown
  const notificacionesVisuales = notificaciones.slice(0, 20);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setAbierta(!abierta)}
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
          abierta
            ? "bg-indigo-50 text-indigo-600 border-indigo-200"
            : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-100"
        }`}
      >
        <Bell size={17} />
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierta && (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Notificaciones</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {noLeidas} nueva{noLeidas !== 1 ? "s" : ""}
                </p>
              </div>
              {noLeidas > 0 && (
                <button
                  onClick={() => marcarTodasLeidas()}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Check size={12} /> Marcar todo leído
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[400px] overflow-y-auto">
            {notificacionesVisuales.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Bell size={20} className="text-slate-300 dark:text-slate-500" />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Sin notificaciones
                </p>
              </div>
            ) : (
              notificacionesVisuales.map((notif) => (
                <div
                  key={notif.id}
                  className={`group flex items-start gap-3 p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${
                    !notif.leida ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""
                  }`}
                  onClick={() => {
                    marcarComoLeida(notif.id);
                    if (notif.accionUrl) {
                      window.location.href = notif.accionUrl;
                    }
                  }}
                >
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    {getIconoTipo(notif.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {notif.titulo}
                      </h4>
                      {!notif.leida && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-2">
                      {notif.descripcion}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {formatearTiempo(notif.fecha)}
                      </span>
                      {notif.accionUrl && (
                        <span className="text-[10px] text-indigo-500 flex items-center gap-0.5">
                          <ExternalLink size={8} /> Ver detalle
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminarNotificacion(notif.id);
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} className="text-slate-400" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <Link
              href="/configuracion?tab=notificaciones"
              onClick={() => setAbierta(false)}
              className="block w-full text-center text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 py-1"
            >
              Ver todas las notificaciones
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
