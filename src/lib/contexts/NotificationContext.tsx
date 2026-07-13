"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export interface Notificacion {
  id: string;
  tipo: "info" | "exito" | "advertencia" | "error" | "sistema";
  titulo: string;
  descripcion: string;
  icono?: string;
  accionUrl?: string;
  leida: boolean;
  fecha: Date;
  usuarioId?: string;
  leadId?: string;
}

interface NotificationContextType {
  notificaciones: Notificacion[];
  noLeidas: number;
  cargando: boolean;
  crearNotificacion: (notif: Omit<Notificacion, "id" | "fecha" | "leida">) => Promise<void>;
  marcarComoLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  eliminarNotificacion: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const ICONOS_POR_TIPO: Record<string, string> = {
  info: "ℹ️",
  exito: "✅",
  advertencia: "⚠️",
  error: "❌",
  sistema: "🔔",
  lead: "👤",
  tarea: "📋",
  documento: "📄",
  mensaje: "💬",
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);

  // Cargar notificaciones desde la API
  useEffect(() => {
    const cargarNotificaciones = async () => {
      try {
        const response = await fetch("/api/notificaciones?limit=50");
        const data = await response.json();
        if (data.success && data.data) {
          setNotificaciones(data.data.map((n: any) => ({
            id: n.id,
            tipo: n.tipo || "sistema",
            titulo: n.titulo,
            descripcion: n.descripcion || "",
            leida: n.leida || false,
            fecha: n.fecha ? new Date(n.fecha) : new Date(n.creadoen || Date.now()),
            icono: ICONOS_POR_TIPO[n.tipo] || "🔔",
            usuarioId: n.usuarioId || n.usuarioid,
            leadId: n.leadId || n.leadid,
            accionUrl: n.accionUrl || n.accionurl,
          })));
        }
      } catch {
        // Silenciar errores
      } finally {
        setCargando(false);
      }
    };
    cargarNotificaciones();

    // Refrescar cada 30 segundos como fallback del Realtime
    const interval = setInterval(cargarNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  // Suscripción en tiempo real a nuevas notificaciones
  useEffect(() => {
    const channel = supabase
      .channel("notificaciones-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificaciones",
        },
        (payload) => {
          const nuevaNotif: Notificacion = {
            id: payload.new.id,
            tipo: payload.new.tipo,
            titulo: payload.new.titulo,
            descripcion: payload.new.descripcion || "",
            leida: payload.new.leida || false,
            fecha: new Date(payload.new.creadoen),
            usuarioId: payload.new.usuarioid,
            leadId: payload.new.leadid,
            accionUrl: payload.new.accionurl,
            icono: ICONOS_POR_TIPO[payload.new.tipo] || "🔔",
          };

          setNotificaciones((prev) => {
            if (prev.some((n) => n.id === nuevaNotif.id)) return prev;
            return [nuevaNotif, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notificaciones",
        },
        (payload) => {
          setNotificaciones((prev) =>
            prev.map((n) =>
              n.id === payload.new.id
                ? { ...n, leida: payload.new.leida }
                : n
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const crearNotificacion = useCallback(async (notif: Omit<Notificacion, "id" | "fecha" | "leida">) => {
    try {
      await fetch("/api/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: notif.tipo,
          titulo: notif.titulo,
          descripcion: notif.descripcion,
          usuarioId: notif.usuarioId,
          leadId: notif.leadId,
          accionUrl: notif.accionUrl,
        }),
      });
    } catch {
      // Error silencioso
    }
  }, []);

  const marcarComoLeida = useCallback(async (id: string) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );

    try {
      await fetch("/api/notificaciones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, leida: true }),
      });
    } catch {
      // Error silencioso
    }
  }, []);

  const marcarTodasLeidas = useCallback(async () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));

    try {
      await fetch("/api/notificaciones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marcarTodas: true }),
      });
    } catch {
      // Error silencioso
    }
  }, []);

  const eliminarNotificacion = useCallback(async (id: string) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));

    try {
      await fetch(`/api/notificaciones?id=${id}`, { method: "DELETE" });
    } catch {
      // Error silencioso
    }
  }, []);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <NotificationContext.Provider
      value={{
        notificaciones,
        noLeidas,
        cargando,
        crearNotificacion,
        marcarComoLeida,
        marcarTodasLeidas,
        eliminarNotificacion,
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
