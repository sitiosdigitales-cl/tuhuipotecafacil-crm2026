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

export type {
  AccionAutomatizacion,
  AccionEjecutada,
  ActualizarAccion,
  CondicionAutomatizacion,
  EjecucionAutomatizacion,
  EstadoAutomatizacion,
  EstadisticasAutomatizacion,
  FlujoAutomatizacion,
  FormularioAutomatizacion,
  LogicaCondiciones,
  PlantillaAutomatizacion,
  TriggerAutomatizacion,
} from "./tipos";

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
