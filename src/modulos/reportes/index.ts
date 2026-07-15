/**
 * Módulo Reportes - TuHipotecaFacil CRM
 */

export {
  REPORTES_PERMISOS,
  REPORTES_TIPOS,
  tienePermisoReporte,
} from "./config";

export { ReporteSchema } from "./validaciones";
export type { ReporteInput } from "./validaciones";

export {
  generarReportePipeline,
  generarReporteConversion,
  generarReporteEjecutivos,
} from "./servicios";

export { useReportePipeline, useReporteConversion, useReporteEjecutivos } from "./hooks";
