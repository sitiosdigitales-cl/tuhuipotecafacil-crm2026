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
  Bell,
  X,
  Check,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { useConversaciones } from "@/lib/hooks/useConversaciones";
import { useUser } from "@/lib/contexts/UserContext";
import type { Conversacion, TipoConversacion } from "@/tipos/conversaciones";
import { toast } from "sonner";

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
  const { conversaciones, cargando, crearConversacion, recargar } = useConversaciones({ usuarioActualId });
  const [busqueda, setBusqueda] = useState("");
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<TipoConversacion, boolean>>({
    CANAL: true,
    GRUPO: true,
    DIRECTO: true,
  });
  const [mostrarNuevaConversacion, setMostrarNuevaConversacion] = useState(false);
  const [nuevaConversacionNombre, setNuevaConversacionNombre] = useState("");
  const [nuevaConversacionTipo, setNuevaConversacionTipo] = useState<TipoConversacion>("DIRECTO");
  const [nuevaConversacionParticipantes, setNuevaConversacionParticipantes] = useState<string[]>([]);
  const [nuevaConversacionDescripcion, setNuevaConversacionDescripcion] = useState("");

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

  const handleCrearConversacion = async () => {
    if (!nuevaConversacionNombre.trim()) {
      toast.error("Ingresa un nombre para la conversación");
      return;
    }

    const participantes = nuevaConversacionTipo === "DIRECTO" 
      ? [usuarioActualId, ...nuevaConversacionParticipantes]
      : [usuarioActualId];

    const resultado = await crearConversacion({
      nombre: nuevaConversacionNombre,
      tipo: nuevaConversacionTipo,
      participantes,
      descripcion: nuevaConversacionDescripcion,
    });

    if (resultado) {
      toast.success("Conversación creada", { description: nuevaConversacionNombre });
      setMostrarNuevaConversacion(false);
      setNuevaConversacionNombre("");
      setNuevaConversacionParticipantes([]);
      setNuevaConversacionDescripcion("");
      onSeleccionarConversacion(resultado.id);
    } else {
      toast.error("Error al crear conversación");
    }
  };

  const toggleParticipante = (usuarioId: string) => {
    setNuevaConversacionParticipantes((prev) => {
      if (prev.includes(usuarioId)) {
        return prev.filter((id) => id !== usuarioId);
      }
      return [...prev, usuarioId];
    });
  };

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
            <button 
              onClick={() => setMostrarNuevaConversacion(true)}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" 
              title="Nueva conversación"
            >
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
                            <span className={`text-[11px] font-semibold truncate ${
                              activa ? "text-blue-700" : "text-slate-800"
                            }`}>
                              {nombreMostrar}
                            </span>
                            {conversacion.mensajesNoLeidos > 0 && (
                              <span className="w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                {conversacion.mensajesNoLeidos}
                              </span>
                            )}
                          </div>
                          {conversacion.ultimoMensaje && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {conversacion.ultimoMensaje.contenido}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {Object.values(conversacionesFiltradas).every((items) => items.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare size={24} className="text-slate-300" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium text-center">No hay conversaciones</p>
            <p className="text-[10px] text-slate-400 text-center mt-1">Crea una nueva para empezar</p>
          </div>
        )}
      </div>

      {/* Modal Nueva Conversación */}
      {mostrarNuevaConversacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-[420px] max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Nueva Conversación</h3>
              <button onClick={() => setMostrarNuevaConversacion(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Tipo */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-2">Tipo</label>
                <div className="flex gap-2">
                  {(["DIRECTO", "GRUPO", "CANAL"] as TipoConversacion[]).map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => setNuevaConversacionTipo(tipo)}
                      className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-semibold transition-all ${
                        nuevaConversacionTipo === tipo
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {TIPO_LABEL[tipo]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Nombre</label>
                <input
                  type="text"
                  value={nuevaConversacionNombre}
                  onChange={(e) => setNuevaConversacionNombre(e.target.value)}
                  placeholder={nuevaConversacionTipo === "DIRECTO" ? "Nombre de la conversación" : "Nombre del canal/grupo"}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Descripción (opcional)</label>
                <input
                  type="text"
                  value={nuevaConversacionDescripcion}
                  onChange={(e) => setNuevaConversacionDescripcion(e.target.value)}
                  placeholder="Descripción breve"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Participantes */}
              {nuevaConversacionTipo === "DIRECTO" && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-2">Seleccionar usuario</label>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {usuarios.filter(u => u.id !== usuarioActualId && u.estado === "ACTIVO").map((usuario) => (
                      <button
                        key={usuario.id}
                        onClick={() => toggleParticipante(usuario.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${
                          nuevaConversacionParticipantes.includes(usuario.id)
                            ? "bg-blue-50 border border-blue-200"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <Avatar nombre={`${usuario.nombre} ${usuario.apellido}`} id={usuario.id} size="sm" />
                        <div className="text-left">
                          <div className="text-[11px] font-semibold text-slate-800">{usuario.nombre} {usuario.apellido}</div>
                          <div className="text-[10px] text-slate-400">{usuario.email}</div>
                        </div>
                        {nuevaConversacionParticipantes.includes(usuario.id) && (
                          <div className="ml-auto w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
              <button
                onClick={() => setMostrarNuevaConversacion(false)}
                className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearConversacion}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
