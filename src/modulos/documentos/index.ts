/**
 * Módulo Documentos - TuHipotecaFacil CRM
 * 
 * Gestión de documentos: subida, revisión, estados, solicitud.
 * Versión mejorada con versionado, historial y metadata completa.
 */

// Configuración
export {
  DOCUMENTOS_PERMISOS,
  DOCUMENTOS_ESTADOS,
  DOCUMENTOS_POR_SITUACION,
  DOCUMENTOS_PATRIMONIO,
  obtenerDocumentosPorSituacion,
  obtenerDocumentosCompletos,
  tienePermisoDocumento,
} from "./config";

// Validaciones
export {
  DocumentoSchema,
  SubirDocumentoSchema,
  CambiarEstadoDocumentoSchema,
  validarSubirDocumento,
  validarCambiarEstadoDocumento,
} from "./validaciones";

export type { SubirDocumentoInput, CambiarEstadoDocumentoInput } from "./validaciones";

// Servicios
export {
  obtenerDocumentos,
  obtenerDocumentoPorId,
  crearDocumento,
  actualizarDocumento,
  eliminarDocumento,
  cambiarEstadoDocumento,
  subirArchivo,
  solicitarDocumentos,
  // Nuevos servicios DMS
  obtenerHistorialDocumento,
  subirNuevaVersion,
  obtenerEstadisticasDocumentos,
} from "./servicios";

// Hooks
export { useDocumentos, useEstadisticasDocumentos } from "./hooks";

// Types
export type {
  DocumentoCompleto,
  HistorialDocumento,
  EstadisticasDocumentos,
  MetadataDocumento,
} from "./tipos";
