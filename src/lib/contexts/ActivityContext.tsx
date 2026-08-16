"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";

export interface Actividad {
  id: string;
  leadId: string;
  tipo: "llamada" | "email" | "whatsapp" | "documento" | "reunion" | "sistema" | "tarea" | "cambio_estado" | "nota";
  titulo: string;
  descripcion: string;
  fecha: Date;
  usuario: string;
  usuarioId?: string;
  metadata?: Record<string, unknown>;
}

type ActividadApi = Omit<Actividad, "fecha" | "leadId" | "usuarioId"> & {
  fecha: string | Date;
  leadId?: string;
  leadid?: string;
  usuarioId?: string;
  usuarioid?: string;
};

interface RespuestaApi<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function normalizarActividad(actividad: ActividadApi): Actividad {
  const {
    leadid,
    usuarioid,
    leadId: leadIdCamel,
    usuarioId: usuarioIdCamel,
    ...datos
  } = actividad;
  const leadId = leadIdCamel ?? leadid;
  if (!leadId) throw new Error("La actividad no incluye leadId");

  return {
    ...datos,
    leadId,
    usuarioId: usuarioIdCamel ?? usuarioid,
    fecha: new Date(actividad.fecha),
  };
}

interface ActivityContextType {
  actividades: Actividad[];
  agregarActividad: (
    actividad: Omit<Actividad, "id" | "fecha">
  ) => Promise<Actividad>;
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
        const response = await fetch("/api/actividades?limit=200", {
          credentials: "include",
        });
        const data = (await response.json().catch(() => null)) as
          | RespuestaApi<ActividadApi[]>
          | null;
        if (response.ok && data?.success && data.data) {
          setActividades(data.data.map(normalizarActividad));
        }
      } catch {
        // Silenciar errores
      }
    };
    cargarActividades();
  }, []);

  const agregarActividad = useCallback(async (nuevaActividad: Omit<Actividad, "id" | "fecha">) => {
    const response = await fetch("/api/actividades", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevaActividad),
    });
    const data = (await response.json().catch(() => null)) as
      | RespuestaApi<ActividadApi>
      | null;

    if (!response.ok || !data?.success || !data.data) {
      throw new Error(data?.error || "No se pudo registrar la actividad");
    }

    const actividadPersistida = normalizarActividad(data.data);
    setActividades((prev) => [actividadPersistida, ...prev]);
    return actividadPersistida;
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

  const valor = useMemo(
    () => ({ actividades, agregarActividad, obtenerActividadesLead, obtenerActividadesRecientes }),
    [actividades, agregarActividad, obtenerActividadesLead, obtenerActividadesRecientes]
  );

  return (
    <ActivityContext.Provider value={valor}>
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

export function getIconoActividad(tipo: string): { icono: string; color: string; bg: string } {
  const config: Record<string, { icono: string; color: string; bg: string }> = {
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
