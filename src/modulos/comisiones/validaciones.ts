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

export const CrearComisionSchema = z
  .object({
    anio: z.number().int().min(2020).max(2100).nullable().optional(),
    comisionTotal: z.number().finite().min(0).optional(),
    creditosAprobados: z.number().int().min(0).max(100_000).optional(),
    ejecutivoId: z.string().trim().min(1).max(128).nullable().optional(),
    ejecutivoNombre: z.string().trim().min(1).max(160).nullable().optional(),
    mes: z.string().trim().min(1).max(20).nullable().optional(),
    montoTotal: z.number().finite().min(0).max(Number.MAX_SAFE_INTEGER),
    pagado: z.boolean().optional(),
    tasaComision: z.number().finite().min(0).max(100),
  })
  .strict();

export const ActualizarComisionSchema = z
  .object({
    ejecutivoId: z.string().trim().min(1).max(128).nullable().optional(),
    ejecutivoNombre: z.string().trim().min(1).max(160).nullable().optional(),
    mes: z.string().trim().min(1).max(20).nullable().optional(),
    anio: z.number().int().min(2020).max(2100).nullable().optional(),
    creditosAprobados: z.number().int().min(0).max(100_000).optional(),
    montoTotal: z.number().finite().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
    tasaComision: z.number().finite().min(0).max(100).optional(),
    pagado: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe indicar al menos un campo para actualizar",
  });

export type ComisionInput = z.infer<typeof ComisionSchema>;
export type CrearComisionInput = z.infer<typeof CrearComisionSchema>;
export type ActualizarComisionInput = z.infer<typeof ActualizarComisionSchema>;
