"use client";

import { useState, useEffect, useCallback } from "react";
import type { Conversacion } from "@/tipos/conversaciones";

interface UseConversacionesOptions {
  usuarioActualId: string;
}

export function useConversaciones({ usuarioActualId }: UseConversacionesOptions) {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarConversaciones = useCallback(async () => {
    try {
      // Obtener todas las conversaciones y filtrar en el cliente
      const res = await fetch(`/api/conversaciones`);
      const json = await res.json();
      if (json.success && json.data) {
        // Filtrar conversaciones donde el usuario actual es participante
        const filtradas = json.data.filter((c: any) => {
          const participantes = Array.isArray(c.participantes) ? c.participantes : [];
          return participantes.includes(usuarioActualId);
        });
        setConversaciones(filtradas);
      }
    } catch {
      setConversaciones([]);
    } finally {
      setCargando(false);
    }
  }, [usuarioActualId]);

  useEffect(() => {
    cargarConversaciones();
  }, [cargarConversaciones]);

  const crearConversacion = useCallback(async (datos: {
    nombre: string;
    tipo: string;
    participantes: string[];
    descripcion?: string;
  }) => {
    try {
      const res = await fetch("/api/conversaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...datos,
          creadoPor: usuarioActualId,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setConversaciones((prev) => [json.data, ...prev]);
        return json.data;
      }
    } catch {
      // Error silencioso
    }
    return null;
  }, [usuarioActualId]);

  return {
    conversaciones,
    cargando,
    crearConversacion,
    recargar: cargarConversaciones,
  };
}
