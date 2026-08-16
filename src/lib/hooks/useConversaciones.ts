"use client";

import { useState, useEffect, useCallback } from "react";
import type { Conversacion } from "@/tipos/conversaciones";

interface RespuestaApi<T> {
  success: boolean;
  data?: T;
}

type ConversacionApi = Omit<Conversacion, "participantes" | "creadoEn"> & {
  participantes?: unknown;
  creadoEn: string | Date;
};

function normalizarConversacion(conversacion: ConversacionApi): Conversacion {
  const participantes = Array.isArray(conversacion.participantes)
    ? conversacion.participantes.filter((id): id is string => typeof id === "string")
    : [];

  return {
    ...conversacion,
    participantes,
    creadoEn: new Date(conversacion.creadoEn),
  };
}

interface UseConversacionesOptions {
  usuarioActualId: string;
}

export function useConversaciones({ usuarioActualId }: UseConversacionesOptions) {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarConversaciones = useCallback(async () => {
    try {
      // Obtener todas las conversaciones
      const res = await fetch(`/api/conversaciones`);
      const json = await res.json() as RespuestaApi<ConversacionApi[]>;
      if (json.success && json.data) {
        setConversaciones(json.data.map(normalizarConversacion));
      }
    } catch {
      setConversaciones([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void cargarConversaciones(), 0);
    return () => window.clearTimeout(timeout);
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
      const json = await res.json() as RespuestaApi<ConversacionApi>;
      if (json.success && json.data) {
        const conversacion = normalizarConversacion(json.data);
        setConversaciones((prev) => [conversacion, ...prev]);
        return conversacion;
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
