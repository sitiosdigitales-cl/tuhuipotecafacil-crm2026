import { z } from "zod";

/**
 * Validaciones Zod para el módulo Clientes
 */

// ─── Schema para perfil del cliente ───
export const PerfilClienteSchema = z.object({
  // Datos personales
  nombre: z.string().min(1, "Nombre requerido"),
  apellido: z.string().min(1, "Apellido requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().optional().or(z.literal("")),
  fechaNacimiento: z.string().optional().or(z.literal("")),
  estadoCivil: z.string().optional().or(z.literal("")),
  regimenMatrimonial: z.string().optional().or(z.literal("")),
  estudios: z.string().optional().or(z.literal("")),
  profesion: z.string().optional().or(z.literal("")),
  cargasLegales: z.string().optional().or(z.literal("")),
  afp: z.string().optional().or(z.literal("")),
  situacionLaboral: z.enum(["DEPENDIENTE", "INDEPENDIENTE", "EMPRESA"]).optional(),
  
  // Domicilio
  domicilioParticular: z.string().optional().or(z.literal("")),
  comunaCiudad: z.string().optional().or(z.literal("")),
  valorArriendo: z.number().optional(),
  
  // Datos del empleador
  nombreEmpleador: z.string().optional().or(z.literal("")),
  rutEmpresa: z.string().optional().or(z.literal("")),
  fechaIngreso: z.string().optional().or(z.literal("")),
  cargo: z.string().optional().or(z.literal("")),
  rentaLiquida: z.number().optional(),
  bancoAbonoRenta: z.string().optional().or(z.literal("")),
  fechaPago: z.string().optional().or(z.literal("")),
  direccionLaboral: z.string().optional().or(z.literal("")),
  comunaCiudadLaboral: z.string().optional().or(z.literal("")),
  telefonoLaboralFijo: z.string().optional().or(z.literal("")),
  emailLaboral: z.string().optional().or(z.literal("")),
  otrosIngresos: z.string().optional().or(z.literal("")),
  
  // Patrimonio
  patrimonioVehiculo: z.string().optional().or(z.literal("")),
  patrimonioVivienda: z.string().optional().or(z.literal("")),
  patrimonioOtros: z.string().optional().or(z.literal("")),
});

// ─── Types ───
export type PerfilClienteInput = z.infer<typeof PerfilClienteSchema>;

// ─── Funciones de validación ───
export function validarPerfilCliente(data: unknown) {
  return PerfilClienteSchema.safeParse(data);
}
