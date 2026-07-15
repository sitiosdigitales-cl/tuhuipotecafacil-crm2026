import { z } from "zod";

export const ComisionSchema = z.object({
  ejecutivoId: z.string().min(1, "Ejecutivo requerido"),
  ejecutivoNombre: z.string().min(1, "Nombre requerido"),
  mes: z.string().min(1, "Mes requerido"),
  anio: z.number().min(2020).max(2030),
  creditosAprobados: z.number().default(0),
  montoTotal: z.number().default(0),
  tasaComision: z.number().default(0),
  comisionTotal: z.number().default(0),
  pagado: z.boolean().default(false),
});

export type ComisionInput = z.infer<typeof ComisionSchema>;
