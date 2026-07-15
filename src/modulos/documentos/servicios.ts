/**
 * Servicios del módulo Documentos (DMS Mejorado)
 */

import type { CambiarEstadoDocumentoInput } from "./validaciones";
import type { HistorialDocumento, EstadisticasDocumentos } from "./tipos";

const API_BASE = "/api/documentos";

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

// ─── CRUD Documentos ───

export async function obtenerDocumentos(leadId?: string) {
  const params = leadId ? `?leadId=${leadId}` : "";
  return apiRequest<{ success: boolean; data: any[] }>(`${API_BASE}${params}`);
}

export async function obtenerDocumentoPorId(id: string) {
  return apiRequest<{ success: boolean; data: any }>(`${API_BASE}/${id}`);
}

export async function crearDocumento(data: { leadId: string; nombre: string; tipo: string; banco?: string; fechaEmision?: string; fechaVencimiento?: string }) {
  return apiRequest<{ success: boolean; data: any }>(API_BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function actualizarDocumento(id: string, data: Record<string, any>) {
  return apiRequest<{ success: boolean; data: any }>(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarDocumento(id: string) {
  return apiRequest<{ success: boolean }>(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
}

// ─── Gestión de estado ───

export async function cambiarEstadoDocumento(data: CambiarEstadoDocumentoInput) {
  return actualizarDocumento(data.documentoId, {
    estado: data.nuevoEstado,
    observaciones: data.comentario,
  });
}

// ─── Subida de archivos ───

export async function subirArchivo(archivo: File, leadId: string, nombre: string) {
  const formData = new FormData();
  formData.append("archivo", archivo);
  formData.append("leadId", leadId);
  formData.append("nombre", nombre);
  
  const response = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error("Error al subir archivo");
  }
  
  return response.json();
}

// ─── Solicitud de documentos ───

export async function solicitarDocumentos(
  leadId: string,
  documentos: string[],
  metodo: "whatsapp" | "email" | "link"
) {
  return apiRequest<{ success: boolean }>("/api/email/send", {
    method: "POST",
    body: JSON.stringify({
      tipo: "documentos",
      leadId,
      documentos,
      metodo,
    }),
  });
}

// ─── Nuevos servicios DMS ───

/**
 * Obtener historial de cambios de un documento
 */
export async function obtenerHistorialDocumento(documentoId: string): Promise<{ success: boolean; data: HistorialDocumento[] }> {
  return apiRequest(`/api/documentos/${documentoId}/historial`);
}

/**
 * Subir nueva versión de un documento
 */
export async function subirNuevaVersion(documentoId: string, archivo: File, notas?: string) {
  const formData = new FormData();
  formData.append("archivo", archivo);
  formData.append("notas", notas || "");
  
  const response = await fetch(`/api/documentos/${documentoId}/version`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error("Error al subir nueva versión");
  }
  
  return response.json();
}

/**
 * Obtener estadísticas de documentos
 */
export async function obtenerEstadisticasDocumentos(leadId?: string): Promise<EstadisticasDocumentos> {
  const params = leadId ? `?leadId=${leadId}` : "";
  const result = await apiRequest<{ success: boolean; data: EstadisticasDocumentos }>(`/api/documentos/stats${params}`);
  return result.data;
}

/**
 * Aprobar documento con observaciones
 */
export async function aprobarDocumento(documentoId: string, aprobadoPor: string, observaciones?: string) {
  return actualizarDocumento(documentoId, {
    estado: "APROBADO",
    aprobadoPor,
    aprobadoEn: new Date().toISOString(),
    observaciones,
  });
}

/**
 * Rechazar documento con razón
 */
export async function rechazarDocumento(documentoId: string, razon: string) {
  return actualizarDocumento(documentoId, {
    estado: "RECHAZADO",
    observaciones: razon,
  });
}
