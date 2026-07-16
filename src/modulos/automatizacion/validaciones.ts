import { z } from "zod";

// ─── Schema de Condición ───
export const CondicionSchema = z.object({
  campo: z.string().min(1, "Campo requerido"),
  operador: z.enum([
    "igual", "no_es", "contiene", "mayor", "menor",
    "mayor_igual", "menor_igual", "esta_vacio", "no_vacio"
  ]),
  valor: z.string().optional(),
});

export type CondicionInput = z.infer<typeof CondicionSchema>;

// ─── Schema de Acción ───
export const AccionTriggerSchema = z.object({
  tipo: z.enum([
    "enviar_email", "enviar_whatsapp", "enviar_sms", "crear_tarea",
    "asignar_ejecutivo", "mover_pipeline", "agregar_etiqueta",
    "notificar_equipo", "crear_recordatorio", "actualizar_estado"
  ]),
  configuracion: z.record(z.string(), z.any()).default({}),
  delay: z.number().min(0).default(0),
  orden: z.number().min(1).default(1),
});

export type AccionTriggerInput = z.infer<typeof AccionTriggerSchema>;

// ─── Schema de Trigger ───
export const TriggerSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  descripcion: z.string().max(500).optional(),
  trigger: z.string().min(1, "Evento trigger requerido"),
  categoria: z.enum(["lead", "documento", "tarea", "credito", "comunicacion"]),
  condiciones: z.array(CondicionSchema).default([]),
  logica_condiciones: z.enum(["AND", "OR"]).default("AND"),
  acciones: z.array(AccionTriggerSchema).min(1, "Al menos una acción requerida"),
  estado: z.enum(["ACTIVO", "PAUSADO", "BORRADOR"]).default("BORRADOR"),
});

export type TriggerInput = z.infer<typeof TriggerSchema>;

// ─── Schema de Flujo ───
export const FlujoSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  descripcion: z.string().optional(),
  estado: z.enum(["BORRADOR", "ACTIVO", "PAUSADO"]).default("BORRADOR"),
  trigger: z.string().optional(),
  pasos: z.array(z.any()).default([]),
});

export type FlujoInput = z.infer<typeof FlujoSchema>;

// ─── Schema de Plantilla ───
export const PlantillaSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  tipo: z.enum(["EMAIL", "WHATSAPP", "SMS"]).default("EMAIL"),
  asunto: z.string().optional(),
  contenido: z.string().min(1, "Contenido requerido"),
  categoria: z.string().optional(),
  variables: z.array(z.string()).default([]),
});

export type PlantillaInput = z.infer<typeof PlantillaSchema>;

// ─── Schema de Ejecución de Trigger ───
export const TriggerEjecucionSchema = z.object({
  triggerId: z.string().min(1),
  leadId: z.string().optional(),
  leadNombre: z.string().optional(),
  leadEmail: z.string().optional(),
  estado: z.enum(["EXITOSO", "PARCIAL", "FALLIDO"]),
  accionesEjecutadas: z.array(z.object({
    tipo: z.string(),
    estado: z.enum(["EXITOSO", "FALLIDO"]),
    detalle: z.string(),
    duracionMs: z.number(),
    error: z.string().optional(),
  })),
  contexto: z.record(z.string(), z.any()).default({}),
  duracionTotalMs: z.number().default(0),
  errorMensaje: z.string().optional(),
});

export type TriggerEjecucionInput = z.infer<typeof TriggerEjecucionSchema>;

// ─── Funciones de Validación ───
export function validarCrearTrigger(data: unknown) {
  return TriggerSchema.safeParse(data);
}

export function validarEditarTrigger(data: unknown) {
  return TriggerSchema.partial().safeParse(data);
}

export function validarCrearPlantilla(data: unknown) {
  return PlantillaSchema.safeParse(data);
}

export function validarCrearFlujo(data: unknown) {
  return FlujoSchema.safeParse(data);
}

export function validarEjecucionTrigger(data: unknown) {
  return TriggerEjecucionSchema.safeParse(data);
}
