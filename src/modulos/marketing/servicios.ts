/**
 * Servicios del módulo Marketing
 */

import type { CampanaInput, LandingInput } from "./validaciones";

export interface CampanaMarketing extends CampanaInput {
  id: string;
  creadoEn?: string;
}

export interface LandingMarketing extends LandingInput {
  id: string;
  creadoEn?: string;
}

export interface RecursoBiblioteca {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo?: string;
  archivoUrl?: string;
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

export async function obtenerCampanas() {
  return apiRequest<RespuestaDatos<CampanaMarketing[]>>("/api/campanas");
}

export async function crearCampana(data: CampanaInput) {
  return apiRequest<RespuestaDatos<CampanaMarketing>>("/api/campanas", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editarCampana(id: string, data: Partial<CampanaInput>) {
  return apiRequest<RespuestaDatos<CampanaMarketing>>(`/api/campanas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarCampana(id: string) {
  return apiRequest<{ success: boolean }>(`/api/campanas/${id}`, { method: "DELETE" });
}

export async function obtenerLandings() {
  return apiRequest<RespuestaDatos<LandingMarketing[]>>("/api/landings");
}

export async function crearLanding(data: LandingInput) {
  return apiRequest<RespuestaDatos<LandingMarketing>>("/api/landings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function obtenerBiblioteca() {
  return apiRequest<RespuestaDatos<RecursoBiblioteca[]>>("/api/biblioteca");
}
