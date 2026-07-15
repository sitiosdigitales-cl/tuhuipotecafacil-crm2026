/**
 * Servicios del módulo Comisiones
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

export async function obtenerComisiones() {
  return apiRequest<{ success: boolean; data: any[] }>("/api/comisiones");
}

export async function crearComision(data: any) {
  return apiRequest<{ success: boolean; data: any }>("/api/comisiones", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function editarComision(id: string, data: any) {
  return apiRequest<{ success: boolean; data: any }>(`/api/comisiones/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function eliminarComision(id: string) {
  return apiRequest<{ success: boolean }>(`/api/comisiones/${id}`, { method: "DELETE" });
}
