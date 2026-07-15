import { z } from "zod";

export const FlujoSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  descripcion: z.string().optional(),
  estado: z.enum(["BORRADOR", "ACTIVO", "PAUSADO"]).default("BORRADOR"),
  trigger: z.string().optional(),
  pasos: z.array(z.any()).default([]),
});

export const TriggerSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  tipo: z.enum(["CAMBIO_ETAPA", "DOCUMENTO_SUBIDO", "DOCUMENTO_APROBADO", "TAREA_CREADA", "NUEVO_LEAD"]),
  condicion: z.any().optional(),
  accion: z.string().optional(),
  accionConfig: z.any().optional(),
  estado: z.enum(["ACTIVO", "INACTIVO"]).default("ACTIVO"),
});

export const PlantillaSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  tipo: z.enum(["EMAIL", "WHATSAPP", "SMS"]).default("EMAIL"),
  asunto: z.string().optional(),
  contenido: z.string().min(1, "Contenido requerido"),
  categoria: z.string().optional(),
  variables: z.array(z.string()).default([]),
});

export type FlujoInput = z.infer<typeof FlujoSchema>;
export type TriggerInput = z.infer<typeof TriggerSchema>;
export type PlantillaInput = z.infer<typeof PlantillaSchema>;
