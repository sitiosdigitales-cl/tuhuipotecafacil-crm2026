import { z } from "zod";

export const TareaSchema = z.object({
  titulo: z.string().min(1, "Título requerido"),
  descripcion: z.string().optional(),
  estado: z.enum(["PENDIENTE", "EN_PROGRESO", "COMPLETADA", "VENCIDA"]).default("PENDIENTE"),
  tipo: z.enum(["SEGUIMIENTO", "DOCUMENTACION", "REUNION", "LLAMADA", "OTRO"]).default("SEGUIMIENTO"),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "URGENTE"]).default("MEDIA"),
  leadId: z.string().optional(),
  leadNombre: z.string().optional(),
  asignadoA: z.string().optional(),
  nombreejecutivo: z.string().optional(),
  fechavencimiento: z.string().optional(),
});

export const CrearTareaSchema = TareaSchema;
export const EditarTareaSchema = TareaSchema.partial();

export type CrearTareaInput = z.infer<typeof CrearTareaSchema>;
export type EditarTareaInput = z.infer<typeof EditarTareaSchema>;

export function validarCrearTarea(data: unknown) {
  return CrearTareaSchema.safeParse(data);
}
