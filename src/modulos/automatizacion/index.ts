/**
 * Módulo Automatización - TuHipotecaFacil CRM
 */

export {
  AUTOMATIZACION_PERMISOS,
  FLUJOS_ESTADOS,
  TRIGGERS_TIPOS,
  tienePermisoAutomatizacion,
} from "./config";

export {
  FlujoSchema,
  TriggerSchema,
  PlantillaSchema,
} from "./validaciones";

export type { FlujoInput, TriggerInput, PlantillaInput } from "./validaciones";

export {
  obtenerFlujos,
  crearFlujo,
  editarFlujo,
  eliminarFlujo,
  obtenerTriggers,
  crearTrigger,
  editarTrigger,
  eliminarTrigger,
  obtenerPlantillas,
  crearPlantilla,
  editarPlantilla,
  eliminarPlantilla,
} from "./servicios";

export { useFlujos, useTriggers, usePlantillas } from "./hooks";
