/**
 * Servicios del módulo Marketing
 */

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
  return apiRequest<{ success: boolean; data: any[] }>("/api/campanas");
}

export async function crearCampana(data: any) {
  return apiRequest<{ success: boolean; data: any }>("/api/campanas", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editarCampana(id: string, data: any) {
  return apiRequest<{ success: boolean; data: any }>(`/api/campanas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarCampana(id: string) {
  return apiRequest<{ success: boolean }>(`/api/campanas/${id}`, { method: "DELETE" });
}

export async function obtenerLandings() {
  return apiRequest<{ success: boolean; data: any[] }>("/api/landings");
}

export async function crearLanding(data: any) {
  return apiRequest<{ success: boolean; data: any }>("/api/landings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function obtenerBiblioteca() {
  return apiRequest<{ success: boolean; data: any[] }>("/api/biblioteca");
}
