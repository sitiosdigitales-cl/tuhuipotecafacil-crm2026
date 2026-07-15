/**
 * Servicios del módulo Configuración
 */

export async function obtenerConfiguracion() {
  const response = await fetch("/api/configuracion", { credentials: "include" });
  return response.json();
}

export async function actualizarConfiguracion(data: any) {
  const response = await fetch("/api/configuracion", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function obtenerIntegraciones() {
  const response = await fetch("/api/integraciones", { credentials: "include" });
  return response.json();
}

export async function crearIntegracion(data: any) {
  const response = await fetch("/api/integraciones", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function editarIntegracion(id: string, data: any) {
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
