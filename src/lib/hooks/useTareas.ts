"use client";

import { useState, useEffect, useCallback } from "react";
import type { Tarea, EstadoTarea, Prioridad } from "@/tipos";

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
      const json = await res.json();
      if (json.success && json.data) {
        const tareasFormateadas = json.data.map((t: Record<string, any>) => ({
          ...t,
          fechaVencimiento: t.fechaVencimiento ? new Date(t.fechaVencimiento) : undefined,
          recordatorio: t.recordatorio ? new Date(t.recordatorio) : undefined,
          creadoEn: t.creadoEn ? new Date(t.creadoEn) : new Date(),
          comentarios: t.comentarios || [],
          historial: t.historial || [],
          etiquetas: t.etiquetas ? (typeof t.etiquetas === "string" ? t.etiquetas.split(",") : t.etiquetas) : [],
        }));
        setTareas(tareasFormateadas);
      }
    } catch {
      setError("Error al cargar tareas");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarTareas();
  }, [cargarTareas]);

  const crearTarea = async (datos: CrearTareaInput) => {
    try {
      const res = await fetch("/api/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTareas((prev) => [{
          ...json.data,
          fechaVencimiento: json.data.fechaVencimiento ? new Date(json.data.fechaVencimiento) : undefined,
          creadoEn: json.data.creadoEn ? new Date(json.data.creadoEn) : new Date(),
          comentarios: [],
          historial: [],
          etiquetas: [],
        }, ...prev]);
        return json.data;
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
