/**
 * Servicios del módulo Tareas
 */

import type { CrearTareaInput, EditarTareaInput } from "./validaciones";
import type { EstadoTarea, Prioridad, TipoTarea } from "@/tipos";

const API_BASE = "/api/tareas";

export interface TareaApi {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: EstadoTarea;
  tipo: TipoTarea;
  prioridad: Prioridad;
  asignadoA?: string;
  nombreEjecutivo?: string;
  leadId?: string;
  leadNombre?: string;
  fechaVencimiento?: string | Date;
  creadoEn?: string | Date;
}

interface RespuestaDatos<T> {
  success: boolean;
  data: T;
  error?: string;
}

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
  return apiRequest<RespuestaDatos<TareaApi[]>>(`${API_BASE}${params}`);
}

export async function crearTarea(data: CrearTareaInput) {
  return apiRequest<RespuestaDatos<TareaApi>>(API_BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editarTarea(id: string, data: EditarTareaInput) {
  return apiRequest<RespuestaDatos<TareaApi>>(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarTarea(id: string) {
  return apiRequest<{ success: boolean }>(`${API_BASE}/${id}`, { method: "DELETE" });
}

export async function cambiarEstadoTarea(id: string, nuevoEstado: EstadoTarea) {
  return editarTarea(id, { estado: nuevoEstado });
}
