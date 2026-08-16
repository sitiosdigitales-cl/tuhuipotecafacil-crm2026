/**
 * Módulo Configuración - TuHipotecaFacil CRM
 */

export {
  CONFIG_PERMISOS,
  tienePermisoConfig,
} from "./config";

export {
  obtenerIntegraciones,
  crearIntegracion,
  editarIntegracion,
  eliminarIntegracion,
} from "./servicios";

export { useIntegraciones } from "./hooks";
