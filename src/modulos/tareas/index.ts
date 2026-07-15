/**
 * Módulo Tareas - TuHipotecaFacil CRM
 */

export {
  TAREAS_PERMISOS,
  TAREAS_ESTADOS,
  TAREAS_TIPOS,
  TAREAS_PRIORIDADES,
  tienePermisoTarea,
} from "./config";

export {
  TareaSchema,
  CrearTareaSchema,
  EditarTareaSchema,
  validarCrearTarea,
} from "./validaciones";

export type { CrearTareaInput, EditarTareaInput } from "./validaciones";

export {
  obtenerTareas,
  crearTarea,
  editarTarea,
  eliminarTarea,
  cambiarEstadoTarea,
} from "./servicios";

export { useTareas, useTareaCount } from "./hooks";
