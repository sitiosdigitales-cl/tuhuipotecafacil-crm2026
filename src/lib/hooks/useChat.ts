"use client";

import { useState, useEffect, useCallback } from "react";
import type { Mensaje } from "@/tipos/conversaciones";

interface RespuestaApi<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface MensajeApi {
  id: string;
  conversacionId?: string;
  conversacionid?: string;
  remitenteId?: string;
  remitenteid?: string;
  remitenteNombre?: string;
  remitentenombre?: string;
  remitenteAvatar?: string;
  contenido: string;
  tipo?: Mensaje["tipo"];
  estado?: Mensaje["estado"];
  archivoUrl?: string;
  archivourl?: string;
  creadoEn?: string | number | Date;
  creadoen?: string | number | Date;
  reacciones?: Record<string, string[]>;
}

function normalizarMensaje(mensaje: MensajeApi): Mensaje {
  return {
    id: mensaje.id,
    conversacionId: mensaje.conversacionId ?? mensaje.conversacionid ?? "",
    remitenteId: mensaje.remitenteId ?? mensaje.remitenteid ?? "",
    remitenteNombre: mensaje.remitenteNombre ?? mensaje.remitentenombre ?? "Usuario",
    remitenteAvatar: mensaje.remitenteAvatar,
    contenido: mensaje.contenido,
    tipo: mensaje.tipo ?? "TEXTO",
    estado: mensaje.estado ?? "ENVIADO",
    archivoUrl: mensaje.archivoUrl ?? mensaje.archivourl,
    creadoEn: new Date(mensaje.creadoEn ?? mensaje.creadoen ?? Date.now()),
    reacciones: mensaje.reacciones,
  };
}

interface UseChatOptions {
  conversacionId: string | null;
  usuarioActualId: string;
  usuarioActualNombre?: string;
}

export function useChat({ conversacionId, usuarioActualId, usuarioActualNombre }: UseChatOptions) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Cargar mensajes de la conversación
  const cargarMensajes = useCallback(async (convId: string) => {
    setCargando(true);
    try {
      const res = await fetch(`/api/mensajes?conversacionId=${convId}&limite=100`, {
        credentials: "include",
      });
      const json = (await res.json().catch(() => null)) as
        | RespuestaApi<MensajeApi[]>
        | null;
      if (!res.ok || !json?.success || !json.data) {
        throw new Error(json?.error || "No se pudieron cargar los mensajes");
      }
      setMensajes(json.data.map(normalizarMensaje));
    } catch {
      // Mantener el último estado confirmado durante un fallo temporal.
    } finally {
      setCargando(false);
    }
  }, []);

  // Cargar mensajes cuando cambia la conversación
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!conversacionId) {
        setMensajes([]);
        return;
      }
      setMensajes([]);
      void cargarMensajes(conversacionId);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [conversacionId, cargarMensajes]);

  // Mantener la conversación actualizada a través de la API autenticada.
  useEffect(() => {
    if (!conversacionId) return;
    const interval = window.setInterval(
      () => void cargarMensajes(conversacionId),
      5_000
    );
    return () => window.clearInterval(interval);
  }, [conversacionId, cargarMensajes]);

  // Enviar mensaje
  const enviarMensaje = useCallback(async (contenido: string) => {
    if (!conversacionId || !contenido.trim()) return;
    setEnviando(true);

    try {
      const res = await fetch("/api/mensajes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversacionId,
          remitenteId: usuarioActualId,
          remitenteNombre: usuarioActualNombre || "Usuario",
          contenido: contenido.trim(),
          tipo: "TEXTO",
        }),
      });

      const json = (await res.json().catch(() => null)) as
        | RespuestaApi<MensajeApi>
        | null;
      if (!res.ok || !json?.success || !json.data) {
        throw new Error(json?.error || "No se pudo enviar el mensaje");
      }

      const mensajeGuardado = normalizarMensaje(json.data);
      setMensajes((prev) => [...prev, mensajeGuardado]);
    } finally {
      setEnviando(false);
    }
  }, [conversacionId, usuarioActualId, usuarioActualNombre]);

  // Eliminar mensaje
  const eliminarMensaje = useCallback(async (mensajeId: string) => {
    const res = await fetch(`/api/mensajes/${mensajeId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = (await res.json().catch(() => null)) as
      | RespuestaApi<MensajeApi>
      | null;
    if (!res.ok || !json?.success || !json.data) {
      throw new Error(json?.error || "No se pudo eliminar el mensaje");
    }

    const mensajeGuardado = normalizarMensaje(json.data);
    setMensajes((prev) =>
      prev.map((mensaje) =>
        mensaje.id === mensajeId ? mensajeGuardado : mensaje
      )
    );
  }, []);

  // Reaccionar a mensaje
  const reaccionarMensaje = useCallback(async (mensajeId: string, emoji: string) => {
    const res = await fetch(`/api/mensajes/${mensajeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ emoji }),
    });
    const json = (await res.json().catch(() => null)) as
      | RespuestaApi<MensajeApi>
      | null;
    if (!res.ok || !json?.success || !json.data) {
      throw new Error(json?.error || "No se pudo actualizar la reacción");
    }

    const mensajeGuardado = normalizarMensaje(json.data);
    setMensajes((prev) =>
      prev.map((mensaje) =>
        mensaje.id === mensajeId ? mensajeGuardado : mensaje
      )
    );
  }, []);

  return {
    mensajes,
    cargando,
    enviando,
    enviarMensaje,
    eliminarMensaje,
    reaccionarMensaje,
  };
}
