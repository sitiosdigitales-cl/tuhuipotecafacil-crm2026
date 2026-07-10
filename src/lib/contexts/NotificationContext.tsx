"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface Notificacion {
  id: string;
  tipo: "info" | "exito" | "advertencia" | "error" | "sistema";
  titulo: string;
  descripcion: string;
  icono?: string;
  accion?: {
    label: string;
    enlace: string;
  };
  leida: boolean;
  fecha: Date;
  usuarioId?: string;
}

interface NotificationContextType {
  notificaciones: Notificacion[];
  noLeidas: number;
  crearNotificacion: (notif: Omit<Notificacion, "id" | "fecha" | "leida">) => Promise<void>;
  marcarComoLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  eliminarNotificacion: (id: string) => void;
  limpiarNotificaciones: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notificaciones simuladas para crear cada 45 segundos
const NOTIFICACIONES_SIMULADAS = [
  { tipo: "info" as const, titulo: "Nuevo lead registrado", descripcion: "Un nuevo lead completó el formulario web", icono: "👤", accion: { label: "Ver lead", enlace: "/leads" } },
  { tipo: "exito" as const, titulo: "Documento recibido", descripcion: "El cliente subió un nuevo documento", icono: "📄", accion: { label: "Ver documento", enlace: "/documentos" } },
  { tipo: "advertencia" as const, titulo: "Recordatorio pendiente", descripcion: "Tienes un recordatorio para hoy", icono: "⏰", accion: { label: "Ver recordatorio", enlace: "/recordatorios" } },
  { tipo: "info" as const, titulo: "Mensaje de WhatsApp", descripcion: "Nuevo mensaje de un cliente", icono: "💬", accion: { label: "Ver mensaje", enlace: "/conversaciones" } },
  { tipo: "exito" as const, titulo: "Lead avanzó de etapa", descripcion: "Un lead pasó a Evaluación Bancaria", icono: "📈", accion: { label: "Ver pipeline", enlace: "/pipeline" } },
  { tipo: "advertencia" as const, titulo: "Lead estancado", descripcion: "Un lead lleva más de 14 días sin avance", icono: "⚠️", accion: { label: "Ver lead", enlace: "/leads" } },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  // Cargar notificaciones desde la API
  useEffect(() => {
    const cargarNotificaciones = async () => {
      try {
        const response = await fetch("/api/notificaciones?limit=50");
        const data = await response.json();
        if (data.success && data.data) {
          setNotificaciones(data.data.map((n: any) => ({
            ...n,
            fecha: new Date(n.fecha),
          })));
        }
      } catch {
        // Silenciar errores
      }
    };
    cargarNotificaciones();
  }, []);

  // Simular notificaciones cada 45 segundos (solo en desarrollo)
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * NOTIFICACIONES_SIMULADAS.length);
      const notifSimulada = NOTIFICACIONES_SIMULADAS[idx];

      const nuevaNotif: Notificacion = {
        ...notifSimulada,
        id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fecha: new Date(),
        leida: false,
      };

      setNotificaciones(prev => [nuevaNotif, ...prev]);
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  const crearNotificacion = useCallback(async (notif: Omit<Notificacion, "id" | "fecha" | "leida">) => {
    // Optimistic update
    const nuevaNotif: Notificacion = {
      ...notif,
      id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fecha: new Date(),
      leida: false,
    };
    setNotificaciones(prev => [nuevaNotif, ...prev]);

    try {
      await fetch("/api/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notif),
      });
    } catch {}
  }, []);

  const marcarComoLeida = useCallback(async (id: string) => {
    setNotificaciones(prev =>
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    );

    try {
      await fetch("/api/notificaciones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, leida: true }),
      });
    } catch {}
  }, []);

  const marcarTodasLeidas = useCallback(async () => {
    setNotificaciones(prev =>
      prev.map(n => ({ ...n, leida: true }))
    );

    try {
      const noLeidas = notificaciones.filter(n => !n.leida);
      await Promise.all(
        noLeidas.map(n =>
          fetch("/api/notificaciones", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: n.id, leida: true }),
          })
        )
      );
    } catch {}
  }, [notificaciones]);

  const eliminarNotificacion = useCallback((id: string) => {
    setNotificaciones(prev => prev.filter(n => n.id !== id));
  }, []);

  const limpiarNotificaciones = useCallback(() => {
    setNotificaciones([]);
  }, []);

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <NotificationContext.Provider
      value={{
        notificaciones,
        noLeidas,
        crearNotificacion,
        marcarComoLeida,
        marcarTodasLeidas,
        eliminarNotificacion,
        limpiarNotificaciones,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificaciones() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificaciones debe ser usado dentro de NotificationProvider");
  }
  return context;
}
