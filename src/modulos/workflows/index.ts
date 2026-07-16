/**
 * MÃ³dulo Workflows
 * 
 * Motor de automatizaciÃ³n simple basado en reglas.
 * Permite crear flujos automÃ¡ticos que se ejecutan cuando ocurre un evento.
 * 
 * Ejemplo:
 *   LeadCreated â†’ Asignar ejecutivo â†’ Enviar email â†’ Crear tarea
 */

import { z } from "zod";
import { eventBus, EVENTOS } from "@/modulos/eventos";

// â”€â”€â”€ Tipos â”€â”€â”€
export type TipoTrigger = 
  | "lead:created"
  | "lead:updated"
  | "lead:stage:changed"
  | "document:uploaded"
  | "document:approved"
  | "task:completed"
  | "bank:response"
  | "solicitud:created"
  | "solicitud:stage:changed";

export type TipoAccion =
  | "asignar_ejecutivo"
  | "enviar_email"
  | "crear_tarea"
  | "mover_pipeline"
  | "enviar_whatsapp"
  | "crear_recordatorio"
  | "notificar_ejecutivo"
  | "actualizar_estado";

export interface Workflow {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: "BORRADOR" | "ACTIVO" | "PAUSADO";
  trigger: TipoTrigger;
  condiciones?: Condicion[];
  acciones: Accion[];
  ejecuciones: number;
  ultimoEjecucion?: string;
  creadoEn: string;
}

export interface Condicion {
  campo: string;
  operador: "igual" | "contiene" | "mayor" | "menor" | "existe";
  valor: string;
}

export interface Accion {
  tipo: TipoAccion;
  configuracion: Record<string, any>;
  orden: number;
}

// â”€â”€â”€ ConfiguraciÃ³n â”€â”€â”€
export const WORKFLOWS_CONFIG = {
  nombre: "Workflows",
  ruta: "/workflows",
  permisos: {
    ver: ["SUPER_ADMIN", "ADMIN"],
    crear: ["SUPER_ADMIN", "ADMIN"],
    editar: ["SUPER_ADMIN", "ADMIN"],
    eliminar: ["SUPER_ADMIN"],
    activar: ["SUPER_ADMIN", "ADMIN"],
  },
};

export const TRIGGERS_DISPONIBLES: { id: TipoTrigger; label: string; descripcion: string }[] = [
  { id: "lead:created", label: "Lead Creado", descripcion: "Cuando se crea un nuevo lead" },
  { id: "lead:updated", label: "Lead Actualizado", descripcion: "Cuando se modifica un lead" },
  { id: "lead:stage:changed", label: "Cambio de Etapa", descripcion: "Cuando un lead cambia de etapa" },
  { id: "document:uploaded", label: "Documento Subido", descripcion: "Cuando se sube un documento" },
  { id: "document:approved", label: "Documento Aprobado", descripcion: "Cuando se aprueba un documento" },
  { id: "task:completed", label: "Tarea Completada", descripcion: "Cuando se completa una tarea" },
  { id: "bank:response", label: "Respuesta del Banco", descripcion: "Cuando un banco responde" },
  { id: "solicitud:created", label: "Solicitud Creada", descripcion: "Cuando se crea una solicitud" },
  { id: "solicitud:stage:changed", label: "Solicitud Cambia Estado", descripcion: "Cuando una solicitud cambia de estado" },
];

export const ACCIONES_DISPONIBLES: { id: TipoAccion; label: string; descripcion: string; campos: string[] }[] = [
  { id: "asignar_ejecutivo", label: "Asignar Ejecutivo", descripcion: "Asigna un ejecutivo al lead", campos: ["ejecutivoId"] },
  { id: "enviar_email", label: "Enviar Email", descripcion: "EnvÃ­a un email al lead", campos: ["asunto", "plantilla"] },
  { id: "crear_tarea", label: "Crear Tarea", descripcion: "Crea una tarea automÃ¡tica", campos: ["titulo", "asignadoA", "diasPlazo"] },
  { id: "mover_pipeline", label: "Mover Pipeline", descripcion: "Mueve el lead a otra etapa", campos: ["etapaDestino"] },
  { id: "enviar_whatsapp", label: "Enviar WhatsApp", descripcion: "EnvÃ­a un mensaje por WhatsApp", campos: ["mensaje", "telefono"] },
  { id: "crear_recordatorio", label: "Crear Recordatorio", descripcion: "Crea un recordatorio", campos: ["titulo", "fecha", "hora"] },
  { id: "notificar_ejecutivo", label: "Notificar Ejecutivo", descripcion: "EnvÃ­a notificaciÃ³n al ejecutivo", campos: ["mensaje"] },
  { id: "actualizar_estado", label: "Actualizar Estado", descripcion: "Cambia el estado de una entidad", campos: ["entidad", "campo", "valor"] },
];

