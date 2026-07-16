/**
 * Helper para crear notificaciones desde cualquier parte del sistema.
 * Usa el dispatcher centralizado que resuelve el dueño del lead
 * y envía por los canales habilitados.
 */

import { despacharNotificacionClient } from "./dispatcher-notificaciones";
import type { EventoNotificacion } from "./dispatcher-notificaciones";

export async function crearNotificacion(opts: {
  tipo: string;
  titulo: string;
  descripcion: string;
  usuarioId?: string;
  leadId?: string;
  accionUrl?: string;
}) {
  try {
    await despacharNotificacionClient({
      evento: (opts.tipo as EventoNotificacion) || "sistema",
      leadId: opts.leadId,
      titulo: opts.titulo,
      descripcion: opts.descripcion,
      usuarioIdDirecto: opts.usuarioId,
      accionUrl: opts.accionUrl,
    });
  } catch {
    // Silenciar errores
  }
}

// Notificaciones predefinidas para eventos comunes del CRM
export const Notificaciones = {
  nuevoLead: (leadNombre: string, leadId: string) =>
    despacharNotificacionClient({
      evento: "lead_nuevo",
      leadId,
      titulo: "Nuevo lead registrado",
      descripcion: leadNombre + " completo el formulario web",
      accionUrl: "/leads/" + leadId,
    }),

  leadAvanzoEtapa: (leadNombre: string, etapa: string, leadId: string) =>
    despacharNotificacionClient({
      evento: "lead_etapa",
      leadId,
      titulo: "Lead avanzo de etapa",
      descripcion: leadNombre + " paso a " + etapa,
      accionUrl: "/leads/" + leadId,
    }),

  tareaAsignada: (titulo: string, tareaId: string) =>
    despacharNotificacionClient({
      evento: "tarea_asignada",
      titulo: "Tarea asignada",
      descripcion: titulo,
      accionUrl: "/tareas/" + tareaId,
    }),

  tareaVencida: (titulo: string, tareaId: string) =>
    despacharNotificacionClient({
      evento: "tarea_vencida",
      titulo: "Tarea vencida",
      descripcion: titulo + " ha vencido",
      accionUrl: "/tareas/" + tareaId,
    }),

  documentoRecibido: (nombre: string, leadNombre: string, leadId: string) =>
    despacharNotificacionClient({
      evento: "documento_subido",
      leadId,
      titulo: "Documento recibido",
      descripcion: leadNombre + " subio: " + nombre,
      accionUrl: "/documentos",
    }),

  documentoAprobado: (nombre: string, leadId: string) =>
    despacharNotificacionClient({
      evento: "documento_estado",
      leadId,
      titulo: "Documento aprobado",
      descripcion: nombre + " fue aprobado",
      accionUrl: "/documentos",
    }),

  nuevoMensaje: (remitente: string, _conversacionId: string) =>
    despacharNotificacionClient({
      evento: "mensaje",
      titulo: "Nuevo mensaje",
      descripcion: remitente + " te envio un mensaje",
      accionUrl: "/conversaciones",
    }),

  recordatorioPendiente: (titulo: string) =>
    despacharNotificacionClient({
      evento: "sistema",
      titulo: "Recordatorio pendiente",
      descripcion: titulo,
      accionUrl: "/recordatorios",
    }),
};