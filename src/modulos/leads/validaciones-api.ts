import { z } from "zod";

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function requiredText(maxLength: number) {
  return z
    .string()
    .trim()
    .min(1)
    .max(maxLength)
    .refine((value) => !CONTROL_CHARACTERS.test(value));
}

function optionalText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .refine((value) => !CONTROL_CHARACTERS.test(value))
    .optional()
    .nullable();
}

function optionalAmount(maximum = 100_000_000_000) {
  return z.number().finite().min(0).max(maximum).optional().nullable();
}

export const CreateLeadApiSchema = z
  .object({
    afp: optionalText(100),
    apellido: requiredText(150),
    asignadoA: optionalText(128),
    banco: optionalText(150),
    bancoAbonoRenta: optionalText(150),
    cargasLegales: optionalText(500),
    cargo: optionalText(150),
    codigoReferido: optionalText(220),
    comentarios: optionalText(2_000),
    comunaCiudad: optionalText(150),
    comunaCiudadLaboral: optionalText(150),
    complementarRenta: z.boolean().optional(),
    cuentaPie: z.boolean().optional(),
    diasEnEtapa: z.number().int().min(0).max(100_000).optional(),
    dicomDetalle: optionalText(2_000),
    direccionLaboral: optionalText(500),
    domicilioParticular: optionalText(500),
    edad: z.number().int().min(0).max(120).optional().nullable(),
    email: z.string().trim().toLowerCase().max(254).email().or(z.literal("")).optional().nullable(),
    emailLaboral: z.string().trim().toLowerCase().max(254).email().or(z.literal("")).optional().nullable(),
    enDicom: z.boolean().optional(),
    estadoCivil: optionalText(100),
    etapa: optionalText(100),
    estudios: optionalText(200),
    fechaIngreso: optionalText(50),
    fechaNacimiento: optionalText(50),
    fechaPago: optionalText(50),
    montoSolicitado: optionalAmount(),
    nombre: requiredText(150),
    nombreEjecutivo: optionalText(300),
    nombreEmpleador: optionalText(300),
    notas: optionalText(10_000),
    origen: optionalText(100),
    otrosIngresos: optionalText(500),
    patrimonioOtros: optionalText(2_000),
    patrimonioVehiculo: optionalText(500),
    patrimonioVivienda: optionalText(500),
    pieDisponible: optionalAmount(),
    prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "URGENTE"]).optional(),
    profesion: optionalText(200),
    referidoPor: optionalText(128),
    referidoPorNombre: optionalText(300),
    regimenMatrimonial: optionalText(150),
    rentaLiquida: optionalAmount(),
    rentaMensual: optionalText(150),
    rut: optionalText(20),
    rutEmpresa: optionalText(20),
    situacionLaboral: z.enum(["DEPENDIENTE", "INDEPENDIENTE", "EMPRESA"]).optional(),
    telefono: optionalText(30),
    telefonoLaboralFijo: optionalText(30),
    tipoCredito: optionalText(150),
    valorArriendo: optionalAmount(),
    valorPropiedad: optionalAmount(),
  })
  .strict();

export type CreateLeadApiInput = z.infer<typeof CreateLeadApiSchema>;
