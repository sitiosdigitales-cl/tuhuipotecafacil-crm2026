"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Mensaje } from "@/tipos/conversaciones";

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
      const json = await res.json();
      if (json.success && json.data) {
        setMensajes(json.data.map((m: Record<string, any>) => ({
          id: m.id,
          conversacionId: m.conversacionId || m.conversacionid,
          remitenteId: m.remitenteId || m.remitenteid,
          remitenteNombre: m.remitenteNombre || m.remitentenombre,
          contenido: m.contenido,
          tipo: m.tipo || "TEXTO",
          estado: m.estado || "ENVIADO",
          archivoUrl: m.archivoUrl || m.archivourl,
          creadoEn: new Date(m.creadoEn || m.creadoen),
        })));
      }
    } catch {
      setMensajes([]);
    } finally {
      setCargando(false);
    }
  }, []);

  // Cargar mensajes cuando cambia la conversación
  useEffect(() => {
    if (!conversacionId) {
      setMensajes([]);
      return;
    }
    cargarMensajes(conversacionId);
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
          const nuevo = payload.new as Record<string, any>;

          // Solo mensajes de esta conversación
          if (nuevo.conversacionid !== conversacionId) return;

          const mensajeNuevo: Mensaje = {
            id: nuevo.id,
            conversacionId: nuevo.conversacionid,
            remitenteId: nuevo.remitenteid,
            remitenteNombre: nuevo.remitentenombre,
            contenido: nuevo.contenido,
            tipo: nuevo.tipo || "TEXTO",
            estado: nuevo.estado || "ENVIADO",
            archivoUrl: nuevo.archivourl,
            creadoEn: new Date(nuevo.creadoen),
          };

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

      const json = await res.json();
      if (json.success && json.data) {
        // Reemplazar el mensaje temporal con el real
        setMensajes((prev) =>
          prev.map((m) =>
            m.id === mensajeLocal.id
              ? {
                  id: json.data.id,
                  conversacionId: json.data.conversacionid,
                  remitenteId: json.data.remitenteid,
                  remitenteNombre: json.data.remitentenombre,
                  contenido: json.data.contenido,
                  tipo: json.data.tipo || "TEXTO",
                  estado: json.data.estado || "ENVIADO",
                  archivoUrl: json.data.archivourl,
                  creadoEn: new Date(json.data.creadoen),
                }
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

  return {
    mensajes,
    cargando,
    enviando,
    enviarMensaje,
  };
}
