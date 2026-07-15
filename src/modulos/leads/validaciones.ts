import { z } from "zod";

/**
 * Validaciones Zod para el módulo Leads
 * Schemas para creación, edición y consulta de leads
 */

// ─── Schema base de Lead ───
export const LeadBaseSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido"),
  apellido: z.string().min(1, "Apellido es requerido"),
  rut: z.string().min(7, "RUT inválido").max(12, "RUT inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().optional().or(z.literal("")),
  situacionLaboral: z.enum(["DEPENDIENTE", "INDEPENDIENTE", "EMPRESA"]).default("DEPENDIENTE"),
  tipoCredito: z.string().optional().or(z.literal("")),
  montoSolicitado: z.number().positive().optional(),
  valorPropiedad: z.number().positive().optional(),
  pieDisponible: z.number().positive().optional(),
  banco: z.string().optional().or(z.literal("")),
  notas: z.string().optional().or(z.literal("")),
});

// ─── Schema para creación de lead ───
export const CrearLeadSchema = LeadBaseSchema.extend({
  origen: z.string().optional().default("WEB"),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "URGENTE"]).optional().default("MEDIA"),
  referidoPor: z.string().optional().or(z.literal("")),
  referidoPorNombre: z.string().optional().or(z.literal("")),
  codigoReferido: z.string().optional().or(z.literal("")),
});

// ─── Schema para edición de lead ───
export const EditarLeadSchema = LeadBaseSchema.extend({
  etapa: z.string().optional(),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "URGENTE"]).optional(),
  nombreEjecutivo: z.string().optional().or(z.literal("")),
  asignadoA: z.string().optional().or(z.literal("")),
  banco: z.string().optional().or(z.literal("")),
  enDicom: z.boolean().optional(),
  dicomDetalle: z.string().optional().or(z.literal("")),
  rentaMensual: z.string().optional().or(z.literal("")),
  complementarRenta: z.boolean().optional(),
  cuentaPie: z.boolean().optional(),
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

// ─── Schema para cambio de etapa ───
export const CambiarEtapaSchema = z.object({
  leadId: z.string().min(1, "Lead ID es requerido"),
  nuevaEtapa: z.string().min(1, "Nueva etapa es requerida"),
});

// ─── Schema para asignación de ejecutivo ───
export const AsignarEjecutivoSchema = z.object({
  leadId: z.string().min(1, "Lead ID es requerido"),
  ejecutivoId: z.string().min(1, "Ejecutivo ID es requerido"),
});

// ─── Schema para filtros de búsqueda ───
export const FiltrosLeadSchema = z.object({
  busqueda: z.string().optional(),
  etapa: z.string().optional(),
  prioridad: z.string().optional(),
  situacionLaboral: z.string().optional(),
  asignadoA: z.string().optional(),
  origen: z.string().optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
});

// ─── Types derivados ───
export type CrearLeadInput = z.infer<typeof CrearLeadSchema>;
export type EditarLeadInput = z.infer<typeof EditarLeadSchema>;
export type FiltrosLead = z.infer<typeof FiltrosLeadSchema>;

// ─── Funciones de validación ───
export function validarCrearLead(data: unknown) {
  return CrearLeadSchema.safeParse(data);
}

export function validarEditarLead(data: unknown) {
  return EditarLeadSchema.safeParse(data);
}

export function validarCambiarEtapa(data: unknown) {
  return CambiarEtapaSchema.safeParse(data);
}

export function validarAsignarEjecutivo(data: unknown) {
  return AsignarEjecutivoSchema.safeParse(data);
}

// ─── Validación de RUT chileno ───
export function validarRut(rut: string): boolean {
  const cleanRut = rut.replace(/\./g, "").replace("-", "").trim();
  if (cleanRut.length < 7) return false;
  
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDv = 11 - (sum % 11);
  const calculatedDv = expectedDv === 11 ? "0" : expectedDv === 10 ? "K" : String(expectedDv);
  
  return dv === calculatedDv;
}

// ─── Validación de teléfono chileno ───
export function validarTelefono(telefono: string): boolean {
  const clean = telefono.replace(/[\s\-\(\)]/g, "");
  // Formatos válidos: +56912345678, 912345678, 56912345678
  return /^\+?56?9?\d{8}$/.test(clean);
}
