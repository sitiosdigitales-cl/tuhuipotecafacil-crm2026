/**
 * Módulo Marketing - TuHipotecaFacil CRM
 */

export {
  MARKETING_PERMISOS,
  CAMPANAS_ESTADOS,
  CAMPANAS_TIPOS,
  LANDINGS_ESTADOS,
  tienePermisoMarketing,
} from "./config";

export {
  CampanaSchema,
  LandingSchema,
} from "./validaciones";

export type { CampanaInput, LandingInput } from "./validaciones";

export {
  obtenerCampanas,
  crearCampana,
  editarCampana,
  eliminarCampana,
  obtenerLandings,
  crearLanding,
  obtenerBiblioteca,
} from "./servicios";

export { useCampanas, useLandings, useBiblioteca } from "./hooks";
