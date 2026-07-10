"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Mensaje } from "@/tipos/conversaciones";

interface UseChatOptions {
  conversacionId: string | null;
  usuarioActualId: string;
}

export function useChat({ conversacionId, usuarioActualId }: UseChatOptions) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const channelRef = useRef<any>(null);

  // Cargar mensajes de la conversación
  const cargarMensajes = useCallback(async (convId: string) => {
    setCargando(true);
    try {
      const res = await fetch(`/api/mensajes?conversacionId=${convId}&limite=100`);
      const json = await res.json();
      if (json.success && json.data) {
        setMensajes(json.data.map((m: Record<string, any>) => ({
          ...m,
          creadoEn: new Date(m.creadoEn),
        })));
      }
    } catch {
      setMensajes([]);
    } finally {
      setCargando(false);
    }
  }, []);

  // Suscribirse a nuevos mensajes en tiempo real
  useEffect(() => {
    if (!conversacionId) {
      setMensajes([]);
      return;
    }

    cargarMensajes(conversacionId);

    // Limpiar suscripción anterior
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Crear suscripción en tiempo real
    const channel = supabase
      .channel(`mensajes:${conversacionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
          filter: `conversacionid=eq.${conversacionId}`,
        },
        (payload) => {
          const nuevoMensaje: Mensaje = {
            id: payload.new.id,
            conversacionId: payload.new.conversacionid,
            remitenteId: payload.new.remitenteid,
            remitenteNombre: payload.new.remitentenombre,
            contenido: payload.new.contenido,
            tipo: payload.new.tipo || "TEXTO",
            estado: payload.new.estado || "ENVIADO",
            archivoUrl: payload.new.archivourl,
            creadoEn: new Date(payload.new.creadoEn),
          };

          // Evitar duplicados
          setMensajes((prev) => {
            if (prev.some((m) => m.id === nuevoMensaje.id)) return prev;
            return [...prev, nuevoMensaje];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversacionId, cargarMensajes]);

  // Enviar mensaje
  const enviarMensaje = useCallback(async (contenido: string) => {
    if (!conversacionId || !contenido.trim()) return;

    setEnviando(true);
    try {
      const res = await fetch("/api/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversacionId,
          remitenteId: usuarioActualId,
          remitenteNombre: "Usuario Actual", // En producción, obtener del contexto
          contenido: contenido.trim(),
          tipo: "TEXTO",
        }),
      });

      const json = await res.json();
      if (!json.success) {
        console.error("Error al enviar mensaje");
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    } finally {
      setEnviando(false);
    }
  }, [conversacionId, usuarioActualId]);

  return {
    mensajes,
    cargando,
    enviando,
    enviarMensaje,
  };
}
