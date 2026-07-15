/**
 * Registry de Módulos - TuHipotecaFacil CRM
 * 
 * Cada módulo exporta su config, validaciones, servicios e hooks.
 * Los imports deben hacerse desde el módulo específico, no desde archivos sueltos.
 * 
 * Ejemplo de uso:
 *   import { LEADS_CONFIG, crearLead, LeadSchema } from "@/modulos/leads";
 *   import { CLIENTES_CONFIG, editarCliente } from "@/modulos/clientes";
 *   import { eventBus, EVENTOS } from "@/modulos/eventos";
 */

// Módulos Core
export * as Leads from "./leads";
export * as Clientes from "./clientes";
export * as Documentos from "./documentos";
export * as Tareas from "./tareas";
export * as Usuarios from "./usuarios";

// Módulos de Negocio
export * as Marketing from "./marketing";
export * as Automatizacion from "./automatizacion";
export * as Comisiones from "./comisiones";
export * as Reportes from "./reportes";
export * as Configuracion from "./configuracion";
export * as Comunicaciones from "./comunicaciones";

// Módulos de Infraestructura
export * as Eventos from "./eventos";
export * as Workflows from "./workflows";
export * as Actividad from "./actividad";
export * as Solicitudes from "./solicitudes";
export * as Permisos from "./permisos";
export * as MortgageAI from "./mortgage-ai";
