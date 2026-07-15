/**
 * Módulo Leads - TuHipotecaFacil CRM
 * 
 * Gestión completa de leads del pipeline hipotecario.
 * 
 * Uso:
 *   import { LEADS_CONFIG, CrearLeadSchema, crearLead, useLeads } from "@/modulos/leads";
 */

// Configuración
export {
  LEADS_PERMISOS,
  LEADS_ETAPAS,
  LEADS_PRIORIDADES,
  LEADS_ORIGENES,
  LEADS_SITUACION_LABORAL,
  LEADS_TIPOS_CREDITO,
  LEADS_BANCOS,
  LEADS_AFP,
  LEADS_ESTADOS_CIVILES,
  LEADS_REGIMENES_MATRIMONIALES,
  LEADS_FECHAS_PAGO,
  tienePermiso,
  obtenerColorEtapa,
  obtenerLabelPrioridad,
  obtenerLabelOrigen,
} from "./config";

// Validaciones
export {
  LeadBaseSchema,
  CrearLeadSchema,
  EditarLeadSchema,
  CambiarEtapaSchema,
  AsignarEjecutivoSchema,
  FiltrosLeadSchema,
  validarCrearLead,
  validarEditarLead,
  validarCambiarEtapa,
  validarAsignarEjecutivo,
  validarRut,
  validarTelefono,
} from "./validaciones";

// Validaciones de Pipeline
export {
  REGLAS_POR_ETAPA,
  validarAvance,
} from "./validaciones-pipeline";

export type { ReglaValidacion, ResultadoValidacion } from "./validaciones-pipeline";

// Servicios
export {
  obtenerLeads,
  obtenerLeadPorId,
  crearLead,
  editarLead,
  eliminarLead,
  asignarEjecutivo,
  asignarEjecutivoPorNombre,
  moverEtapa,
  buscarEjecutivo,
  buscarEjecutivoPorId,
  crearLeadWebhook,
  obtenerEtapasPipeline,
} from "./servicios";

// Hooks
export {
  useLeads,
  useEtapaConfig,
  usePuedeAvanzarEtapa,
  useEstadisticasPipeline,
} from "./hooks";

// Types
export type {
  FiltrosLead,
  EstadisticasPipeline,
  EjecutivoAsignado,
  LeadConEjecutivo,
} from "./tipos";
