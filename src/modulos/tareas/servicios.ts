/**
 * Servicios del módulo Tareas
 */

import type { CrearTareaInput, EditarTareaInput } from "./validaciones";

const API_BASE = "/api/tareas";

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

export async function obtenerTareas(leadId?: string) {
  const params = leadId ? `?leadId=${leadId}` : "";
  return apiRequest<{ success: boolean; data: any[] }>(`${API_BASE}${params}`);
}

export async function crearTarea(data: CrearTareaInput) {
  return apiRequest<{ success: boolean; data: any }>(API_BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editarTarea(id: string, data: EditarTareaInput) {
  return apiRequest<{ success: boolean; data: any }>(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarTarea(id: string) {
  return apiRequest<{ success: boolean }>(`${API_BASE}/${id}`, { method: "DELETE" });
}

export async function cambiarEstadoTarea(id: string, nuevoEstado: string) {
  return editarTarea(id, { estado: nuevoEstado } as any);
}
