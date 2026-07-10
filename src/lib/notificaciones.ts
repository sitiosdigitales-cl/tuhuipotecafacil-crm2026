/**
 * Helper para crear notificaciones desde cualquier parte del sistema.
 * Usa la API REST directamente (no necesita React context).
 */

export async function crearNotificacion(opts: {
  tipo: string;
  titulo: string;
  descripcion: string;
  usuarioId?: string;
  leadId?: string;
  accionUrl?: string;
}) {
  try {
    await fetch("/api/notificaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
  } catch {
    // Silenciar errores
  }
}

// Notificaciones predefinidas para eventos comunes del CRM
export const Notificaciones = {
  nuevoLead: (leadNombre: string, leadId: string) =>
    crearNotificacion({
      tipo: "lead",
      titulo: "Nuevo lead registrado",
      descripcion: `${leadNombre} completó el formulario web`,
      leadId,
      accionUrl: `/leads/${leadId}`,
    }),

  leadAvanzoEtapa: (leadNombre: string, etapa: string, leadId: string) =>
    crearNotificacion({
      tipo: "info",
      titulo: "Lead avanzó de etapa",
      descripcion: `${leadNombre} pasó a ${etapa}`,
      leadId,
      accionUrl: `/leads/${leadId}`,
    }),

  tareaAsignada: (titulo: string, tareaId: string) =>
    crearNotificacion({
      tipo: "tarea",
      titulo: "Tarea asignada",
      descripcion: titulo,
      accionUrl: `/tareas/${tareaId}`,
    }),

  tareaVencida: (titulo: string, tareaId: string) =>
    crearNotificacion({
      tipo: "advertencia",
      titulo: "Tarea vencida",
      descripcion: `"${titulo}" ha vencido`,
      accionUrl: `/tareas/${tareaId}`,
    }),

  documentoRecibido: (nombre: string, leadNombre: string, leadId: string) =>
    crearNotificacion({
      tipo: "documento",
      titulo: "Documento recibido",
      descripcion: `${leadNombre} subió: ${nombre}`,
      leadId,
      accionUrl: `/documentos`,
    }),

  documentoAprobado: (nombre: string, leadId: string) =>
    crearNotificacion({
      tipo: "exito",
      titulo: "Documento aprobado",
      descripcion: `${nombre} fue aprobado`,
      leadId,
      accionUrl: `/documentos`,
    }),

  nuevoMensaje: (remitente: string, conversacionId: string) =>
    crearNotificacion({
      tipo: "mensaje",
      titulo: "Nuevo mensaje",
      descripcion: `${remitente} te envió un mensaje`,
      accionUrl: `/conversaciones`,
    }),

  recordatorioPendiente: (titulo: string) =>
    crearNotificacion({
      tipo: "sistema",
      titulo: "Recordatorio pendiente",
      descripcion: titulo,
      accionUrl: `/recordatorios`,
    }),
};
