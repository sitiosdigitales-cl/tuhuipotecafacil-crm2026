/**
 * Módulo Comisiones - TuHipotecaFacil CRM
 */

export {
  COMISIONES_PERMISOS,
  COMISIONES_ESTADOS,
  tienePermisoComision,
} from "./config";

export { ComisionSchema } from "./validaciones";
export type { ComisionInput } from "./validaciones";

export {
  obtenerComisiones,
  crearComision,
  editarComision,
  eliminarComision,
} from "./servicios";

export { useComisiones } from "./hooks";
