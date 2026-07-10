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
      const res = await fetch(`/api/conversaciones?participante=${usuarioActualId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setConversaciones(json.data);
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
