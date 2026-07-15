import { z } from "zod";

/**
 * Validaciones Zod para el módulo Documentos
 */

// ─── Schema para documento ───
export const DocumentoSchema = z.object({
  id: z.string(),
  leadId: z.string(),
  leadNombre: z.string().optional(),
  nombre: z.string().min(1, "Nombre del documento requerido"),
  tipo: z.string(),
  estado: z.enum(["PENDIENTE", "EN_REVISION", "APROBADO", "RECHAZADO"]),
  archivoUrl: z.string().optional(),
  creadoEn: z.date(),
});

// ─── Schema para subir documento ───
export const SubirDocumentoSchema = z.object({
  leadId: z.string().min(1, "Lead ID es requerido"),
  nombre: z.string().min(1, "Nombre del documento requerido"),
  tipo: z.string().optional().default("OTRO"),
});

// ─── Schema para cambiar estado ───
export const CambiarEstadoDocumentoSchema = z.object({
  documentoId: z.string().min(1, "Documento ID es requerido"),
  nuevoEstado: z.enum(["PENDIENTE", "EN_REVISION", "APROBADO", "RECHAZADO"]),
  comentario: z.string().optional(),
});

// ─── Types ───
export type SubirDocumentoInput = z.infer<typeof SubirDocumentoSchema>;
export type CambiarEstadoDocumentoInput = z.infer<typeof CambiarEstadoDocumentoSchema>;

// ─── Funciones de validación ───
export function validarSubirDocumento(data: unknown) {
  return SubirDocumentoSchema.safeParse(data);
}

export function validarCambiarEstadoDocumento(data: unknown) {
  return CambiarEstadoDocumentoSchema.safeParse(data);
}
