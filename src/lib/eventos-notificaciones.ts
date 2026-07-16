/**
 * Conecta el EventBus con el sistema de notificaciones.
 * Se importa una vez en el layout/providers para activar la suscripción.
 */

import { eventBus, EVENTOS } from "@/modulos/eventos";
import { despacharNotificacion } from "./dispatcher-notificaciones";
import type { EventoNotificacion } from "./dispatcher-notificaciones";

// Mapeo de eventos del EventBus a eventos de notificación
const EVENTO_MAP: Record<string, EventoNotificacion> = {
  [EVENTOS.DOCUMENT_UPLOADED]: "documento_subido",
  [EVENTOS.DOCUMENT_APPROVED]: "documento_estado",
  [EVENTOS.DOCUMENT_REJECTED]: "documento_estado",
  [EVENTOS.LEAD_CREATED]: "lead_nuevo",
  [EVENTOS.LEAD_STAGE_CHANGED]: "lead_etapa",
  [EVENTOS.LEAD_ASSIGNED]: "lead_asignado",
  [EVENTOS.TASK_CREATED]: "tarea_asignada",
  [EVENTOS.TASK_OVERDUE]: "tarea_vencida",
  [EVENTOS.TASK_COMPLETED]: "tarea_completada",
  [EVENTOS.MESSAGE_RECEIVED]: "mensaje",
  [EVENTOS.NOTIFICATION_CREATED]: "sistema",
};

// Títulos predefinidos por evento
const TITULO_MAP: Record<string, string> = {
  documento_subido: "Documento recibido",
  documento_estado: "Estado de documento actualizado",
  documento_version: "Nueva versión de documento",
  lead_nuevo: "Nuevo lead registrado",
  lead_etapa: "Lead avanzó de etapa",
  lead_asignado: "Lead asignado",
  tarea_asignada: "Tarea asignada",
  tarea_vencida: "Tarea vencida",
  tarea_completada: "Tarea completada",
  mensaje: "Nuevo mensaje",
  sistema: "Notificación del sistema",
};

/**
 * Inicializar la suscripción del EventBus al dispatcher.
 * Llamar una vez al inicio de la aplicación (server-side).
 */
export function iniciarEventosNotificaciones(): void {
  // Suscribirse a cada evento del EventBus
  Object.entries(EVENTO_MAP).forEach(([eventoBus, eventoNotif]) => {
    eventBus.on(eventoBus, async (data: any) => {
      const titulo = TITULO_MAP[eventoNotif] || "Notificación";

      let descripcion = "";
      if (data?.leadNombre) {
        descripcion = data.leadNombre;
      } else if (data?.titulo) {
        descripcion = data.titulo;
      } else if (data?.descripcion) {
        descripcion = data.descripcion;
      }

      await despacharNotificacion({
        evento: eventoNotif,
        leadId: data?.leadId,
        titulo,
        descripcion,
        accionUrl: data?.accionUrl,
        datosEmail: data?.datosEmail,
      });
    });
  });
}
