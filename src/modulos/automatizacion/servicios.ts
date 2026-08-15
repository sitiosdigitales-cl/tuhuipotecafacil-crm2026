/**
 * Servicios del módulo Automatización
 */

import type { PlantillaInput } from "./validaciones";
import type {
  FlujoAutomatizacion,
  FormularioAutomatizacion,
  PlantillaAutomatizacion,
  TriggerAutomatizacion,
} from "./tipos";

interface RespuestaLista<T> {
  success: boolean;
  data: T[];
  error?: string;
}

interface RespuestaCreacion<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface RespuestaMutacion {
  success: boolean;
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

export async function obtenerFlujos() {
  return apiRequest<RespuestaLista<FlujoAutomatizacion>>("/api/flujos");
}

export async function crearFlujo(data: FormularioAutomatizacion) {
  return apiRequest<RespuestaCreacion<FlujoAutomatizacion>>("/api/flujos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editarFlujo(id: string, data: Partial<FormularioAutomatizacion>) {
  return apiRequest<RespuestaMutacion>(`/api/flujos/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarFlujo(id: string) {
  return apiRequest<{ success: boolean }>(`/api/flujos/${id}`, { method: "DELETE" });
}

export async function obtenerTriggers() {
  return apiRequest<RespuestaLista<TriggerAutomatizacion>>("/api/triggers");
}

export async function crearTrigger(data: FormularioAutomatizacion) {
  return apiRequest<RespuestaCreacion<TriggerAutomatizacion>>("/api/triggers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editarTrigger(id: string, data: Partial<FormularioAutomatizacion>) {
  return apiRequest<RespuestaMutacion>(`/api/triggers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarTrigger(id: string) {
  return apiRequest<{ success: boolean }>(`/api/triggers/${id}`, { method: "DELETE" });
}

export async function obtenerPlantillas() {
  return apiRequest<RespuestaLista<PlantillaAutomatizacion>>("/api/plantillas");
}

export async function crearPlantilla(data: PlantillaInput) {
  return apiRequest<RespuestaCreacion<PlantillaAutomatizacion>>("/api/plantillas", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editarPlantilla(id: string, data: Partial<PlantillaInput>) {
  return apiRequest<RespuestaMutacion>(`/api/plantillas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarPlantilla(id: string) {
  return apiRequest<{ success: boolean }>(`/api/plantillas/${id}`, { method: "DELETE" });
}
