/**
 * Módulo Permisos
 * 
 * Control de acceso granular por acción, no solo por rol.
 * Permite definir qué puede hacer cada usuario en cada módulo.
 */

import { z } from "zod";
import type { Rol } from "@/tipos";

// ─── Tipos ───
export interface Permiso {
  id: string;
  modulo: string;
  accion: string;
  descripcion: string;
  roles: Rol[];
}

export interface PermisoUsuario {
  id: string;
  usuarioId: string;
  permisoId: string;
  concedido: boolean;
}

// ─── Configuración de permisos granulares ───
export const PERMISOS_GRANULARES: Permiso[] = [
  // Leads
  { id: "leads.ver", modulo: "leads", accion: "ver", descripcion: "Ver leads", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"] },
  { id: "leads.crear", modulo: "leads", accion: "crear", descripcion: "Crear leads", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"] },
  { id: "leads.editar", modulo: "leads", accion: "editar", descripcion: "Editar leads", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE"] },
  { id: "leads.eliminar", modulo: "leads", accion: "eliminar", descripcion: "Eliminar leads", roles: ["SUPER_ADMIN", "ADMIN"] },
  { id: "leads.asignar", modulo: "leads", accion: "asignar", descripcion: "Asignar ejecutivo", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE"] },
  { id: "leads.exportar", modulo: "leads", accion: "exportar", descripcion: "Exportar leads", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE"] },
  
  // Clientes
  { id: "clientes.ver", modulo: "clientes", accion: "ver", descripcion: "Ver clientes", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO", "CLIENTE"] },
  { id: "clientes.editar", modulo: "clientes", accion: "editar", descripcion: "Editar perfil cliente", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE", "CLIENTE"] },
  
  // Documentos
  { id: "documentos.ver", modulo: "documentos", accion: "ver", descripcion: "Ver documentos", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO", "CLIENTE"] },
  { id: "documentos.subir", modulo: "documentos", accion: "subir", descripcion: "Subir documentos", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO", "CLIENTE"] },
  { id: "documentos.aprobar", modulo: "documentos", accion: "aprobar", descripcion: "Aprobar documentos", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE"] },
  { id: "documentos.rechazar", modulo: "documentos", accion: "rechazar", descripcion: "Rechazar documentos", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE"] },
  { id: "documentos.eliminar", modulo: "documentos", accion: "eliminar", descripcion: "Eliminar documentos", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE"] },
  
  // Pipeline
  { id: "pipeline.cambiar_etapa", modulo: "pipeline", accion: "cambiar_etapa", descripcion: "Cambiar etapa de lead", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"] },
  { id: "pipeline.asignar_banco", modulo: "pipeline", accion: "asignar_banco", descripcion: "Asignar banco", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE"] },
  
  // Solicitudes
  { id: "solicitudes.ver", modulo: "solicitudes", accion: "ver", descripcion: "Ver solicitudes", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO", "CLIENTE"] },
  { id: "solicitudes.crear", modulo: "solicitudes", accion: "crear", descripcion: "Crear solicitud", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"] },
  { id: "solicitudes.aprobar", modulo: "solicitudes", accion: "aprobar", descripcion: "Aprobar solicitud", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE"] },
  
  // Reportes
  { id: "reportes.ver", modulo: "reportes", accion: "ver", descripcion: "Ver reportes", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE"] },
  { id: "reportes.exportar", modulo: "reportes", accion: "exportar", descripcion: "Exportar reportes", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE"] },
  
  // Comisiones
  { id: "comisiones.ver", modulo: "comisiones", accion: "ver", descripcion: "Ver comisiones", roles: ["SUPER_ADMIN", "ADMIN", "GERENTE"] },
  { id: "comisiones.editar", modulo: "comisiones", accion: "editar", descripcion: "Editar comisiones", roles: ["SUPER_ADMIN", "ADMIN"] },
  
  // Configuración
  { id: "config.ver", modulo: "configuracion", accion: "ver", descripcion: "Ver configuración", roles: ["SUPER_ADMIN", "ADMIN"] },
  { id: "config.editar", modulo: "configuracion", accion: "editar", descripcion: "Editar configuración", roles: ["SUPER_ADMIN"] },
];

// ─── Funciones de servicio ───
export async function obtenerPermisos() {
  return fetch("/api/permisos", { credentials: "include" }).then(r => r.json()).catch(() => ({ success: true, data: PERMISOS_GRANULARES }));
}

export async function verificarPermiso(rol: string, modulo: string, accion: string): Promise<boolean> {
  const permiso = PERMISOS_GRANULARES.find(p => p.modulo === modulo && p.accion === accion);
  if (!permiso) return false;
  return permiso.roles.includes(rol as Rol);
}

export function tienePermiso(rol: string, modulo: string, accion: string): boolean {
  const permiso = PERMISOS_GRANULARES.find(p => p.modulo === modulo && p.accion === accion);
  if (!permiso) return false;
  return permiso.roles.includes(rol as Rol);
}

export function obtenerPermisosPorModulo(modulo: string): Permiso[] {
  return PERMISOS_GRANULARES.filter(p => p.modulo === modulo);
}

export function obtenerModulosConPermisos(): string[] {
  return [...new Set(PERMISOS_GRANULARES.map(p => p.modulo))];
}
