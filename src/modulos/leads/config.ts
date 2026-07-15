import { ETAPAS_CONFIG, ORIGEN_LABELS, ROLES_CONFIG } from "@/tipos";
import type { Rol, Etapa, Prioridad, SituacionLaboral } from "@/tipos";

/**
 * Configuración del módulo Leads
 * Reglas de negocio, permisos y labels centralizados
 */

// ─── Permisos por acción ───
export const LEADS_PERMISOS: Record<string, Rol[]> = {
  ver: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"],
  crear: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"],
  editar: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
  eliminar: ["SUPER_ADMIN", "ADMIN"],
  asignar: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
  cambiarEtapa: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"],
  verDocumentos: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO", "CLIENTE"],
};

// ─── Configuración de etapas del pipeline ───
export const LEADS_ETAPAS = [
  { id: "NUEVO_LEAD", label: "Nuevo Lead", color: "#3B82F6", icono: "UserPlus" },
  { id: "CONTACTO_INICIAL", label: "Contacto Inicial", color: "#6366F1", icono: "Phone" },
  { id: "CONTACTADO", label: "Contactado", color: "#8B5CF6", icono: "PhoneCall" },
  { id: "INTERESADO", label: "Interesado", color: "#A855F7", icono: "Heart" },
  { id: "CALIFICACION_COMERCIAL", label: "Calificación Comercial", color: "#EC4899", icono: "Calculator" },
  { id: "DOCS_PENDIENTES", label: "Docs. Pendientes", color: "#F97316", icono: "FileText" },
  { id: "DOCS_PARCIALES", label: "Docs. Parciales", color: "#F59E0B", icono: "FileCheck" },
  { id: "DOCS_COMPLETAS", label: "Docs. Completas", color: "#84CC16", icono: "FileCheck" },
  { id: "EVALUACION_BANCARIA", label: "Evaluación Bancaria", color: "#22C55E", icono: "Building" },
  { id: "PREAPROBADO", label: "Pre-Aprobado", color: "#10B981", icono: "CheckCircle" },
  { id: "APROBADO", label: "Aprobado", color: "#059669", icono: "CheckCircle" },
  { id: "FIRMA_DIGITAL", label: "Firma Digital", color: "#047857", icono: "PenTool" },
  { id: "NOTARIA", label: "Notaría", color: "#065F46", icono: "Building" },
  { id: "CREDITO_PAGADO", label: "Crédito Pagado", color: "#064E3B", icono: "DollarSign" },
  { id: "CLIENTE_FINALIZADO", label: "Cliente Finalizado", color: "#022C22", icono: "Award" },
] as const;

// ─── Configuración de prioridades ───
export const LEADS_PRIORIDADES = [
  { id: "BAJA", label: "Baja", color: "#64748B", bgColor: "bg-slate-100" },
  { id: "MEDIA", label: "Media", color: "#F59E0B", bgColor: "bg-amber-100" },
  { id: "ALTA", label: "Alta", color: "#F97316", bgColor: "bg-orange-100" },
  { id: "URGENTE", label: "Urgente", color: "#EF4444", bgColor: "bg-red-100" },
] as const;

// ─── Configuración de origen ───
export const LEADS_ORIGENES = [
  { id: "WEB", label: "Sitio Web", color: "#3B82F6", icono: "Globe" },
  { id: "SITIO WEB", label: "Sitio Web", color: "#3B82F6", icono: "Globe" },
  { id: "FACEBOOK", label: "Facebook", color: "#1877F2", icono: "Facebook" },
  { id: "INSTAGRAM", label: "Instagram", color: "#E4405F", icono: "Instagram" },
  { id: "GOOGLE", label: "Google Ads", color: "#4285F4", icono: "Search" },
  { id: "TIKTOK", label: "TikTok", color: "#000000", icono: "Music" },
  { id: "LINKEDIN", label: "LinkedIn", color: "#0A66C2", icono: "Linkedin" },
  { id: "WHATSAPP", label: "WhatsApp", color: "#25D366", icono: "MessageSquare" },
  { id: "REFERIDO", label: "Referido", color: "#8B5CF6", icono: "Users" },
  { id: "email_corporativo", label: "Email Corporativo", color: "#06B6D4", icono: "Mail" },
  { id: "elementor_wordpress", label: "WordPress/Elementor", color: "#21759B", icono: "Globe" },
  { id: "OTRO", label: "Otro", color: "#64748B", icono: "HelpCircle" },
] as const;

// ─── Configuración de situación laboral ───
export const LEADS_SITUACION_LABORAL = [
  { id: "DEPENDIENTE", label: "Trabajador Dependiente", icono: "Briefcase" },
  { id: "INDEPENDIENTE", label: "Independiente (Boleta de Honorarios)", icono: "FileText" },
  { id: "EMPRESA", label: "Empresa", icono: "Building" },
] as const;

// ─── Configuración de tipos de crédito ───
export const LEADS_TIPOS_CREDITO = [
  { id: "Crédito Hipotecario", label: "Crédito Hipotecario", icono: "Home" },
  { id: "Crédito de Consumo", label: "Crédito de Consumo", icono: "ShoppingCart" },
  { id: "Fines Generales", label: "Fines Generales", icono: "DollarSign" },
  { id: "Capital para Empresas", label: "Capital para Empresas", icono: "Building" },
] as const;

// ─── Configuración de bancos ───
export const LEADS_BANCOS = [
  "Banco de Chile",
  "Santander",
  "Banco Estado",
  "BCI",
  "Itaú",
  "Scotiabank",
  "Falabella",
  "Corpbanca",
  "Otros",
] as const;

// ─── Configuración de AFP ───
export const LEADS_AFP = [
  "Capital",
  "Cuprum",
  "Habitat",
  "Planvital",
  "Provida",
  "Rencoret",
  "Santa Maria",
  "Otros",
] as const;

// ─── Configuración de estados civiles ───
export const LEADS_ESTADOS_CIVILES = [
  "Soltero/a",
  "Casado/a",
  "Divorciado/a",
  "Viudo/a",
  "Unión Civil",
] as const;

// ─── Configuración de regímenes matrimoniales ───
export const LEADS_REGIMENES_MATRIMONIALES = [
  "Separación de Bienes",
  "Sociedad Conyugal",
  "No aplica",
] as const;

// ─── Configuración de fechas de pago ───
export const LEADS_FECHAS_PAGO = ["1", "5", "10", "15", "20", "25", "30"] as const;

// ─── Función para verificar permisos ───
export function tienePermiso(rol: Rol, accion: string): boolean {
  const permisos = LEADS_PERMISOS[accion];
  if (!permisos) return false;
  return permisos.includes(rol);
}

// ─── Función para obtener color de etapa ───
export function obtenerColorEtapa(etapa: Etapa): string {
  const config = LEADS_ETAPAS.find(e => e.id === etapa);
  return config?.color || "#64748B";
}

// ─── Función para obtener label de prioridad ───
export function obtenerLabelPrioridad(prioridad: Prioridad): string {
  const config = LEADS_PRIORIDADES.find(p => p.id === prioridad);
  return config?.label || prioridad;
}

// ─── Función para obtener label de origen ───
export function obtenerLabelOrigen(origen: string): string {
  const config = LEADS_ORIGENES.find(o => o.id === origen);
  return config?.label || origen;
}
