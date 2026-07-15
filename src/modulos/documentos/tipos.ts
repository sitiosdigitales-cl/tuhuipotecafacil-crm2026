/**
 * Types del módulo Documentos (DMS Mejorado)
 */

export interface MetadataDocumento {
  banco?: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  numeroPaginas?: number;
  tamañoBytes?: number;
  hash?: string;
}

export interface DocumentoCompleto {
  id: string;
  leadId: string;
  leadNombre?: string;
  nombre: string;
  tipo: string;
  estado: "PENDIENTE" | "EN_REVISION" | "APROBADO" | "RECHAZADO";
  archivoUrl?: string;
  version: number;
  versionAnterior?: string;
  creadoPor?: string;
  aprobadoPor?: string;
  aprobadoEn?: string;
  observaciones?: string;
  metadata: MetadataDocumento;
  creadoEn: string;
  actualizadoEn: string;
}

export interface HistorialDocumento {
  id: string;
  documentoId: string;
  accion: string;
  descripcion: string;
  usuarioId?: string;
  usuarioNombre?: string;
  fecha: string;
  datosAnteriores?: Record<string, any>;
  datosNuevos?: Record<string, any>;
}

export interface EstadisticasDocumentos {
  total: number;
  pendientes: number;
  enRevision: number;
  aprobados: number;
  rechazados: number;
  porcentajeCompletado: number;
  documentosPorTipo: Record<string, number>;
  documentosPorBanco: Record<string, number>;
  documentosVencidos: number;
}
