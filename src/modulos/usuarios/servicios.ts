/**
 * Servicios del módulo Usuarios
 */

const API_BASE = "/api/usuarios";

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

export async function obtenerUsuarios(filtros?: { busqueda?: string; rol?: string; estado?: string }) {
  const params = new URLSearchParams();
  if (filtros?.busqueda) params.set("busqueda", filtros.busqueda);
  if (filtros?.rol) params.set("rol", filtros.rol);
  if (filtros?.estado) params.set("estado", filtros.estado);
  const qs = params.toString();
  return apiRequest<{ success: boolean; data: any[] }>(`${API_BASE}${qs ? `?${qs}` : ""}`);
}

export async function obtenerUsuarioPorId(id: string) {
  return apiRequest<{ success: boolean; data: any }>(`${API_BASE}/${id}`);
}

export async function crearUsuario(data: any) {
  return apiRequest<{ success: boolean; data: any }>(API_BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editarUsuario(id: string, data: any) {
  return apiRequest<{ success: boolean; data: any }>(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarUsuario(id: string) {
  return apiRequest<{ success: boolean }>(`${API_BASE}/${id}`, { method: "DELETE" });
}
