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
  crearNotificacion: (notif: Omit<Notificacion, "id" | "fecha" | "leida">) => Notificacion;
  marcarComoLeida: (id: string) => void;
  marcarTodasLeidas: () => void;
  eliminarNotificacion: (id: string) => void;
  limpiarNotificaciones: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = "crm_notificaciones";

// Notificaciones iniciales (fechas fijas para evitar hidratación)
const NOTIFICACIONES_INICIALES: Notificacion[] = [
  {
    id: "n1",
    tipo: "exito",
    titulo: "Crédito aprobado",
    descripcion: "El crédito de María González fue aprobado por Banco Estado",
    icono: "✅",
    leida: false,
    fecha: new Date(2026, 6, 4, 10, 55),
    accion: { label: "Ver detalle", enlace: "/clientes" },
  },
  {
    id: "n2",
    tipo: "advertencia",
    titulo: "Tarea vencida",
    descripcion: "Actualizar avalúo de Diego Díaz venció hace 2 horas",
    icono: "⚠️",
    leida: false,
    fecha: new Date(2026, 6, 4, 10, 45),
    accion: { label: "Ver tarea", enlace: "/tareas" },
  },
  {
    id: "n3",
    tipo: "info",
    titulo: "Nuevo lead registrado",
    descripcion: "Pedro Sánchez completó el formulario web",
    icono: "👤",
    leida: false,
    fecha: new Date(2026, 6, 4, 10, 30),
    accion: { label: "Ver lead", enlace: "/leads" },
  },
  {
    id: "n4",
    tipo: "exito",
    titulo: "Documento aprobado",
    descripcion: "Cédula de Identidad de Juan Pérez verificada",
    icono: "📄",
    leida: true,
    fecha: new Date(2026, 6, 4, 9, 0),
    accion: { label: "Ver documento", enlace: "/documentos" },
  },
  {
    id: "n5",
    tipo: "sistema",
    titulo: "Backup completado",
    descripcion: "Respaldo diario del sistema realizado exitosamente",
    icono: "💾",
    leida: true,
    fecha: new Date(2026, 6, 4, 5, 0),
  },
];

// Simulación de notificaciones
const NOTIFICACIONES_SIMULADAS = [
  {
    tipo: "info" as const,
    titulo: "Nuevo lead registrado",
    descripcion: "Un nuevo lead completó el formulario web",
    icono: "👤",
    accion: { label: "Ver lead", enlace: "/leads" },
  },
  {
    tipo: "exito" as const,
    titulo: "Documento recibido",
    descripcion: "El cliente subió un nuevo documento",
    icono: "📄",
    accion: { label: "Ver documento", enlace: "/documentos" },
  },
  {
    tipo: "advertencia" as const,
    titulo: "Recordatorio pendiente",
    descripcion: "Tienes un recordatorio para hoy",
    icono: "⏰",
    accion: { label: "Ver recordatorio", enlace: "/recordatorios" },
  },
  {
    tipo: "info" as const,
    titulo: "Mensaje de WhatsApp",
    descripcion: "Nuevo mensaje de un cliente",
    icono: "💬",
    accion: { label: "Ver mensaje", enlace: "/conversaciones" },
  },
  {
    tipo: "exito" as const,
    titulo: "Lead avanzó de etapa",
    descripcion: "Un lead pasó a Evaluación Bancaria",
    icono: "📈",
    accion: { label: "Ver pipeline", enlace: "/pipeline" },
  },
  {
    tipo: "advertencia" as const,
    titulo: "Lead estancado",
    descripcion: "Un lead lleva más de 14 días sin avance",
    icono: "⚠️",
    accion: { label: "Ver lead", enlace: "/leads" },
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar notificaciones de localStorage
  useEffect(() => {
    if (typeof window === "undefined") {
      setNotificaciones(NOTIFICACIONES_INICIALES); // eslint-disable-line react-hooks/set-state-in-effect -- Inicializacion SSR-safe
      setIsLoaded(true);
      return;
    }

    const guardadas = localStorage.getItem(STORAGE_KEY);
    if (guardadas) {
      try {
        const parsed = JSON.parse(guardadas);
        const notifConFechas = parsed.map((n: Record<string, unknown>) => ({
          ...n,
          fecha: new Date(n.fecha as string),
        }));
        setNotificaciones(notifConFechas);
      } catch {
        setNotificaciones(NOTIFICACIONES_INICIALES);
      }
    } else {
      setNotificaciones(NOTIFICACIONES_INICIALES);
    }
    setIsLoaded(true);
  }, []);

  // Guardar en localStorage cuando cambien
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notificaciones));
    }
  }, [notificaciones, isLoaded]);

  // Simular notificaciones cada 45 segundos
  useEffect(() => {
    if (!isLoaded) return;

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
  }, [isLoaded]);

  const crearNotificacion = useCallback((notif: Omit<Notificacion, "id" | "fecha" | "leida">) => {
    const nuevaNotif: Notificacion = {
      ...notif,
      id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fecha: new Date(),
      leida: false,
    };
    setNotificaciones(prev => [nuevaNotif, ...prev]);
    return nuevaNotif;
  }, []);

  const marcarComoLeida = useCallback((id: string) => {
    setNotificaciones(prev =>
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    );
  }, []);

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones(prev =>
      prev.map(n => ({ ...n, leida: true }))
    );
  }, []);

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
