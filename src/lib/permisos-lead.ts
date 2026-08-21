import type { TokenPayload } from "./jwt";

/** Lo mínimo de un lead para decidir quién puede tocarlo. */
export interface LeadPropiedad {
  asignadoa?: string | null;
  email?: string | null;
}

/**
 * Quién puede leer o escribir sobre un lead concreto.
 *
 *   SUPER_ADMIN  todo
 *   ADMIN        todo. Ve y edita datos; lo que no puede es administrar roles
 *   EJECUTIVO    solo los leads que tiene asignados
 *   AGENTE       contraparte del banco. Solo los leads que le asignaron
 *   CLIENTE      solo el suyo, identificado por correo
 *
 * Vive en su propio módulo y no en api-auth.ts a propósito: esto es política
 * de negocio, no plomería de autenticación. Separarlo además evita que los
 * mocks de `@/lib/api-auth` en las pruebas lo reemplacen sin querer.
 */
export function puedeAccederLead(auth: TokenPayload, lead: LeadPropiedad): boolean {
  switch (auth.rol) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return true;
    case "EJECUTIVO":
    case "AGENTE":
      return !!lead.asignadoa && lead.asignadoa === auth.userId;
    case "CLIENTE":
      return !!lead.email && lead.email.toLowerCase() === auth.email.toLowerCase();
    default:
      // Rol desconocido: se niega. Un rol nuevo no debe heredar acceso por
      // omisión solo porque nadie actualizó este switch.
      return false;
  }
}
