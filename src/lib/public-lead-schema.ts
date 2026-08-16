import { z } from "zod";

import { validarRut } from "@/modulos/leads/validaciones";

const CONTROLES_NO_PERMITIDOS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function text(maxLength: number) {
  return z
    .string()
    .trim()
    .min(1)
    .max(maxLength)
    .refine((value) => !CONTROLES_NO_PERMITIDOS.test(value));
}

function optionalText(maxLength: number) {
  return z.preprocess(
    (value) =>
      value === undefined || value === null ||
      (typeof value === "string" && !value.trim())
        ? undefined
        : value,
    text(maxLength).optional()
  );
}

function optionalNumber(min: number, max: number, integer = false) {
  return z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      if (typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value.trim())) {
        return Number(value);
      }
      return value;
    },
    (integer ? z.number().int() : z.number()).finite().min(min).max(max).optional()
  );
}

const email = z.string().trim().toLowerCase().max(254).email();
const telefono = optionalText(25).refine((value) => {
  if (!value || !/^[+\d ()-]+$/.test(value)) return value === undefined;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 11;
});
const rut = optionalText(12).refine(
  (value) => value === undefined || validarRut(value)
);

export const PreEvaluationInputSchema = z.object({
  nombre: text(100),
  apellido: text(100),
  rut,
  edad: optionalNumber(18, 100, true),
  email,
  telefono,
  situacionLaboral: z
    .enum([
      "DEPENDIENTE",
      "INDEPENDIENTE",
      "EMPRESA",
      "Dependiente",
      "Independiente",
      "Empresa / Pyme",
    ])
    .optional()
    .transform((value) => {
      if (value === "Independiente") return "INDEPENDIENTE" as const;
      if (value === "Empresa / Pyme") return "EMPRESA" as const;
      return value?.toUpperCase() as "DEPENDIENTE" | "INDEPENDIENTE" | "EMPRESA" | undefined;
    }),
  dicom: z.enum(["Sí", "Si", "No"]).or(z.boolean()).optional(),
  enDicom: z.boolean().optional(),
  tipoCredito: optionalText(100),
  montoSolicitado: optionalNumber(1, 100_000_000_000),
  banco: optionalText(100),
  comentarios: optionalText(2_000),
  rentaMensual: optionalText(100),
  complementarRenta: z.enum(["Sí", "Si", "No"]).or(z.boolean()).optional(),
  cuentaPie: z.boolean().optional(),
});

export const ReferralRegistrationInputSchema = z.object({
  codigo: text(220),
  nombre: text(150),
  email,
  telefono,
});
