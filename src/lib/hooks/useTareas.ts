"use client";

import { useState, useEffect, useCallback } from "react";
import type { Tarea, EstadoTarea, Prioridad } from "@/tipos";
import type { TareaApi } from "@/modulos/tareas/servicios";

interface RespuestaApi<T> {
  success: boolean;
  data?: T;
}

type TareaRespuesta = TareaApi & {
  recordatorio?: string | Date;
  etiquetas?: string | string[];
  comentarios?: Tarea["comentarios"];
  historial?: Tarea["historial"];
};

function normalizarTarea(tarea: TareaRespuesta): Tarea {
  return {
    ...tarea,
    fechaVencimiento: tarea.fechaVencimiento ? new Date(tarea.fechaVencimiento) : undefined,
    recordatorio: tarea.recordatorio ? new Date(tarea.recordatorio) : undefined,
    creadoEn: tarea.creadoEn ? new Date(tarea.creadoEn) : new Date(),
    comentarios: tarea.comentarios ?? [],
    historial: tarea.historial ?? [],
    etiquetas: tarea.etiquetas
      ? typeof tarea.etiquetas === "string"
        ? tarea.etiquetas.split(",")
        : tarea.etiquetas
      : [],
  };
}

interface CrearTareaInput {
  titulo: string;
  descripcion?: string;
  estado?: EstadoTarea;
  tipo?: string;
  prioridad?: Prioridad;
  leadId?: string;
  leadNombre?: string;
  asignadoA?: string;
  nombreEjecutivo?: string;
  fechaVencimiento?: string;
}

export function useTareas() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarTareas = useCallback(async () => {
    try {
      setCargando(true);
      const res = await fetch("/api/tareas");
      const json = await res.json() as RespuestaApi<TareaRespuesta[]>;
      if (json.success && json.data) {
        const tareasFormateadas = json.data.map(normalizarTarea);
        setTareas(tareasFormateadas);
      }
    } catch {
      setError("Error al cargar tareas");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void cargarTareas(), 0);
    return () => window.clearTimeout(timeout);
  }, [cargarTareas]);

  const crearTarea = async (datos: CrearTareaInput) => {
    try {
      const res = await fetch("/api/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const json = await res.json() as RespuestaApi<TareaRespuesta>;
      if (json.success && json.data) {
        const tarea = normalizarTarea(json.data);
        setTareas((prev) => [tarea, ...prev]);
        return tarea;
      }
      return null;
    } catch {
      return null;
    }
  };

  const actualizarTarea = async (id: string, datos: Partial<Tarea>) => {
    try {
      const res = await fetch(`/api/tareas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTareas((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...json.data } : t))
        );
        return json.data;
      }
      return null;
    } catch {
      return null;
    }
  };

  const eliminarTarea = async (id: string) => {
    try {
      const res = await fetch(`/api/tareas/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setTareas((prev) => prev.filter((t) => t.id !== id));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const cambiarEstado = async (id: string, nuevoEstado: EstadoTarea) => {
    return actualizarTarea(id, { estado: nuevoEstado } as Partial<Tarea>);
  };

  return {
    tareas,
    cargando,
    error,
    cargarTareas,
    crearTarea,
    actualizarTarea,
    eliminarTarea,
    cambiarEstado,
  };
}
