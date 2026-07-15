import { z } from "zod";

export const UsuarioSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  apellido: z.string().min(1, "Apellido requerido"),
  email: z.string().email("Email inválido"),
  telefono: z.string().optional(),
  rol: z.enum(["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO", "CLIENTE"]),
  estado: z.enum(["ACTIVO", "INACTIVO", "SUSPENDIDO"]).default("ACTIVO"),
  cargo: z.string().optional(),
});

export const CrearUsuarioSchema = UsuarioSchema.extend({
  password: z.string().min(6, "Contraseña mínima 6 caracteres"),
});

export const EditarUsuarioSchema = UsuarioSchema.partial();

export type CrearUsuarioInput = z.infer<typeof CrearUsuarioSchema>;
export type EditarUsuarioInput = z.infer<typeof EditarUsuarioSchema>;

export function validarCrearUsuario(data: unknown) {
  return CrearUsuarioSchema.safeParse(data);
}
