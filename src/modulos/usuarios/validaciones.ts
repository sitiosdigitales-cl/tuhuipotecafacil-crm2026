import { z } from "zod";

import { obtenerErrorPoliticaPassword } from "./politica-password";

const RolSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "AGENTE",
  "EJECUTIVO",
  "CLIENTE",
]);
const EstadoUsuarioSchema = z.enum(["ACTIVO", "INACTIVO", "SUSPENDIDO"]);
const TextoNombreSchema = z.string().trim().min(1).max(100);
const TextoOpcionalSchema = z.string().trim().max(100).nullable().optional();
const EmailSchema = z
  .string()
  .trim()
  .max(254)
  .email("Email inválido")
  .transform((email) => email.toLowerCase());
const PasswordSchema = z.string().superRefine((password, context) => {
  const error = obtenerErrorPoliticaPassword(password);
  if (error) context.addIssue({ code: "custom", message: error });
});

export const UsuarioSchema = z.object({
  nombre: TextoNombreSchema,
  apellido: TextoNombreSchema,
  email: EmailSchema,
  telefono: TextoOpcionalSchema,
  rol: RolSchema,
  estado: EstadoUsuarioSchema.default("ACTIVO"),
  cargo: TextoOpcionalSchema,
}).strict();

export const CrearUsuarioSchema = UsuarioSchema.omit({ estado: true }).extend({
  password: PasswordSchema,
  rol: RolSchema.default("AGENTE"),
}).strict();

export const EditarUsuarioSchema = z
  .object({
    nombre: TextoNombreSchema.optional(),
    apellido: TextoNombreSchema.optional(),
    email: EmailSchema.optional(),
    telefono: TextoOpcionalSchema,
    rol: RolSchema.optional(),
    estado: EstadoUsuarioSchema.optional(),
    cargo: TextoOpcionalSchema,
    password: PasswordSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe indicar al menos un campo para actualizar",
  });

export type CrearUsuarioInput = z.infer<typeof CrearUsuarioSchema>;
export type EditarUsuarioInput = z.infer<typeof EditarUsuarioSchema>;

export function validarCrearUsuario(data: unknown) {
  return CrearUsuarioSchema.safeParse(data);
}
