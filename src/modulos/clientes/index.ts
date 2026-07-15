/**
 * Módulo Clientes - TuHipotecaFacil CRM
 * 
 * Gestión de perfiles de cliente, documentos, portal.
 */

// Configuración
export {
  CLIENTES_PERMISOS,
  CLIENTES_SECCIONES_PERFIL,
  CLIENTES_DOCUMENTOS_DEPENDIENTE,
  CLIENTES_DOCUMENTOS_INDEPENDIENTE,
  CLIENTES_DOCUMENTOS_EMPRESA,
  obtenerDocumentosRequeridos,
  tienePermisoCliente,
} from "./config";

// Validaciones
export {
  PerfilClienteSchema,
  validarPerfilCliente,
} from "./validaciones";

export type { PerfilClienteInput } from "./validaciones";

// Servicios
export {
  obtenerClientePorId,
  actualizarPerfilCliente,
  obtenerDocumentosCliente,
  subirDocumento,
  solicitarDocumentos,
  buscarClientePorRut,
} from "./servicios";

// Hooks
export {
  useCliente,
  useDocumentosCliente,
} from "./hooks";
