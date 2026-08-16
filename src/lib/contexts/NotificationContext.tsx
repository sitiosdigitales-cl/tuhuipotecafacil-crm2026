"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { useAuth } from "./AuthContext";

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

interface NotificacionApi {
  id: string;
  tipo?: string;
  titulo: string;
  descripcion?: string;
  leida?: boolean;
  fecha?: string | Date;
  creadoen?: string | Date;
  usuarioId?: string;
  usuarioid?: string;
  leadId?: string;
  leadid?: string;
  accionUrl?: string;
  accionurl?: string;
}

interface RespuestaNotificaciones {
  success: boolean;
  data?: NotificacionApi[];
}

const TIPOS_NOTIFICACION = new Set<Notificacion["tipo"]>([
  "info",
  "exito",
  "advertencia",
  "error",
  "sistema",
]);

function normalizarTipo(tipo?: string): Notificacion["tipo"] {
  return tipo && TIPOS_NOTIFICACION.has(tipo as Notificacion["tipo"])
    ? tipo as Notificacion["tipo"]
    : "sistema";
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
  documento_subido: "📄",
  documento_estado: "📄",
  documento_version: "📄",
  lead_nuevo: "👤",
  lead_etapa: "👤",
  lead_asignado: "👤",
  tarea_asignada: "📋",
  tarea_vencida: "📋",
  tarea_completada: "📋",
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);

  // Cargar notificaciones desde la API (filtradas por usuario actual)
  useEffect(() => {
    if (!usuario?.id) return;

    const cargarNotificaciones = async () => {
      try {
        const params = new URLSearchParams({ limit: "50" });
        const response = await fetch("/api/notificaciones?" + params.toString());
        const data = await response.json() as RespuestaNotificaciones;
        if (data.success && data.data) {
          setNotificaciones(data.data.map((n) => ({
            id: n.id,
            tipo: normalizarTipo(n.tipo),
            titulo: n.titulo,
            descripcion: n.descripcion || "",
            leida: n.leida || false,
            fecha: n.fecha ? new Date(n.fecha) : new Date(n.creadoen || Date.now()),
            icono: n.tipo ? ICONOS_POR_TIPO[n.tipo] || "🔔" : "🔔",
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

    // La API deriva el usuario desde la sesión. Evitamos una suscripción
    // directa que reciba filas antes de comprobar su destinatario.
    const interval = setInterval(cargarNotificaciones, 30000);
    return () => clearInterval(interval);
  }, [usuario?.id]);

  const crearNotificacion = useCallback(async (notif: Omit<Notificacion, "id" | "fecha" | "leida">) => {
    try {
      await fetch("/api/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: notif.tipo,
          titulo: notif.titulo,
          descripcion: notif.descripcion,
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
      await fetch("/api/notificaciones?id=" + id, { method: "DELETE" });
    } catch {
      // Error silencioso
    }
  }, []);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const valor = useMemo(
    () => ({
      notificaciones, noLeidas, cargando,
      crearNotificacion, marcarComoLeida, marcarTodasLeidas, eliminarNotificacion,
    }),
    [
      notificaciones, noLeidas, cargando,
      crearNotificacion, marcarComoLeida, marcarTodasLeidas, eliminarNotificacion,
    ]
  );

  return (
    <NotificationContext.Provider value={valor}>
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
