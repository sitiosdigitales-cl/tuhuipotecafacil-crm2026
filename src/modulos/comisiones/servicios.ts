/**
 * Servicios del módulo Comisiones
 */

import type { ComisionInput } from "./validaciones";

export interface Comision extends ComisionInput {
  id: string;
  creadoEn?: string;
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
  if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
  return response.json();
}

export async function obtenerComisiones() {
  return apiRequest<RespuestaDatos<Comision[]>>("/api/comisiones");
}

export async function crearComision(data: ComisionInput) {
  return apiRequest<RespuestaDatos<Comision>>("/api/comisiones", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editarComision(id: string, data: Partial<ComisionInput>) {
  return apiRequest<RespuestaDatos<Comision>>(`/api/comisiones/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarComision(id: string) {
  return apiRequest<{ success: boolean }>(`/api/comisiones/${id}`, { method: "DELETE" });
}
