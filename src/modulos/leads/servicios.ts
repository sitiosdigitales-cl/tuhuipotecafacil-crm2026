/**
 * Servicios del módulo Leads
 * Funciones de servicio para CRUD de leads, asignación, movimiento de etapa
 */

import type { CrearLeadInput, EditarLeadInput, FiltrosLead } from "./validaciones";
import type { Etapa } from "@/tipos";

const API_BASE = "/api/leads";

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

// ─── CRUD Leads ───

export async function obtenerLeads(filtros?: FiltrosLead) {
  const params = new URLSearchParams();
  if (filtros) {
    Object.entries(filtros).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
  }
  const queryString = params.toString();
  return apiRequest<{ success: boolean; data: any[] }>(
    `${API_BASE}${queryString ? `?${queryString}` : ""}`
  );
}

export async function obtenerLeadPorId(id: string) {
  return apiRequest<{ success: boolean; data: any }>(`${API_BASE}/${id}`);
}

export async function crearLead(data: CrearLeadInput) {
  return apiRequest<{ success: boolean; data: any }>(API_BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editarLead(id: string, data: EditarLeadInput) {
  return apiRequest<{ success: boolean; data: any }>(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarLead(id: string) {
  return apiRequest<{ success: boolean }>(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
}

// ─── Asignación de ejecutivo ───

export async function asignarEjecutivo(leadId: string, ejecutivoId: string) {
  return editarLead(leadId, { asignadoA: ejecutivoId } as any);
}

export async function asignarEjecutivoPorNombre(leadId: string, nombreEjecutivo: string) {
  return editarLead(leadId, { nombreEjecutivo } as any);
}

// ─── Movimiento de etapa ───

export async function moverEtapa(leadId: string, nuevaEtapa: Etapa) {
  return editarLead(leadId, { etapa: nuevaEtapa } as any);
}

// ─── Búsqueda de ejecutivo ───

export async function buscarEjecutivo(nombre: string) {
  const params = new URLSearchParams({ busqueda: nombre });
  return apiRequest<{ success: boolean; data: any[] }>(
    `/api/usuarios?${params.toString()}`
  );
}

export async function buscarEjecutivoPorId(id: string) {
  return apiRequest<{ success: boolean; data: any[] }>(
    `/api/usuarios?id=${id}`
  );
}

// ─── Webhook (creación externa) ───

export async function crearLeadWebhook(data: Record<string, any>) {
  return apiRequest<{ success: boolean; message?: string; error?: string }>(
    "/api/webhook/leads",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

// ─── Pipeline ───

export async function obtenerEtapasPipeline() {
  return apiRequest<{ success: boolean; data: any[] }>("/api/pipeline/stages");
}
