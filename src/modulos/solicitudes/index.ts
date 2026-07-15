/**
 * Módulo Solicitudes (MortgageCase)
 * 
 * Encapsula la lógica de expediente hipotecario.
 * No reemplaza leads ni clientes, los envuelve en una entidad central.
 * 
 * Concepto:
 * - Un Lead se convierte en una Solicitud cuando el cliente está interesado
 * - Una Solicitud tiene: cliente, propiedad, bancos, documentos, evaluación
 * - Todo gira alrededor de la Solicitud, no del Lead
 */

// ─── Configuración ───
export const SOLICITUDES_CONFIG = {
  nombre: "Solicitudes",
  ruta: "/solicitudes",
  descripcion: "Gestión de expedientes hipotecarios",
  
  // Estados del expediente
  estados: [
    { id: "EN_REVISON", label: "En Revisión", color: "#F59E0B", icono: "Clock" },
    { id: "ENVIADO_BANCO", label: "Enviado al Banco", color: "#3B82F6", icono: "Send" },
    { id: "EN_EVALUACION", label: "En Evaluación", color: "#8B5CF6", icono: "Search" },
    { id: "OBSERVADO", label: "Observado", color: "#EF4444", icono: "AlertTriangle" },
    { id: "PREAPROBADO", label: "Pre-Aprobado", color: "#10B981", icono: "CheckCircle" },
    { id: "APROBADO", label: "Aprobado", color: "#059669", icono: "CheckCircle" },
    { id: "RECHAZADO", label: "Rechazado", color: "#DC2626", icono: "XCircle" },
    { id: "EN_FIRMA", label: "En Firma", color: "#F97316", icono: "PenTool" },
    { id: "EN_NOTARIA", label: "En Notaría", color: "#6366F1", icono: "Building" },
    { id: "DESEMBOLSADO", label: "Desembolsado", color: "#10B981", icono: "DollarSign" },
    { id: "COMPLETADO", label: "Completado", color: "#059669", icono: "Award" },
  ] as const,
  
  // Permisos
  permisos: {
    ver: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO", "CLIENTE"],
    crear: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"],
    editar: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"],
    cambiarEstado: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
    eliminar: ["SUPER_ADMIN", "ADMIN"],
    asignarBanco: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
    aprobar: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
  },
};

// ─── Entidad Solicitud ───
export interface Solicitud {
  id: string;
  leadId: string;
  clienteId: string;
  
  // Datos del crédito
  tipoCredito: string;
  montoSolicitado: number;
  plazoMeses: number;
  tasaInteres?: number;
  cuotaMensual?: number;
  
  // Propiedad
  valorPropiedad: number;
  pieDisponible: number;
  direccionPropiedad?: string;
  comunaPropiedad?: string;
  
  // Estado
  estado: string;
  bancoAsignado?: string;
  ejecutivoId: string;
  
  // Fechas
  fechaCreacion: string;
  fechaEnvioBanco?: string;
  fechaRespuesta?: string;
  fechaAprobacion?: string;
  fechaFirma?: string;
  fechaDesembolso?: string;
  
  // Métricas
  documentosCompletos: number;
  documentosRequeridos: number;
  diasEnProceso: number;
  
  // Metadata
  notas?: string;
  etiquetas?: string[];
  creadoEn: string;
  actualizadoEn: string;
}

// ─── Servicios ───
export async function crearSolicitud(data: Partial<Solicitud>) {
  return fetch("/api/solicitudes", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(r => r.json());
}

export async function obtenerSolicitud(id: string) {
  return fetch(`/api/solicitudes/${id}`, { credentials: "include" }).then(r => r.json());
}

export async function listarSolicitudes(filtros?: Record<string, any>) {
  const params = new URLSearchParams(filtros);
  return fetch(`/api/solicitudes?${params}`, { credentials: "include" }).then(r => r.json());
}

export async function actualizarSolicitud(id: string, data: Partial<Solicitud>) {
  return fetch(`/api/solicitudes/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(r => r.json());
}

export async function cambiarEstadoSolicitud(id: string, nuevoEstado: string) {
  return actualizarSolicitud(id, { estado: nuevoEstado } as any);
}

// ─── Validaciones ───
import { z } from "zod";

export const SolicitudSchema = z.object({
  leadId: z.string().min(1),
  tipoCredito: z.string().min(1),
  montoSolicitado: z.number().positive(),
  valorPropiedad: z.number().positive(),
  pieDisponible: z.number().min(0),
  plazoMeses: z.number().min(12).max(360),
});

export type CrearSolicitudInput = z.infer<typeof SolicitudSchema>;