// â”€â”€â”€ ValidaciÃ³n â”€â”€â”€
export const WorkflowSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  descripcion: z.string().optional(),
  estado: z.enum(["BORRADOR", "ACTIVO", "PAUSADO"]).default("BORRADOR"),
  trigger: z.string().min(1, "Trigger requerido"),
  acciones: z.array(z.any()).default([]),
});

export type CrearWorkflowInput = z.infer<typeof WorkflowSchema>;

// â”€â”€â”€ Servicios â”€â”€â”€
export async function obtenerWorkflows() {
  return fetch("/api/flujos", { credentials: "include" }).then(r => r.json());
}

export async function crearWorkflow(data: CrearWorkflowInput) {
  return fetch("/api/flujos", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: data.nombre,
      descripcion: data.descripcion,
      estado: data.estado,
      trigger: data.trigger,
      pasos: data.acciones,
    }),
  }).then(r => r.json());
}

export async function editarWorkflow(id: string, data: Partial<Workflow>) {
  return fetch(`/api/flujos/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(r => r.json());
}

export async function eliminarWorkflow(id: string) {
  return fetch(`/api/flujos/${id}`, {
    method: "DELETE",
    credentials: "include",
  }).then(r => r.json());
}

// â”€â”€â”€ Motor de ejecuciÃ³n â”€â”€â”€
export async function ejecutarWorkflow(workflow: Workflow, contexto: Record<string, any>) {
  console.log(`[Workflow] Ejecutando: ${workflow.nombre}`);

  for (const accion of workflow.acciones.sort((a, b) => a.orden - b.orden)) {
    try {
      await ejecutarAccion(accion, contexto);
      console.log(`[Workflow] AcciÃ³n completada: ${accion.tipo}`);
    } catch (err) {
      console.error(`[Workflow] Error en acciÃ³n ${accion.tipo}:`, err);
    }
  }

  // Actualizar contador de ejecuciones
  await editarWorkflow(workflow.id, {
    ejecuciones: (workflow.ejecuciones || 0) + 1,
    ultimoEjecucion: new Date().toISOString(),
  } as any);
}

async function ejecutarAccion(accion: Accion, contexto: Record<string, any>) {
  switch (accion.tipo) {
    case "asignar_ejecutivo":
      if (contexto.leadId && accion.configuracion.ejecutivoId) {
        await fetch(`/api/leads/${contexto.leadId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombreEjecutivo: accion.configuracion.ejecutivoId }),
        });
      }
      break;

    case "crear_tarea":
      await fetch("/api/tareas", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: accion.configuracion.titulo || "Tarea automÃ¡tica",
          leadId: contexto.leadId,
          asignadoA: accion.configuracion.asignadoA,
          fechavencimiento: accion.configuracion.diasPlazo
            ? new Date(Date.now() + accion.configuracion.diasPlazo * 86400000).toISOString()
            : undefined,
        }),
      });
      break;

    case "enviar_email":
      await fetch("/api/email/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "custom",
          to: contexto.email,
          subject: accion.configuracion.asunto || "NotificaciÃ³n",
          html: accion.configuracion.mensaje || "Tienes una nueva notificaciÃ³n",
        }),
      });
      break;

    case "mover_pipeline":
      if (contexto.leadId && accion.configuracion.etapaDestino) {
        await fetch(`/api/leads/${contexto.leadId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ etapa: accion.configuracion.etapaDestino }),
        });
      }
      break;

    case "notificar_ejecutivo":
      // Emitir evento para notificaciÃ³n
      eventBus.emit(EVENTOS.NOTIFICATION_CREATED, {
        titulo: accion.configuracion.mensaje || "NotificaciÃ³n",
        leadId: contexto.leadId,
      });
      break;

    default:
      console.log(`[Workflow] AcciÃ³n no implementada: ${accion.tipo}`);
  }
}

// â”€â”€â”€ SuscripciÃ³n a eventos â”€â”€â”€
export function iniciarMotorWorkflows() {
  // Escuchar todos los eventos y ejecutar workflows correspondientes
  Object.values(EVENTOS).forEach((evento) => {
    eventBus.on(evento, async (contexto) => {
      try {
        const result = await obtenerWorkflows();
        const workflows = (result.data || []).filter(
          (w: any) => w.estado === "ACTIVO" && w.trigger === evento
        );
        
        for (const workflow of workflows) {
          await ejecutarWorkflow(workflow, contexto);
        }
      } catch (err) {
        console.error(`[Workflow] Error procesando evento ${evento}:`, err);
      }
    });
  });
}
