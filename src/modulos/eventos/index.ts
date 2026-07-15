/**
 * Módulo EventBus
 * 
 * Sistema de eventos simple para desacoplar módulos.
 * Permite que los módulos se comuniquen sin dependencias directas.
 * 
 * Uso:
 *   import { eventBus } from "@/modulos/eventos";
 *   eventBus.emit("LeadCreated", { leadId: "123" });
 *   eventBus.on("LeadCreated", (data) => { ... });
 */

type EventCallback = (data: any) => void;

class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    
    // Retornar función para desuscribirse
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }

  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  off(event: string, callback?: EventCallback): void {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    }
  }
}

export const eventBus = new EventBus();

// ─── Eventos predefinidos ───
export const EVENTOS = {
  // CRM
  LEAD_CREATED: "lead:created",
  LEAD_UPDATED: "lead:updated",
  LEAD_DELETED: "lead:deleted",
  LEAD_ASSIGNED: "lead:assigned",
  LEAD_STAGE_CHANGED: "lead:stage:changed",
  
  // Clientes
  CLIENT_CREATED: "client:created",
  CLIENT_UPDATED: "client:updated",
  
  // Solicitudes
  SOLICITUD_CREATED: "solicitud:created",
  SOLICITUD_UPDATED: "solicitud:updated",
  SOLICITUD_STAGE_CHANGED: "solicitud:stage:changed",
  
  // Documentos
  DOCUMENT_UPLOADED: "document:uploaded",
  DOCUMENT_APPROVED: "document:approved",
  DOCUMENT_REJECTED: "document:rejected",
  
  // Tareas
  TASK_CREATED: "task:created",
  TASK_COMPLETED: "task:completed",
  TASK_OVERDUE: "task:overdue",
  
  // Comunicaciones
  MESSAGE_RECEIVED: "message:received",
  MESSAGE_SENT: "message:sent",
  
  // Bancos
  BANK_RESPONSE: "bank:response",
  BANK_APPROVED: "bank:approved",
  BANK_REJECTED: "bank:rejected",
  
  // Notificaciones
  NOTIFICATION_CREATED: "notification:created",
  
  // IA
  AI_ANALYSIS_COMPLETE: "ai:analysis:complete",
  AI_DOCUMENT_CLASSIFIED: "ai:document:classified",
} as const;
