/**
 * Servicios del módulo Automatización
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

export async function obtenerFlujos() {
  return apiRequest<{ success: boolean; data: any[] }>("/api/flujos");
}

export async function crearFlujo(data: any) {
  return apiRequest<{ success: boolean; data: any }>("/api/flujos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editarFlujo(id: string, data: any) {
  return apiRequest<{ success: boolean; data: any }>(`/api/flujos/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarFlujo(id: string) {
  return apiRequest<{ success: boolean }>(`/api/flujos/${id}`, { method: "DELETE" });
}

export async function obtenerTriggers() {
  return apiRequest<{ success: boolean; data: any[] }>("/api/triggers");
}

export async function crearTrigger(data: any) {
  return apiRequest<{ success: boolean; data: any }>("/api/triggers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editarTrigger(id: string, data: any) {
  return apiRequest<{ success: boolean; data: any }>(`/api/triggers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarTrigger(id: string) {
  return apiRequest<{ success: boolean }>(`/api/triggers/${id}`, { method: "DELETE" });
}

export async function obtenerPlantillas() {
  return apiRequest<{ success: boolean; data: any[] }>("/api/plantillas");
}

export async function crearPlantilla(data: any) {
  return apiRequest<{ success: boolean; data: any }>("/api/plantillas", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editarPlantilla(id: string, data: any) {
  return apiRequest<{ success: boolean; data: any }>(`/api/plantillas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarPlantilla(id: string) {
  return apiRequest<{ success: boolean }>(`/api/plantillas/${id}`, { method: "DELETE" });
}
