import { z } from "zod";

export const ReporteSchema = z.object({
  tipo: z.enum(["PIPELINE", "CONVERSION", "EJECUTIVOS", "BANCOS", "COMISIONES", "DOCUMENTOS"]),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  filtros: z.any().optional(),
});

export type ReporteInput = z.infer<typeof ReporteSchema>;
