// Servicio de notificaciones push para el CRM
// En producción, esto se conectaría a un servicio como Firebase Cloud Messaging o OneSignal

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

// Simulación de notificaciones en tiempo real
let notificacionesListeners: ((notificaciones: Notificacion[]) => void)[] = [];
let notificacionesData: Notificacion[] = [];

// Notificaciones de ejemplo
const NOTIFICACIONES_INICIALES: Notificacion[] = [
  {
    id: "n1",
    tipo: "exito",
    titulo: "Crédito aprobado",
    descripcion: "El crédito de María González fue aprobado por Banco Estado",
    icono: "✅",
    leida: false,
    fecha: new Date(Date.now() - 5 * 60000),
    accion: { label: "Ver detalle", enlace: "/clientes" },
  },
  {
    id: "n2",
    tipo: "advertencia",
    titulo: "Tarea vencida",
    descripcion: "Actualizar avalúo de Diego Díaz venció hace 2 horas",
    icono: "⚠️",
    leida: false,
    fecha: new Date(Date.now() - 15 * 60000),
    accion: { label: "Ver tarea", enlace: "/tareas" },
  },
  {
    id: "n3",
    tipo: "info",
    titulo: "Nuevo lead registrado",
    descripcion: "Pedro Sánchez completó el formulario web",
    icono: "👤",
    leida: false,
    fecha: new Date(Date.now() - 30 * 60000),
    accion: { label: "Ver lead", enlace: "/leads" },
  },
  {
    id: "n4",
    tipo: "exito",
    titulo: "Documento aprobado",
    descripcion: "Cédula de Identidad de Juan Pérez verificada",
    icono: "📄",
    leida: true,
    fecha: new Date(Date.now() - 2 * 3600000),
    accion: { label: "Ver documento", enlace: "/documentos" },
  },
  {
    id: "n5",
    tipo: "sistema",
    titulo: "Backup completado",
    descripcion: "Respaldo diario del sistema realizado exitosamente",
    icono: "💾",
    leida: true,
    fecha: new Date(Date.now() - 6 * 3600000),
  },
];

// Inicializar notificaciones
notificacionesData = [...NOTIFICACIONES_INICIALES];

// Obtener notificaciones
export function obtenerNotificaciones(): Notificacion[] {
  return notificacionesData;
}

// Obtener número de no leídas
export function obtenerNoLeidas(): number {
  return notificacionesData.filter((n) => !n.leida).length;
}

// Marcar como leída
export function marcarComoLeida(id: string) {
  notificacionesData = notificacionesData.map((n) =>
    n.id === id ? { ...n, leida: true } : n
  );
  notificarListeners();
}

// Marcar todas como leídas
export function marcarTodasLeidas() {
  notificacionesData = notificacionesData.map((n) => ({ ...n, leida: true }));
  notificarListeners();
}

// Eliminar notificación
export function eliminarNotificacion(id: string) {
  notificacionesData = notificacionesData.filter((n) => n.id !== id);
  notificarListeners();
}

// Crear nueva notificación
export function crearNotificacion(notificacion: Omit<Notificacion, "id" | "fecha" | "leida">) {
  const nuevaNotificacion: Notificacion = {
    ...notificacion,
    id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    fecha: new Date(),
    leida: false,
  };
  notificacionesData = [nuevaNotificacion, ...notificacionesData];
  notificarListeners();

  // En producción, aquí se enviaría la notificación push
  // sendPushNotification(nuevaNotificacion);

  return nuevaNotificacion;
}

// Suscribirse a cambios
export function suscribirNotificaciones(callback: (notificaciones: Notificacion[]) => void) {
  notificacionesListeners.push(callback);
  return () => {
    notificacionesListeners = notificacionesListeners.filter((l) => l !== callback);
  };
}

// Notificar a los listeners
function notificarListeners() {
  notificacionesListeners.forEach((callback) => callback([...notificacionesData]));
}

// Simular notificaciones en tiempo real
let intervalId: NodeJS.Timeout | null = null;

export function iniciarSimulacion() {
  if (intervalId) return;

  intervalId = setInterval(() => {
    const notificacionesSimuladas = [
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
    ];

    const idx = Math.floor(Math.random() * notificacionesSimuladas.length);
    crearNotificacion(notificacionesSimuladas[idx]);
  }, 45000); // Cada 45 segundos
}

export function detenerSimulacion() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

// Solicitar permiso de notificaciones del navegador
export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("Este navegador no soporta notificaciones push");
    return false;
  }

  const permiso = await Notification.requestPermission();
  return permiso === "granted";
}

// Enviar notificación del navegador
export function enviarNotificacionNavegador(titulo: string, opciones?: NotificationOptions) {
  if (Notification.permission === "granted") {
    new Notification(titulo, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...opciones,
    });
  }
}
