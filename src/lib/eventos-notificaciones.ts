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

interface DatosEventoNotificacion {
  leadNombre?: string;
  titulo?: string;
  descripcion?: string;
  leadId?: string;
  accionUrl?: string;
  datosEmail?: Record<string, string>;
}

function esRegistro(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function esRegistroDeTexto(value: unknown): value is Record<string, string> {
  return esRegistro(value) && Object.values(value).every((item) => typeof item === "string");
}

function normalizarDatosEvento(data: unknown): DatosEventoNotificacion {
  if (!esRegistro(data)) return {};

  return {
    leadNombre: typeof data.leadNombre === "string" ? data.leadNombre : undefined,
    titulo: typeof data.titulo === "string" ? data.titulo : undefined,
    descripcion: typeof data.descripcion === "string" ? data.descripcion : undefined,
    leadId: typeof data.leadId === "string" ? data.leadId : undefined,
    accionUrl: typeof data.accionUrl === "string" ? data.accionUrl : undefined,
    datosEmail: esRegistroDeTexto(data.datosEmail) ? data.datosEmail : undefined,
  };
}

/**
 * Inicializar la suscripción del EventBus al dispatcher.
 * Llamar una vez al inicio de la aplicación (server-side).
 */
export function iniciarEventosNotificaciones(): void {
  // Suscribirse a cada evento del EventBus
  Object.entries(EVENTO_MAP).forEach(([eventoBus, eventoNotif]) => {
    eventBus.on(eventoBus, async (data) => {
      const datos = normalizarDatosEvento(data);
      const titulo = TITULO_MAP[eventoNotif] || "Notificación";

      let descripcion = "";
      if (datos.leadNombre) {
        descripcion = datos.leadNombre;
      } else if (datos.titulo) {
        descripcion = datos.titulo;
      } else if (datos.descripcion) {
        descripcion = datos.descripcion;
      }

      await despacharNotificacion({
        evento: eventoNotif,
        leadId: datos.leadId,
        titulo,
        descripcion,
        accionUrl: datos.accionUrl,
        datosEmail: datos.datosEmail,
      });
    });
  });
}
