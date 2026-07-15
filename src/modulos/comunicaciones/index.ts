/**
 * Módulo Comunicaciones
 * 
 * Hub centralizado de comunicaciones: correo, WhatsApp, SMS, llamadas, chat interno.
 * Timeline unificado para ver todas las interacciones con un cliente.
 */

import { z } from "zod";

// ─── Tipos ───
export type CanalComunicacion = "correo" | "whatsapp" | "sms" | "llamada" | "chat_interno";
export type DireccionComunicacion = "entrante" | "saliente";

export interface Comunicacion {
  id: string;
  leadId: string;
  leadNombre?: string;
  canal: CanalComunicacion;
  direccion: DireccionComunicacion;
  asunto?: string;
  contenido: string;
  remitente: string;
  destinatario: string;
  estado: "enviado" | "entregado" | "leido" | "fallido";
  archivoUrl?: string;
  duracion?: number; // para llamadas, en segundos
  metadata?: Record<string, any>;
  creadoEn: string;
}

export interface Conversacion {
  id: string;
  leadId: string;
  leadNombre?: string;
  canal: CanalComunicacion;
  ultimoMensaje?: string;
  ultimoMensajeFecha?: string;
  mensajesNoLeidos: number;
  participantes: string[];
  creadoEn: string;
}

export interface Mensaje {
  id: string;
  conversacionId: string;
  remitenteId: string;
  remitenteNombre: string;
  contenido: string;
  tipo: "texto" | "archivo" | "imagen";
  archivoUrl?: string;
  leido: boolean;
  creadoEn: string;
}

// ─── Configuración ───
export const COMUNICACIONES_CONFIG = {
  nombre: "Comunicaciones",
  ruta: "/comunicaciones",
  permisos: {
    ver: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"],
    enviar: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"],
    eliminar: ["SUPER_ADMIN", "ADMIN"],
  },
};

export const CANALES_CONFIG: Record<CanalComunicacion, { label: string; icono: string; color: string }> = {
  correo: { label: "Correo", icono: "Mail", color: "#8B5CF6" },
  whatsapp: { label: "WhatsApp", icono: "MessageSquare", color: "#25D366" },
  sms: { label: "SMS", icono: "Smartphone", color: "#06B6D4" },
  llamada: { label: "Llamada", icono: "Phone", color: "#10B981" },
  chat_interno: { label: "Chat Interno", icono: "MessageCircle", color: "#3B82F6" },
};

// ─── Validación ───
export const ComunicacionSchema = z.object({
  leadId: z.string().min(1),
  canal: z.enum(["correo", "whatsapp", "sms", "llamada", "chat_interno"]),
  asunto: z.string().optional(),
  contenido: z.string().min(1, "Contenido requerido"),
  destinatario: z.string().min(1, "Destinatario requerido"),
});

export type EnviarComunicacionInput = z.infer<typeof ComunicacionSchema>;

// ─── Servicios ───
export async function obtenerComunicaciones(leadId?: string) {
  const params = leadId ? `?leadId=${leadId}` : "";
  return fetch(`/api/conversaciones${params}`, { credentials: "include" }).then(r => r.json());
}

export async function enviarComunicacion(data: EnviarComunicacionInput) {
  // Crear mensaje en la conversación
  const result = await fetch("/api/mensajes", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversacionId: data.leadId,
      contenido: data.contenido,
      tipo: "texto",
    }),
  }).then(r => r.json());

  // Registrar actividad
  await fetch("/api/actividades", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: data.canal,
      titulo: `Mensaje enviado por ${data.canal}`,
      descripcion: data.contenido.substring(0, 100),
      leadId: data.leadId,
    }),
  });

  return result;
}

export async function obtenerConversacion(conversacionId: string) {
  return fetch(`/api/conversaciones/${conversacionId}`, { credentials: "include" }).then(r => r.json());
}

export async function obtenerMensajes(conversacionId: string) {
  return fetch(`/api/mensajes?conversacionId=${conversacionId}`, { credentials: "include" }).then(r => r.json());
}

export async function enviarMensaje(conversacionId: string, contenido: string, remitenteId: string) {
  return fetch("/api/mensajes", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversacionId,
      contenido,
      remitenteId,
      tipo: "texto",
    }),
  }).then(r => r.json());
}

// ─── Timeline ───
export async function obtenerTimeline(leadId: string) {
  const [comunicaciones, actividades] = await Promise.all([
    fetch(`/api/conversaciones?leadId=${leadId}`, { credentials: "include" }).then(r => r.json()),
    fetch(`/api/actividades?leadId=${leadId}`, { credentials: "include" }).then(r => r.json()),
  ]);

  const eventos = [
    ...(comunicaciones.data || []).map((c: any) => ({
      tipo: "comunicacion",
      canal: c.canal || "correo",
      titulo: c.ultimoMensaje || "Conversación",
      fecha: c.ultimoMensajeFecha || c.creadoen,
      datos: c,
    })),
    ...(actividades.data || []).map((a: any) => ({
      tipo: "actividad",
      canal: a.tipo,
      titulo: a.titulo,
      fecha: a.fecha || a.creadoen,
      datos: a,
    })),
  ];

  eventos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  return eventos;
}
