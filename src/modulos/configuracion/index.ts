/**
 * Módulo Configuración - TuHipotecaFacil CRM
 */

export {
  CONFIG_PERMISOS,
  CONFIG_SECCIONES,
  tienePermisoConfig,
} from "./config";

export { ConfiguracionSchema } from "./validaciones";
export type { ConfiguracionInput } from "./validaciones";

export {
  obtenerConfiguracion,
  actualizarConfiguracion,
  obtenerIntegraciones,
  crearIntegracion,
  editarIntegracion,
  eliminarIntegracion,
} from "./servicios";

export { useConfiguracion, useIntegraciones } from "./hooks";
