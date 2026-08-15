/**
 * Servicios del módulo Clientes
 * Funciones para CRUD de clientes, perfil, documentos
 */

import type { PerfilClienteInput } from "./validaciones";
import type { LeadApi } from "../leads/servicios";
import type { DocumentoCompleto } from "../documentos/tipos";

const API_BASE = "/api/leads";

export type DocumentoCliente = Omit<DocumentoCompleto, "estado"> & {
  estado: DocumentoCompleto["estado"] | "RECIBIDO";
};

interface RespuestaDatos<T> {
  success: boolean;
  data: T;
  error?: string;
}

// ─── Helpers ───
async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error.error || `Error HTTP ${response.status}`);
  }
  
  return response.json();
}

// ─── Obtener cliente por ID ───
export async function obtenerClientePorId(id: string) {
  return apiRequest<RespuestaDatos<LeadApi>>(`${API_BASE}/${id}`);
}

// ─── Actualizar perfil del cliente ───
export async function actualizarPerfilCliente(id: string, data: PerfilClienteInput) {
  return apiRequest<RespuestaDatos<LeadApi>>(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─── Obtener documentos del cliente ───
export async function obtenerDocumentosCliente(leadId: string) {
  return apiRequest<RespuestaDatos<DocumentoCliente[]>>(
    `/api/documentos?leadId=${leadId}`
  );
}

// ─── Subir documento ───
export async function subirDocumento(leadId: string, archivo: File, nombre: string) {
  const formData = new FormData();
  formData.append("archivo", archivo);
  formData.append("leadId", leadId);
  formData.append("nombre", nombre);
  
  const response = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  
  return response.json();
}

// ─── Solicitar documentos ───
export async function solicitarDocumentos(leadId: string, documentos: string[], metodo: string) {
  return apiRequest<{ success: boolean }>("/api/email/send", {
    method: "POST",
    body: JSON.stringify({
      tipo: "documentos",
      email: "", // Se obtiene del lead
      nombre: "",
      documentos,
      leadId,
      metodo,
    }),
  });
}

// ─── Buscar cliente por RUT ───
export async function buscarClientePorRut(rut: string) {
  return apiRequest<RespuestaDatos<LeadApi[]>>(
    `/api/leads?rut=${encodeURIComponent(rut)}`
  );
}
