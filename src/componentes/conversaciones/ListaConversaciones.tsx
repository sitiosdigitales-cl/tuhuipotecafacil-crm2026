"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Hash,
  Users,
  MessageSquare,
  Plus,
  ChevronDown,
  ChevronRight,
  Settings,
  Bell,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { useConversaciones } from "@/lib/hooks/useConversaciones";
import { useUser } from "@/lib/contexts/UserContext";
import type { Conversacion, TipoConversacion } from "@/tipos/conversaciones";

interface ListaConversacionesProps {
  conversacionActiva: string | null;
  onSeleccionarConversacion: (id: string) => void;
  usuarioActualId: string;
}

const TIPO_ICON: Record<TipoConversacion, typeof Hash> = {
  CANAL: Hash,
  GRUPO: Users,
  DIRECTO: MessageSquare,
};

const TIPO_LABEL: Record<TipoConversacion, string> = {
  CANAL: "Canales",
  GRUPO: "Grupos",
  DIRECTO: "Mensajes Directos",
};

export function ListaConversaciones({
  conversacionActiva,
  onSeleccionarConversacion,
  usuarioActualId,
}: ListaConversacionesProps) {
  const { usuarios } = useUser();
  const { conversaciones, cargando } = useConversaciones({ usuarioActualId });
  const [busqueda, setBusqueda] = useState("");
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<TipoConversacion, boolean>>({
    CANAL: true,
    GRUPO: true,
    DIRECTO: true,
  });

  const toggleSeccion = (tipo: TipoConversacion) => {
    setSeccionesAbiertas((prev) => ({ ...prev, [tipo]: !prev[tipo] }));
  };

  const conversacionesFiltradas = useMemo(() => {
    const filtradas = conversaciones.filter((c) => {
      const participa = c.participantes?.includes(usuarioActualId);
      const coincideBusqueda =
        !busqueda ||
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      return participa && coincideBusqueda;
    });

    const agrupadas: Record<TipoConversacion, Conversacion[]> = {
      CANAL: [],
      GRUPO: [],
      DIRECTO: [],
    };

    filtradas.forEach((c) => {
      agrupadas[c.tipo as TipoConversacion]?.push(c);
    });

    Object.keys(agrupadas).forEach((tipo) => {
      agrupadas[tipo as TipoConversacion].sort((a, b) => {
        if (a.mensajesNoLeidos > 0 && b.mensajesNoLeidos === 0) return -1;
        if (a.mensajesNoLeidos === 0 && b.mensajesNoLeidos > 0) return 1;
        return 0;
      });
    });

    return agrupadas;
  }, [conversaciones, busqueda, usuarioActualId]);

  const getNombreParticipante = (conversacion: Conversacion): string => {
    if (conversacion.tipo !== "DIRECTO") return conversacion.nombre;
    const otroId = conversacion.participantes?.find((p) => p !== usuarioActualId);
    if (!otroId) return conversacion.nombre;
    const otro = usuarios.find((u) => u.id === otroId);
    return otro ? `${otro.nombre} ${otro.apellido}` : conversacion.nombre;
  };

  const totalNoLeidos = conversaciones
    .filter((c) => c.participantes?.includes(usuarioActualId))
    .reduce((acc, c) => acc + (c.mensajesNoLeidos || 0), 0);

  if (cargando) {
    return (
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-xs text-slate-500">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Mensajes</h2>
            {totalNoLeidos > 0 && (
              <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
                {totalNoLeidos}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Notificaciones">
              <Bell size={16} className="text-slate-500" />
            </button>
            <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Nueva conversación">
              <Plus size={16} className="text-slate-500" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {(["CANAL", "GRUPO", "DIRECTO"] as TipoConversacion[]).map((tipo) => {
          const items = conversacionesFiltradas[tipo];
          if (items.length === 0) return null;

          const Icon = TIPO_ICON[tipo];
          const abierto = seccionesAbiertas[tipo];

          return (
            <div key={tipo} className="mb-1">
              <button
                onClick={() => toggleSeccion(tipo)}
                className="w-full flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:bg-slate-50 transition-colors"
              >
                {abierto ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <Icon size={12} />
                <span>{TIPO_LABEL[tipo]}</span>
                <span className="ml-auto text-[9px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                  {items.length}
                </span>
              </button>

              {abierto && (
                <div className="px-2">
                  {items.map((conversacion) => {
                    const activa = conversacionActiva === conversacion.id;
                    const nombreMostrar =
                      tipo === "DIRECTO"
                        ? getNombreParticipante(conversacion)
                        : conversacion.nombre;

                    return (
                      <button
                        key={conversacion.id}
                        onClick={() => onSeleccionarConversacion(conversacion.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all text-left group ${
                          activa
                            ? "bg-blue-50 border border-blue-100"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        {tipo === "DIRECTO" ? (
                          <Avatar
                            nombre={nombreMostrar}
                            id={conversacion.participantes?.find((p) => p !== usuarioActualId) || ""}
                            size="sm"
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              activa
                                ? "bg-blue-500 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon size={14} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-semibold truncate ${
                                activa ? "text-blue-700" : "text-slate-700"
                              }`}
                            >
                              {nombreMostrar}
                            </span>
                          </div>
                          {conversacion.descripcion && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {conversacion.descripcion}
                            </p>
                          )}
                        </div>

                        {(conversacion.mensajesNoLeidos || 0) > 0 && (
                          <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-bold rounded-full flex-shrink-0">
                            {conversacion.mensajesNoLeidos}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {conversaciones.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare size={32} className="text-slate-300 mb-3" />
            <p className="text-xs text-slate-500">No hay conversaciones</p>
            <p className="text-[10px] text-slate-400 mt-1">Crea una nueva para empezar</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <Avatar nombre="Usuario" id={usuarioActualId} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-700 truncate">En línea</div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-[9px] text-slate-500">Activo</span>
            </div>
          </div>
          <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
            <Settings size={14} className="text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
