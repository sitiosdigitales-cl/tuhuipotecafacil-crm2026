"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Phone,
  Video,
  MoreHorizontal,
  Users,
  Pin,
  Search,
  Settings,
  Star,
  Hash,
  Info,
  X,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { MensajeItem } from "./MensajeItem";
import { InputMensaje } from "./InputMensaje";
import {
  CONVERSACIONES_MOCK,
  MENSAJES_MOCK,
  getUsuarioById,
  getEstadoOnline,
} from "@/datos/conversaciones-mock";
import type { Mensaje } from "@/tipos/conversaciones";
import { ESTADO_ONLINE_CONFIG } from "@/tipos/conversaciones";

interface AreaChatProps {
  conversacionId: string | null;
  usuarioActualId: string;
}

export function AreaChat({ conversacionId, usuarioActualId }: AreaChatProps) {
  const [mensajes, setMensajes] = useState<Record<string, Mensaje[]>>(MENSAJES_MOCK);
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const mensajesRef = useRef<HTMLDivElement>(null);

  const conversacion = CONVERSACIONES_MOCK.find((c) => c.id === conversacionId);

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajes, conversacionId]);

  const mensajesConversacion = useMemo(() => {
    if (!conversacionId) return [];
    return mensajes[conversacionId] || [];
  }, [mensajes, conversacionId]);

  const mensajesAgrupados = useMemo(() => {
    return mensajesConversacion.map((msg, idx) => {
      const prev = idx > 0 ? mensajesConversacion[idx - 1] : null;
      const mostrarRemitente =
        !prev ||
        prev.remitenteId !== msg.remitenteId ||
        msg.creadoEn.getTime() - prev.creadoEn.getTime() > 300000;

      const primerDelDia =
        !prev ||
        prev.creadoEn.toDateString() !== msg.creadoEn.toDateString();

      return { ...msg, mostrarRemitente, primerDelDia };
    });
  }, [mensajesConversacion]);

  const handleEnviar = (contenido: string) => {
    if (!conversacionId) return;

    const nuevoMensaje: Mensaje = {
      id: `m-${Date.now()}`,
      conversacionId,
      remitenteId: usuarioActualId,
      remitenteNombre: getUsuarioById(usuarioActualId)?.nombre || "Usuario",
      contenido,
      tipo: "TEXTO",
      estado: "ENVIADO",
      creadoEn: new Date(),
    };

    setMensajes((prev) => ({
      ...prev,
      [conversacionId]: [...(prev[conversacionId] || []), nuevoMensaje],
    }));
  };

  const getNombreConversacion = (): string => {
    if (!conversacion) return "";
    if (conversacion.tipo === "DIRECTO") {
      const otroId = conversacion.participantes.find((p) => p !== usuarioActualId);
      if (!otroId) return conversacion.nombre;
      const otro = getUsuarioById(otroId);
      return otro ? `${otro.nombre} ${otro.apellido}` : conversacion.nombre;
    }
    return conversacion.nombre;
  };

  const getDescripcionConversacion = (): string => {
    if (!conversacion) return "";
    if (conversacion.tipo === "DIRECTO") {
      const otroId = conversacion.participantes.find((p) => p !== usuarioActualId);
      if (!otroId) return "";
      const estado = getEstadoOnline(otroId);
      return ESTADO_ONLINE_CONFIG[estado].label;
    }
    if (conversacion.descripcion) return conversacion.descripcion;
    return `${conversacion.participantes.length} participantes`;
  };

  if (!conversacionId || !conversacion) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-slate-100">
            <MessageSquareIcon />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Selecciona una conversación</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            Elige una conversación de la lista para empezar a chatear con tu equipo.
          </p>
        </div>
      </div>
    );
  }

  const nombreConversacion = getNombreConversacion();
  const descripcionConversacion = getDescripcionConversacion();
  const esDirecto = conversacion.tipo === "DIRECTO";
  const otroId = esDirecto ? conversacion.participantes.find((p) => p !== usuarioActualId) : null;

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          {esDirecto && otroId ? (
            <Avatar nombre={nombreConversacion} id={otroId} size="md" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Hash size={18} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">{nombreConversacion}</h3>
              {conversacion.esFijo && (
                <Pin size={12} className="text-amber-500" />
              )}
            </div>
            <p className="text-[11px] text-slate-500">{descripcionConversacion}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Buscar en conversación">
            <Search size={16} className="text-slate-500" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Llamar">
            <Phone size={16} className="text-slate-500" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Videollamada">
            <Video size={16} className="text-slate-500" />
          </button>
          <button
            onClick={() => setMostrarInfo(!mostrarInfo)}
            className={`p-2 rounded-lg transition-colors ${
              mostrarInfo ? "bg-blue-100 text-blue-600" : "hover:bg-slate-100 text-slate-500"
            }`}
            title="Información"
          >
            <Info size={16} />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Más opciones">
            <MoreHorizontal size={16} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mensajes */}
        <div className="flex-1 flex flex-col">
          {/* Lista de mensajes */}
          <div ref={mensajesRef} className="flex-1 overflow-y-auto py-4">
            {mensajesAgrupados.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <Hash size={24} className="text-slate-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-600 mb-1">
                  Inicio de la conversación
                </h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  Este es el comienzo de tu conversación en #{nombreConversacion}.
                  ¡Envía el primer mensaje!
                </p>
              </div>
            ) : (
              mensajesAgrupados.map((msg) => (
                <MensajeItem
                  key={msg.id}
                  mensaje={msg}
                  esPropio={msg.remitenteId === usuarioActualId}
                  mostrarRemitente={msg.mostrarRemitente}
                  esPrimerDelDia={msg.primerDelDia}
                />
              ))
            )}
          </div>

          {/* Input */}
          <InputMensaje onEnviar={handleEnviar} nombreConversacion={nombreConversacion} />
        </div>

        {/* Panel de información */}
        {mostrarInfo && (
          <div className="w-72 border-l border-slate-200 bg-slate-50/50 flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Información
              </h4>
              <button
                onClick={() => setMostrarInfo(false)}
                className="p-1 hover:bg-slate-200 rounded-md transition-colors"
              >
                <X size={14} className="text-slate-500" />
              </button>
            </div>

            {/* Info de la conversación */}
            <div className="p-4 border-b border-slate-200 text-center">
              {esDirecto && otroId ? (
                <Avatar nombre={nombreConversacion} id={otroId} size="lg" />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto">
                  <Hash size={24} />
                </div>
              )}
              <h3 className="text-sm font-bold text-slate-900 mt-3">{nombreConversacion}</h3>
              <p className="text-[11px] text-slate-500 mt-1">{descripcionConversacion}</p>
            </div>

            {/* Participantes */}
            <div className="p-4 border-b border-slate-200">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Participantes ({conversacion.participantes.length})
              </h5>
              <div className="space-y-2">
                {conversacion.participantes.map((pid) => {
                  const usuario = getUsuarioById(pid);
                  if (!usuario) return null;
                  const estado = getEstadoOnline(pid);
                  const estadoConfig = ESTADO_ONLINE_CONFIG[estado];

                  return (
                    <div key={pid} className="flex items-center gap-2.5">
                      <Avatar
                        nombre={`${usuario.nombre} ${usuario.apellido}`}
                        id={pid}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-700 truncate">
                          {usuario.nombre} {usuario.apellido}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${estadoConfig.color}`} />
                          <span className="text-[9px] text-slate-500">
                            {estadoConfig.label}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {usuario.rol.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="p-4">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Acciones
              </h5>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  <Pin size={14} className="text-slate-500" />
                  Fijar conversación
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  <Star size={14} className="text-slate-500" />
                  Marcar como favorita
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  <Settings size={14} className="text-slate-500" />
                  Configuración
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageSquareIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-400"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
