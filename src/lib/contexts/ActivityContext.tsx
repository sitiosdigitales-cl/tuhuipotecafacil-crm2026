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
  agregarActividad: (actividad: Omit<Actividad, "id" | "fecha">) => void;
  obtenerActividadesLead: (leadId: string) => Actividad[];
  obtenerActividadesRecientes: (leadId: string, limit?: number) => Actividad[];
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

const STORAGE_KEY = "crm_actividades";

function generarActividadesIniciales(): Actividad[] {
  const ahora = new Date();
  return [
    { id: "act-1", leadId: "lead-1", tipo: "llamada", titulo: "Llamada de seguimiento", descripcion: "Seguimiento a María sobre documentos pendientes", fecha: new Date(ahora.getTime() - 3600000), usuario: "Andrés Pérez", usuarioId: "u2" },
    { id: "act-2", leadId: "lead-1", tipo: "whatsapp", titulo: "Mensaje de recordatorio", descripcion: "Envío de lista de documentos faltantes", fecha: new Date(ahora.getTime() - 86400000), usuario: "Andrés Pérez", usuarioId: "u2" },
    { id: "act-3", leadId: "lead-1", tipo: "email", titulo: "Envío de propuesta", descripcion: "Propuesta de crédito Crédito Hipotecario", fecha: new Date(ahora.getTime() - 172800000), usuario: "Sistema", usuarioId: "system" },
    { id: "act-4", leadId: "lead-1", tipo: "documento", titulo: "Documento subido", descripcion: "Cédula de Identidad", fecha: new Date(ahora.getTime() - 259200000), usuario: "Cliente", usuarioId: "client" },
    { id: "act-5", leadId: "lead-1", tipo: "reunion", titulo: "Reunión presencial", descripcion: "Revisión condiciones bancarias en Banco de Chile", fecha: new Date(ahora.getTime() - 345600000), usuario: "Andrés Pérez", usuarioId: "u2" },
    { id: "act-6", leadId: "lead-1", tipo: "cambio_estado", titulo: "Cambio de etapa", descripcion: "Movido de Contacto Inicial a Documentos Pendientes", fecha: new Date(ahora.getTime() - 432000000), usuario: "Sistema", usuarioId: "system" },
    { id: "act-7", leadId: "lead-2", tipo: "llamada", titulo: "Llamada de presentación", descripcion: "Primer contacto con Carlos Rojas", fecha: new Date(ahora.getTime() - 7200000), usuario: "Carolina Muñoz", usuarioId: "u3" },
    { id: "act-8", leadId: "lead-2", tipo: "documento", titulo: "Documentos recibidos", descripcion: "Certificado AFP y Cédula de Identidad", fecha: new Date(ahora.getTime() - 172800000), usuario: "Cliente", usuarioId: "client" },
    { id: "act-9", leadId: "lead-3", tipo: "email", titulo: "Propuesta enviada", descripcion: "Comparativa de tasas Banco Estado vs Santander", fecha: new Date(ahora.getTime() - 259200000), usuario: "Diego Silva", usuarioId: "u4" },
    { id: "act-10", leadId: "lead-3", tipo: "tarea", titulo: "Tarea completada", descripcion: "Enviar propuesta comercial", fecha: new Date(ahora.getTime() - 345600000), usuario: "Diego Silva", usuarioId: "u4" },
  ];
}

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [actividades, setActividades] = useState<Actividad[]>([]);

  useEffect(() => {
    const guardadas = localStorage.getItem(STORAGE_KEY);
    if (guardadas) {
      try {
        const parsed = JSON.parse(guardadas);
        setActividades(parsed.map((a: any) => ({ ...a, fecha: new Date(a.fecha) })));
      } catch {
        setActividades(generarActividadesIniciales());
      }
    } else {
      setActividades(generarActividadesIniciales());
    }
  }, []);

  useEffect(() => {
    if (actividades.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actividades));
    }
  }, [actividades]);

  const agregarActividad = useCallback((nuevaActividad: Omit<Actividad, "id" | "fecha">) => {
    const actividad: Actividad = {
      ...nuevaActividad,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fecha: new Date(),
    };
    setActividades((prev) => [actividad, ...prev]);
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
