"use client";

import { useState } from "react";
import {
  Reply,
  Smile,
  Copy,
  Pin,
  Trash2,
  Check,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./Avatar";
import { formatMensajeTime, formatFullDate } from "@/datos/conversaciones-mock";
import type { Mensaje } from "@/tipos/conversaciones";

const EMOJIS_RAPIDOS = ["👍", "❤️", "😂", "🔥", "✅", "😮"];

interface MensajeItemProps {
  mensaje: Mensaje;
  esPropio: boolean;
  mostrarRemitente: boolean;
  esPrimerDelDia: boolean;
  onEliminar?: (mensajeId: string) => void;
  onReaccionar?: (mensajeId: string, emoji: string) => void;
  onResponder?: (mensaje: Mensaje) => void;
}

const ESTADO_ICON: Record<string, typeof Check> = {
  ENVIADO: Check,
  ENTREGADO: CheckCheck,
  LEIDO: CheckCheck,
};

export function MensajeItem({ mensaje, esPropio, mostrarRemitente, esPrimerDelDia, onEliminar, onReaccionar, onResponder }: MensajeItemProps) {
  const [mostrarAcciones, setMostrarAcciones] = useState(false);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);

  const EstadoIcon = ESTADO_ICON[mensaje.estado] || Check;

  const handleEliminar = async () => {
    if (!onEliminar) return;
    onEliminar(mensaje.id);
    setMostrarAcciones(false);
  };

  const handleReaccionar = async (emoji: string) => {
    if (!onReaccionar) return;
    onReaccionar(mensaje.id, emoji);
    setMostrarEmojis(false);
  };

  return (
    <div className="group">
      {/* Separador de fecha */}
      {esPrimerDelDia && (
        <div className="flex items-center gap-4 my-4 px-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] font-semibold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
            {formatFullDate(mensaje.creadoEn)}
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      )}

      <div
        className={`flex items-start gap-3 px-4 py-1.5 hover:bg-slate-50/50 transition-colors ${
          mostrarRemitente ? "mt-3" : "mt-0.5"
        }`}
        onMouseEnter={() => setMostrarAcciones(true)}
        onMouseLeave={() => { setMostrarAcciones(false); setMostrarEmojis(false); }}
      >
        {/* Avatar o espacio */}
        <div className="w-9 flex-shrink-0">
          {mostrarRemitente && (
            <Avatar nombre={mensaje.remitenteNombre} id={mensaje.remitenteId} size="md" showStatus={false} />
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Header del mensaje */}
          {mostrarRemitente && (
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-slate-800">
                {mensaje.remitenteNombre}
              </span>
              <span className="text-[9px] text-slate-400">
                {formatMensajeTime(mensaje.creadoEn)}
              </span>
              {mensaje.editadoEn && (
                <span className="text-[9px] text-slate-400 italic">(editado)</span>
              )}
            </div>
          )}

          {/* Contenido del mensaje */}
          <div className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
            {mensaje.contenido}
          </div>

          {/* Reacciones */}
          {mensaje.reacciones && Object.keys(mensaje.reacciones).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {Object.entries(mensaje.reacciones).map(([emoji, usuarios]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaccionar(emoji)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-full text-[11px] hover:bg-blue-100 transition-colors"
                >
                  <span>{emoji}</span>
                  <span className="text-blue-600 font-medium">{usuarios.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Acciones del mensaje */}
        {mostrarAcciones && (
          <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg shadow-lg px-1 py-0.5 flex-shrink-0">
            <div className="relative">
              <button
                onClick={() => setMostrarEmojis(!mostrarEmojis)}
                className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                title="Reacciones"
              >
                <Smile size={14} className="text-slate-500" />
              </button>
              {/* Mini picker de reacciones */}
              {mostrarEmojis && (
                <div className="absolute bottom-full right-0 mb-1 flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg shadow-lg px-1.5 py-1 z-50">
                  {EMOJIS_RAPIDOS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaccionar(emoji)}
                      className="w-7 h-7 text-sm hover:bg-slate-100 rounded-md transition-colors flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                if (onResponder) onResponder(mensaje);
                setMostrarAcciones(false);
              }}
              className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
              title="Responder"
            >
              <Reply size={14} className="text-slate-500" />
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(mensaje.contenido).then(() => toast.success("Mensaje copiado")); }}
              className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
              title="Copiar"
            >
              <Copy size={14} className="text-slate-500" />
            </button>
            <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors" title="Fijar">
              <Pin size={14} className="text-slate-500" />
            </button>
            {esPropio && (
              <button onClick={handleEliminar} className="p-1.5 hover:bg-red-50 rounded-md transition-colors" title="Eliminar">
                <Trash2 size={14} className="text-red-500" />
              </button>
            )}
          </div>
        )}

        {/* Estado del mensaje (solo en mensajes propios) */}
        {esPropio && !mostrarRemitente && (
          <div className="flex-shrink-0 self-end">
            <EstadoIcon
              size={12}
              className={
                mensaje.estado === "LEIDO" ? "text-blue-500" : "text-slate-400"
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
