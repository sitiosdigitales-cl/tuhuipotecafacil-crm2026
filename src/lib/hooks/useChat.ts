"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
          remitenteNombre: usuarioActualNombre || "Usuario",
          contenido: contenido.trim(),
          tipo: "TEXTO",
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        // Agregar el mensaje a la lista inmediatamente
        const nuevoMensaje: Mensaje = {
          id: json.data.id,
          conversacionId: json.data.conversacionid,
          remitenteId: json.data.remitenteid,
          remitenteNombre: json.data.remitentenombre,
          contenido: json.data.contenido,
          tipo: json.data.tipo || "TEXTO",
          estado: json.data.estado || "ENVIADO",
          archivoUrl: json.data.archivourl,
          creadoEn: new Date(json.data.creadoen),
        };
        setMensajes((prev) => {
          if (prev.some((m) => m.id === nuevoMensaje.id)) return prev;
          return [...prev, nuevoMensaje];
        });
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
