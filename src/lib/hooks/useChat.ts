"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Mensaje } from "@/tipos/conversaciones";

interface RespuestaApi<T> {
  success: boolean;
  data?: T;
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
      const res = await fetch(`/api/mensajes?conversacionId=${convId}&limite=100`);
      const json = await res.json() as RespuestaApi<MensajeApi[]>;
      if (json.success && json.data) {
        setMensajes(json.data.map(normalizarMensaje));
      }
    } catch {
      setMensajes([]);
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
      void cargarMensajes(conversacionId);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [conversacionId, cargarMensajes]);

  // Suscripción Realtime a nuevos mensajes
  useEffect(() => {
    if (!conversacionId) return;

    const channel = supabase
      .channel(`mensajes-${conversacionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
        },
        (payload) => {
          const nuevo = payload.new as MensajeApi;

          // Solo mensajes de esta conversación
          if ((nuevo.conversacionId ?? nuevo.conversacionid) !== conversacionId) return;

          const mensajeNuevo = normalizarMensaje(nuevo);

          setMensajes((prev) => {
            // Deduplicar: no agregar si ya existe (el sender lo tiene por optimistic update)
            if (prev.some((m) => m.id === mensajeNuevo.id)) return prev;
            return [...prev, mensajeNuevo];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversacionId]);

  // Enviar mensaje
  const enviarMensaje = useCallback(async (contenido: string) => {
    if (!conversacionId || !contenido.trim()) return;

    // Crear mensaje local inmediatamente (optimistic update)
    const mensajeLocal: Mensaje = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversacionId,
      remitenteId: usuarioActualId,
      remitenteNombre: usuarioActualNombre || "Usuario",
      contenido: contenido.trim(),
      tipo: "TEXTO",
      estado: "ENVIADO",
      creadoEn: new Date(),
    };

    setMensajes((prev) => [...prev, mensajeLocal]);
    setEnviando(true);

    try {
      const res = await fetch("/api/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversacionId,
          remitenteId: usuarioActualId,
          remitenteNombre: usuarioActualNombre || "Usuario",
          contenido: contenido.trim(),
          tipo: "TEXTO",
        }),
      });

      const json = await res.json() as RespuestaApi<MensajeApi>;
      if (json.success && json.data) {
        const mensajeGuardado = normalizarMensaje(json.data);
        // Reemplazar el mensaje temporal con el real
        setMensajes((prev) =>
          prev.map((m) =>
            m.id === mensajeLocal.id
              ? mensajeGuardado
              : m
          )
        );
      }
    } catch {
      setMensajes((prev) =>
        prev.map((m) =>
          m.id === mensajeLocal.id ? { ...m, estado: "ERROR" as const } : m
        )
      );
    } finally {
      setEnviando(false);
    }
  }, [conversacionId, usuarioActualId, usuarioActualNombre]);

  // Eliminar mensaje
  const eliminarMensaje = useCallback(async (mensajeId: string) => {
    setMensajes((prev) =>
      prev.map((m) =>
        m.id === mensajeId ? { ...m, contenido: "[Mensaje eliminado]", tipo: "SISTEMA" as const } : m
      )
    );
    try {
      await fetch(`/api/mensajes/${mensajeId}`, { method: "DELETE", credentials: "include" });
    } catch {
      // Silently fail — optimistic update already done
    }
  }, []);

  // Reaccionar a mensaje
  const reaccionarMensaje = useCallback(async (mensajeId: string, emoji: string) => {
    setMensajes((prev) =>
      prev.map((m) => {
        if (m.id !== mensajeId) return m;
        const reacciones = { ...m.reacciones };
        const usuarios = reacciones[emoji] || [];
        if (usuarios.includes(usuarioActualId)) {
          // Quitar reacción
          reacciones[emoji] = usuarios.filter((u) => u !== usuarioActualId);
          if (reacciones[emoji].length === 0) delete reacciones[emoji];
        } else {
          // Agregar reacción
          reacciones[emoji] = [...usuarios, usuarioActualId];
        }
        return { ...m, reacciones };
      })
    );
    // Guardar en BD
    const msg = mensajes.find((m) => m.id === mensajeId);
    if (msg) {
      const reacciones = { ...msg.reacciones };
      const usuarios = reacciones[emoji] || [];
      if (usuarios.includes(usuarioActualId)) {
        reacciones[emoji] = usuarios.filter((u) => u !== usuarioActualId);
        if (reacciones[emoji].length === 0) delete reacciones[emoji];
      } else {
        reacciones[emoji] = [...usuarios, usuarioActualId];
      }
      try {
        await fetch(`/api/mensajes/${mensajeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reacciones }),
        });
      } catch {
        // Silently fail
      }
    }
  }, [mensajes, usuarioActualId]);

  return {
    mensajes,
    cargando,
    enviando,
    enviarMensaje,
    eliminarMensaje,
    reaccionarMensaje,
  };
}
