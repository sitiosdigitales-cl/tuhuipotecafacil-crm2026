import { z } from "zod";

export const CampanaSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  tipo: z.enum(["EMAIL", "REDES_SOCIALES", "WHATSAPP", "SMS"]),
  estado: z.enum(["PROGRAMADA", "ACTIVA", "PAUSADA", "FINALIZADA"]).default("PROGRAMADA"),
  descripcion: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  presupuesto: z.number().optional(),
  audiencia: z.number().optional(),
});

export const LandingSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  url: z.string().url().optional(),
  tipo: z.enum(["FORMULARIO", "LP", "SIMULADOR"]).default("FORMULARIO"),
  estado: z.enum(["BORRADOR", "PUBLICADA", "PAUSADA"]).default("BORRADOR"),
  descripcion: z.string().optional(),
});

export type CampanaInput = z.infer<typeof CampanaSchema>;
export type LandingInput = z.infer<typeof LandingSchema>;
