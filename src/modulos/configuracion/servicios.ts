/**
 * Servicios del módulo Configuración
 */

export interface Integracion {
  id: string;
  nombre?: string;
  tipo?: string;
  estado?: string;
  configuracion?: Record<string, unknown>;
  creadoEn?: string;
}

interface RespuestaDatos<T> {
  success: boolean;
  data: T;
  error?: string;
}

export async function obtenerIntegraciones(): Promise<RespuestaDatos<Integracion[]>> {
  const response = await fetch("/api/integraciones", { credentials: "include" });
  return response.json();
}

export async function crearIntegracion(data: Omit<Integracion, "id">): Promise<RespuestaDatos<Integracion>> {
  const response = await fetch("/api/integraciones", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function editarIntegracion(id: string, data: Partial<Integracion>): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/integraciones/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function eliminarIntegracion(id: string) {
  const response = await fetch(`/api/integraciones/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return response.json();
}
