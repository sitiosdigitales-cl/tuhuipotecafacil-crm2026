import { z } from "zod";

export const ConfiguracionSchema = z.object({
  notificacionesEmail: z.boolean().default(true),
  notificacionesPush: z.boolean().default(true),
  recordatoriosAutomaticos: z.boolean().default(true),
  diasAnticipacionRecordatorio: z.number().min(1).max(30).default(3),
  timezone: z.string().default("America/Santiago"),
  idioma: z.enum(["es", "en"]).default("es"),
});

export type ConfiguracionInput = z.infer<typeof ConfiguracionSchema>;
