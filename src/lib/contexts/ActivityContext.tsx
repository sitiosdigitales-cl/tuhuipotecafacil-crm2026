"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface Actividad {
  id: string;
  leadId: string;
  tipo: "llamada" | "email" | "whatsapp" | "documento" | "reunion" | "sistema" | "tarea" | "cambio_estado" | "nota";
  titulo: string;
  descripcion: string;
  fecha: Date;
  usuario: string;
  usuarioId?: string;
  metadata?: Record<string, any>;
}

interface ActivityContextType {
  actividades: Actividad[];
  agregarActividad: (actividad: Omit<Actividad, "id" | "fecha">) => Promise<void>;
  obtenerActividadesLead: (leadId: string) => Actividad[];
  obtenerActividadesRecientes: (leadId: string, limit?: number) => Actividad[];
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [actividades, setActividades] = useState<Actividad[]>([]);

  // Cargar actividades desde la API
  useEffect(() => {
    const cargarActividades = async () => {
      try {
        const response = await fetch("/api/actividades?limit=200");
        const data = await response.json();
        if (data.success && data.data) {
          setActividades(data.data.map((a: any) => ({
            ...a,
            fecha: new Date(a.fecha),
          })));
        }
      } catch {
        // Silenciar errores
      }
    };
    cargarActividades();
  }, []);

  const agregarActividad = useCallback(async (nuevaActividad: Omit<Actividad, "id" | "fecha">) => {
    // Optimistic update
    const actividadLocal: Actividad = {
      ...nuevaActividad,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fecha: new Date(),
    };
    setActividades((prev) => [actividadLocal, ...prev]);

    try {
      await fetch("/api/actividades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaActividad),
      });
    } catch {
      // La actividad queda en el estado local
    }
  }, []);

  const obtenerActividadesLead = useCallback((leadId: string) => {
    return actividades
      .filter((a) => a.leadId === leadId)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }, [actividades]);

  const obtenerActividadesRecientes = useCallback((leadId: string, limit: number = 5) => {
    return actividades
      .filter((a) => a.leadId === leadId)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, limit);
  }, [actividades]);

  return (
    <ActivityContext.Provider value={{
      actividades,
      agregarActividad,
      obtenerActividadesLead,
      obtenerActividadesRecientes,
    }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivities() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error("useActivities debe ser usado dentro de un ActivityProvider");
  }
  return context;
}

export function getIconoActividad(tipo: string): { icono: any; color: string; bg: string } {
  const config: Record<string, { icono: any; color: string; bg: string }> = {
    llamada: { icono: "Phone", color: "text-emerald-500", bg: "bg-emerald-50" },
    email: { icono: "Mail", color: "text-blue-500", bg: "bg-blue-50" },
    whatsapp: { icono: "MessageSquare", color: "text-green-500", bg: "bg-green-50" },
    documento: { icono: "FileText", color: "text-purple-500", bg: "bg-purple-50" },
    reunion: { icono: "Calendar", color: "text-amber-500", bg: "bg-amber-50" },
    sistema: { icono: "Clock", color: "text-slate-500", bg: "bg-slate-50" },
    tarea: { icono: "CheckCircle", color: "text-indigo-500", bg: "bg-indigo-50" },
    cambio_estado: { icono: "ChevronRight", color: "text-cyan-500", bg: "bg-cyan-50" },
    nota: { icono: "Edit", color: "text-orange-500", bg: "bg-orange-50" },
  };
  return config[tipo] || config.sistema;
}

export function formatearTiempoRelativo(fecha: Date): string {
  const ahora = new Date();
  const diff = ahora.getTime() - fecha.getTime();
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);
  const semanas = Math.floor(dias / 7);

  if (minutos < 1) return "Ahora mismo";
  if (minutos < 60) return `Hace ${minutos}m`;
  if (horas < 24) return `Hace ${horas}h`;
  if (dias < 7) return `Hace ${dias}d`;
  if (semanas < 4) return `Hace ${semanas}sem`;
  return fecha.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}
