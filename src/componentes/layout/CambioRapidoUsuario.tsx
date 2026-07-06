"use client";

import { useState } from "react";
import { useUser } from "@/lib/contexts/UserContext";
import { USUARIOS_MOCK } from "@/datos/mock";
import { ROLES_CONFIG } from "@/tipos";
import {
  ArrowLeftRight,
  Check,
  ChevronUp,
} from "lucide-react";

export function CambioRapidoUsuario() {
  const { usuarioActual, cambiarUsuario } = useUser();
  const [abierto, setAbierto] = useState(false);
  const rolConfig = ROLES_CONFIG[usuarioActual.rol];

  return (
    <div className="relative">
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all hover:bg-white/10 group"
        title="Cambiar usuario"
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
          style={{
            background: usuarioActual.rol === 'SUPER_ADMIN' ? 'linear-gradient(135deg, #9333ea, #7c3aed)' :
              usuarioActual.rol === 'ADMIN' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' :
              usuarioActual.rol === 'GERENTE' ? 'linear-gradient(135deg, #d97706, #b45309)' :
              'linear-gradient(135deg, #64748b, #475569)'
          }}
        >
          {usuarioActual.nombre[0]}{usuarioActual.apellido[0]}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-[11px] font-semibold text-white truncate">
            {usuarioActual.nombre} {usuarioActual.apellido}
          </div>
          <div className="text-[9px] text-slate-400 font-medium truncate">
            {rolConfig.label}
          </div>
        </div>
        <ChevronUp
          size={12}
          className={`text-slate-400 transition-transform duration-200 ${abierto ? "" : "rotate-180"}`}
        />
      </button>

      {/* Panel de selección */}
      {abierto && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAbierto(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="p-2.5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <ArrowLeftRight size={12} className="text-blue-600" />
                <span className="text-[10px] font-bold text-slate-900">
                  Cambiar Usuario
                </span>
              </div>
            </div>

            {/* Lista de usuarios */}
            <div className="p-1.5 max-h-[240px] overflow-y-auto">
              {USUARIOS_MOCK.map((user) => {
                const userRol = ROLES_CONFIG[user.rol];
                const esActual = user.id === usuarioActual.id;

                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      cambiarUsuario(user.id);
                      setAbierto(false);
                    }}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all ${
                      esActual
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shadow-sm flex-shrink-0"
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
                      <div className="text-[10px] font-semibold text-slate-800 truncate">
                        {user.nombre} {user.apellido}
                      </div>
                      <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded ${userRol.color}`}>
                        {userRol.label}
                      </span>
                    </div>
                    {esActual && <Check size={11} className="text-blue-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
