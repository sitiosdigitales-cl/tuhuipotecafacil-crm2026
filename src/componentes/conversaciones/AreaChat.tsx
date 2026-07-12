"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Phone,
  Video,
  MoreHorizontal,
  Search,
  Info,
  X,
  Hash,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./Avatar";
import { MensajeItem } from "./MensajeItem";
import { InputMensaje } from "./InputMensaje";
import { useChat } from "@/lib/hooks/useChat";
import { useUser } from "@/lib/contexts/UserContext";
import type { Mensaje, Conversacion } from "@/tipos/conversaciones";

interface AreaChatProps {
  conversacionId: string | null;
  usuarioActualId: string;
}

export function AreaChat({ conversacionId, usuarioActualId }: AreaChatProps) {
  const { usuarios, usuarioActual } = useUser();
  const [conversacion, setConversacion] = useState<Conversacion | null>(null);
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const [busquedaChat, setBusquedaChat] = useState("");
  const [respondiendoA, setRespondiendoA] = useState<Mensaje | null>(null);
  const mensajesRef = useRef<HTMLDivElement>(null);

  const { mensajes, cargando, enviando, enviarMensaje, eliminarMensaje, reaccionarMensaje } = useChat({
    conversacionId,
    usuarioActualId,
    usuarioActualNombre: `${usuarioActual.nombre} ${usuarioActual.apellido}`,
  });

  // Cargar datos de la conversación
  useEffect(() => {
    if (!conversacionId) {
      setConversacion(null);
      return;
    }

    async function cargarConversacion() {
      try {
        const res = await fetch(`/api/conversaciones/${conversacionId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setConversacion({
            id: json.data.id,
            nombre: json.data.nombre,
            tipo: json.data.tipo,
            participantes: json.data.participantes || [],
            mensajesNoLeidos: json.data.mensajesNoLeidos || 0,
            descripcion: json.data.descripcion,
            esFijo: json.data.esFijo,
            creadoEn: new Date(json.data.creadoEn || Date.now()),
            creadoPor: json.data.creadoPor || "",
          });
        }
      } catch {
        setConversacion(null);
      }
    }

    cargarConversacion();
  }, [conversacionId]);

  useEffect(() => {
    // Scroll al fondo cuando cambian los mensajes
    const timer = setTimeout(() => {
      if (mensajesRef.current) {
        mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [mensajes.length, conversacionId]);

  const mensajesAgrupados = useMemo(() => {
    if (!mensajes || mensajes.length === 0) return [];
    return mensajes.map((msg, idx) => {
      const prev = idx > 0 ? mensajes[idx - 1] : null;
      const mostrarRemitente =
        !prev ||
        prev.remitenteId !== msg.remitenteId ||
        (msg.creadoEn && prev.creadoEn && msg.creadoEn.getTime() - prev.creadoEn.getTime() > 300000);

      const primerDelDia =
        !prev ||
        (msg.creadoEn && prev.creadoEn && msg.creadoEn.toDateString() !== prev.creadoEn.toDateString());

      return { ...msg, mostrarRemitente, primerDelDia };
    });
  }, [mensajes]);

  const handleEnviarMensaje = (contenido: string) => {
    const texto = respondiendoA
      ? `> ${respondiendoA.remitenteNombre}: ${respondiendoA.contenido.split("\n")[0]}\n\n${contenido}`
      : contenido;
    enviarMensaje(texto);
    setRespondiendoA(null);
  };

  const handleEliminarMensaje = async (mensajeId: string) => {
    await eliminarMensaje(mensajeId);
    toast.success("Mensaje eliminado");
  };

  const handleReaccionar = async (mensajeId: string, emoji: string) => {
    await reaccionarMensaje(mensajeId, emoji);
  };

  const getNombreConversacion = (): string => {
    if (!conversacion) return "";
    if (conversacion.tipo === "DIRECTO") {
      const otroId = conversacion.participantes.find((p) => p !== usuarioActualId);
      if (!otroId) return conversacion.nombre;
      const otro = usuarios.find((u) => u.id === otroId);
      return otro ? `${otro.nombre} ${otro.apellido}` : conversacion.nombre;
    }
    return conversacion.nombre;
  };

  const getDescripcionConversacion = (): string => {
    if (!conversacion) return "";
    if (conversacion.descripcion) return conversacion.descripcion;
    return `${conversacion.participantes.length} participantes`;
  };

  const mensajesFiltrados = useMemo(() => {
    if (!busquedaChat.trim()) return mensajesAgrupados;
    const q = busquedaChat.toLowerCase();
    return mensajesAgrupados.filter((m) => m.contenido?.toLowerCase().includes(q));
  }, [mensajesAgrupados, busquedaChat]);

  const getOtroUsuario = () => {
    if (!conversacion || conversacion.tipo !== "DIRECTO") return null;
    const otroId = conversacion.participantes.find((p) => p !== usuarioActualId);
    return otroId ? usuarios.find((u) => u.id === otroId) : null;
  };

  if (!conversacionId || !conversacion) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-slate-100">
            <MessageSquare size={32} className="text-slate-400" />
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
                <span className="text-amber-500 text-xs">📌</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">{descripcionConversacion}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setBusquedaChat(busquedaChat ? "" : " ")}
            className={`p-2 rounded-lg transition-colors ${busquedaChat ? "bg-blue-100 text-blue-600" : "hover:bg-slate-100 text-slate-500"}`}
            title="Buscar en conversación"
          >
            <Search size={16} />
          </button>
          <button
            onClick={() => {
              const otro = getOtroUsuario();
              if (otro?.telefono) window.open(`tel:${otro.telefono}`, "_self");
              else toast.info("Sin número de teléfono");
            }}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            title="Llamar"
          >
            <Phone size={16} />
          </button>
          <button
            onClick={() => toast.info("Videollamada próximamente")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            title="Videollamada"
          >
            <Video size={16} />
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
          <button
            onClick={() => toast.info("Opciones de conversación próximamente")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            title="Más opciones"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      {busquedaChat && (
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Search size={14} className="text-slate-400" />
          <input
            autoFocus
            type="text"
            value={busquedaChat === " " ? "" : busquedaChat}
            onChange={(e) => setBusquedaChat(e.target.value || " ")}
            placeholder="Buscar mensajes..."
            className="flex-1 bg-transparent text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none"
          />
          <span className="text-[10px] text-slate-400">{mensajesFiltrados.length} resultados</span>
          <button onClick={() => setBusquedaChat("")} className="p-0.5 hover:bg-slate-200 rounded">
            <X size={12} className="text-slate-400" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mensajes */}
        <div className="flex-1 flex flex-col">
          <div ref={mensajesRef} className="flex-1 overflow-y-auto py-4">
            {cargando ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-xs text-slate-500">Cargando mensajes...</span>
              </div>
            ) : mensajesFiltrados.length === 0 ? (
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
              mensajesFiltrados.map((msg) => (
                <MensajeItem
                  key={msg.id}
                  mensaje={msg}
                  esPropio={msg.remitenteId === usuarioActualId}
                  mostrarRemitente={msg.mostrarRemitente}
                  esPrimerDelDia={msg.primerDelDia}
                  onEliminar={handleEliminarMensaje}
                  onReaccionar={handleReaccionar}
                  onResponder={(m) => setRespondiendoA(m)}
                />
              ))
            )}
          </div>

          {/* Barra de respuesta */}
          {respondiendoA && (
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Reply size={14} className="text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-blue-700">{respondiendoA.remitenteNombre}</span>
                  <p className="text-[10px] text-blue-500 truncate">{respondiendoA.contenido}</p>
                </div>
              </div>
              <button onClick={() => setRespondiendoA(null)} className="p-1 hover:bg-blue-100 rounded">
                <X size={12} className="text-blue-400" />
              </button>
            </div>
          )}

          <InputMensaje
            onEnviar={handleEnviarMensaje}
            nombreConversacion={nombreConversacion}
            disabled={enviando}
          />
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

            <div className="p-4">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Participantes ({conversacion.participantes.length})
              </h5>
              <div className="space-y-2">
                {conversacion.participantes.map((pid) => {
                  const usuario = usuarios.find((u) => u.id === pid);
                  if (!usuario) return null;

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
                      </div>
                      <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {usuario.rol?.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
