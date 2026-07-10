"use client";

import { useState } from "react";
import { ROLES_CONFIG } from "@/tipos";
import {
  UserPlus,
  Check,
  Search,
  X,
} from "lucide-react";
import { useUser } from "@/lib/contexts/UserContext";

interface AsignarEjecutivoProps {
  ejecutivoActual?: string;
  onAsignar: (nombreEjecutivo: string) => void;
  compact?: boolean;
}

export function AsignarEjecutivo({ ejecutivoActual, onAsignar, compact = false }: AsignarEjecutivoProps) {
  const { usuarios } = useUser();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const ejecutivos = usuarios.filter((u) => u.estado === "ACTIVO");
  const ejecutivosFiltrados = ejecutivos.filter((e) =>
    `${e.nombre} ${e.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleAsignar = (nombre: string) => {
    onAsignar(nombre);
    setAbierto(false);
    setBusqueda("");
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setAbierto(!abierto);
        }}
        className={`flex items-center gap-1.5 transition-colors ${
          compact
            ? "p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
            : "px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
        }`}
        title="Asignar ejecutivo"
      >
        <UserPlus size={compact ? 12 : 14} className="text-slate-400 dark:text-slate-500" />
        {!compact && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {ejecutivoActual ? "Cambiar" : "Asignar"}
          </span>
        )}
      </button>

      {abierto && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setAbierto(false);
              setBusqueda("");
            }}
          />
          <div className="fixed z-50 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
               style={{ bottom: '60px', right: '16px' }}>
            {/* Header */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus size={14} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100">
                    Asignar Ejecutivo
                  </span>
                </div>
                <button
                  onClick={() => {
                    setAbierto(false);
                    setBusqueda("");
                  }}
                  className="p-1 hover:bg-white/50 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  <X size={12} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Búsqueda */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar ejecutivo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-400"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista */}
            <div className="p-1.5 max-h-[240px] overflow-y-auto">
              {ejecutivosFiltrados.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-[11px] text-slate-400">No se encontraron ejecutivos</p>
                </div>
              ) : (
                ejecutivosFiltrados.map((user) => {
                  const userRol = ROLES_CONFIG[user.rol];
                  const esActual = `${user.nombre} ${user.apellido}` === ejecutivoActual;

                  return (
                    <button
                      key={user.id}
                      onClick={() => handleAsignar(`${user.nombre} ${user.apellido}`)}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                        esActual
                          ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm flex-shrink-0"
                        style={{
                          background:
                            user.rol === "SUPER_ADMIN"
                              ? "linear-gradient(135deg, #9333ea, #7c3aed)"
                              : user.rol === "ADMIN"
                              ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                              : user.rol === "GERENTE"
                              ? "linear-gradient(135deg, #d97706, #b45309)"
                              : "linear-gradient(135deg, #64748b, #475569)",
                        }}
                      >
                        {user.nombre[0]}
                        {user.apellido[0]}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {user.nombre} {user.apellido}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${userRol.color}`}>
                            {userRol.label}
                          </span>
                        </div>
                      </div>
                      {esActual && <Check size={12} className="text-blue-500 flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <button
                onClick={() => handleAsignar("")}
                className="w-full text-center text-[10px] font-semibold text-red-500 hover:text-red-600 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Quitar asignación
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
