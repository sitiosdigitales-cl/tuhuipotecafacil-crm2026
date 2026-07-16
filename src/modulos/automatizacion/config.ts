/**
 * Configuración del módulo Automatización
 * Tipos de triggers, acciones, condiciones y categorías
 */

import type { Rol } from "@/tipos";

// ─── Permisos ───
export const AUTOMATIZACION_PERMISOS: Record<string, Rol[]> = {
  ver: ["SUPER_ADMIN", "ADMIN"],
  crear: ["SUPER_ADMIN", "ADMIN"],
  editar: ["SUPER_ADMIN", "ADMIN"],
  eliminar: ["SUPER_ADMIN"],
  activar: ["SUPER_ADMIN", "ADMIN"],
};

// ─── Estados de Flujos ───
export const FLUJOS_ESTADOS = [
  { id: "BORRADOR", label: "Borrador", color: "#64748B" },
  { id: "ACTIVO", label: "Activo", color: "#10B981" },
  { id: "PAUSADO", label: "Pausado", color: "#F59E0B" },
] as const;

// ─── Categorías de Triggers ───
export const TRIGGER_CATEGORIAS = [
  { id: "lead", label: "Lead", color: "#3B82F6", bgColor: "bg-blue-50", textColor: "text-blue-600" },
  { id: "documento", label: "Documento", color: "#8B5CF6", bgColor: "bg-violet-50", textColor: "text-violet-600" },
  { id: "tarea", label: "Tarea", color: "#10B981", bgColor: "bg-emerald-50", textColor: "text-emerald-600" },
  { id: "credito", label: "Crédito", color: "#F59E0B", bgColor: "bg-amber-50", textColor: "text-amber-600" },
  { id: "comunicacion", label: "Comunicación", color: "#22C55E", bgColor: "bg-green-50", textColor: "text-green-600" },
] as const;

// ─── Tipos de Trigger (Eventos) ───
export const TRIGGERS_TIPOS = [
  // Leads
  { id: "lead:created", label: "Lead Creado", descripcion: "Cuando se crea un nuevo lead", categoria: "lead", icono: "Users" },
  { id: "lead:updated", label: "Lead Actualizado", descripcion: "Cuando se modifica un lead", categoria: "lead", icono: "UserCheck" },
  { id: "lead:stage:changed", label: "Cambio de Etapa", descripcion: "Cuando un lead cambia de etapa en el pipeline", categoria: "lead", icono: "ArrowRight" },
  { id: "lead:inactive", label: "Lead Inactivo", descripcion: "Cuando un lead lleva días sin actividad", categoria: "lead", icono: "Clock" },
  // Documentos
  { id: "document:uploaded", label: "Documento Subido", descripcion: "Cuando se sube un documento", categoria: "documento", icono: "FileText" },
  { id: "document:approved", label: "Documento Aprobado", descripcion: "Cuando se aprueba un documento", categoria: "documento", icono: "CheckCircle" },
  { id: "document:rejected", label: "Documento Rechazado", descripcion: "Cuando se rechaza un documento", categoria: "documento", icono: "XCircle" },
  // Tareas
  { id: "task:created", label: "Tarea Creada", descripcion: "Cuando se crea una tarea", categoria: "tarea", icono: "ClipboardList" },
  { id: "task:completed", label: "Tarea Completada", descripcion: "Cuando se completa una tarea", categoria: "tarea", icono: "CheckCircle" },
  { id: "task:overdue", label: "Tarea Vencida", descripcion: "Cuando una tarea pasa su fecha límite", categoria: "tarea", icono: "AlertTriangle" },
  // Crédito
  { id: "bank:approved", label: "Crédito Aprobado", descripcion: "Cuando un banco aprueba el crédito", categoria: "credito", icono: "DollarSign" },
  { id: "bank:rejected", label: "Crédito Rechazado", descripcion: "Cuando un banco rechaza el crédito", categoria: "credito", icono: "XCircle" },
  { id: "bank:response", label: "Respuesta del Banco", descripcion: "Cuando un banco responde una solicitud", categoria: "credito", icono: "Building" },
  // Comunicación
  { id: "message:received", label: "Email Recibido", descripcion: "Cuando se recibe un email del lead", categoria: "comunicacion", icono: "Mail" },
  { id: "communication:call", label: "Llamada Registrada", descripcion: "Cuando se registra una llamada", categoria: "comunicacion", icono: "Phone" },
  { id: "communication:whatsapp", label: "WhatsApp Recibido", descripcion: "Cuando se recibe un mensaje de WhatsApp", categoria: "comunicacion", icono: "MessageSquare" },
] as const;

// ─── Tipos de Acción ───
export const ACCIONES_TIPOS = [
  { id: "enviar_email", label: "Enviar Email", descripcion: "Envía un email al lead o ejecutivo", icono: "Mail", color: "#3B82F6", campos: ["asunto", "plantilla", "destinatario"] },
  { id: "enviar_whatsapp", label: "Enviar WhatsApp", descripcion: "Envía un mensaje por WhatsApp", icono: "MessageSquare", color: "#22C55E", campos: ["mensaje", "telefono", "plantilla"] },
  { id: "enviar_sms", label: "Enviar SMS", descripcion: "Envía un SMS al lead", icono: "Phone", color: "#8B5CF6", campos: ["mensaje", "telefono"] },
  { id: "crear_tarea", label: "Crear Tarea", descripcion: "Crea una tarea automática para seguimiento", icono: "ClipboardList", color: "#14B8A6", campos: ["titulo", "asignadoA", "diasPlazo", "tipo"] },
  { id: "asignar_ejecutivo", label: "Asignar Ejecutivo", descripcion: "Asigna un ejecutivo al lead automáticamente", icono: "UserPlus", color: "#8B5CF6", campos: ["ejecutivoId", "estrategia"] },
  { id: "mover_pipeline", label: "Cambiar Etapa", descripcion: "Mueve el lead a otra etapa del pipeline", icono: "ArrowRight", color: "#F59E0B", campos: ["etapaDestino"] },
  { id: "agregar_etiqueta", label: "Agregar Etiqueta", descripcion: "Agrega una etiqueta al lead", icono: "Tag", color: "#EC4899", campos: ["etiqueta"] },
  { id: "notificar_equipo", label: "Notificar Equipo", descripcion: "Envía notificación al equipo o ejecutivo", icono: "Bell", color: "#F59E0B", campos: ["mensaje", "destinatarios"] },
  { id: "crear_recordatorio", label: "Crear Recordatorio", descripcion: "Crea un recordatorio programado", icono: "Calendar", color: "#8B5CF6", campos: ["titulo", "fecha", "hora"] },
  { id: "actualizar_estado", label: "Actualizar Estado", descripcion: "Cambia el estado de una entidad", icono: "RefreshCw", color: "#6366F1", campos: ["entidad", "campo", "valor"] },
] as const;

// ─── Operadores de Condición ───
export const CONDICION_OPERADORES = [
  { id: "igual", label: "Igual a", descripcion: "El valor es exactamente igual" },
  { id: "no_es", label: "No es", descripcion: "El valor no es igual" },
  { id: "contiene", label: "Contiene", descripcion: "El valor contiene el texto" },
  { id: "mayor", label: "Mayor que", descripcion: "El valor es mayor" },
  { id: "menor", label: "Menor que", descripcion: "El valor es menor" },
  { id: "mayor_igual", label: "Mayor o igual", descripcion: "El valor es mayor o igual" },
  { id: "menor_igual", label: "Menor o igual", descripcion: "El valor es menor o igual" },
  { id: "esta_vacio", label: "Está vacío", descripcion: "El campo no tiene valor" },
  { id: "no_vacio", label: "No está vacío", descripcion: "El campo tiene valor" },
] as const;

// ─── Campos Disponibles por Categoría de Trigger ───
export const CAMPOS_POR_CATEGORIA: Record<string, { id: string; label: string; tipo: "texto" | "numero" | "fecha" | "select"; opciones?: string[] }[]> = {
  lead: [
    { id: "origen", label: "Origen", tipo: "select", opciones: ["WEB", "FACEBOOK", "INSTAGRAM", "TELEFONO", "REFERIDO", "OTRO"] },
    { id: "etapa", label: "Etapa", tipo: "select", opciones: ["NUEVO_LEAD", "CONTACTO_INICIAL", "INTERESADO", "CALIFICACION_COMERCIAL", "DOCS_PENDIENTES", "DOCS_COMPLETAS", "EVALUACION_BANCARIA", "APROBADO", "RECHAZADO", "CLIENTE_FINALIZADO"] },
    { id: "prioridad", label: "Prioridad", tipo: "select", opciones: ["BAJA", "MEDIA", "ALTA", "URGENTE"] },
    { id: "dias_sin_contacto", label: "Días sin contacto", tipo: "numero" },
    { id: "dias_en_etapa", label: "Días en etapa", tipo: "numero" },
    { id: "monto_solicitado", label: "Monto solicitado", tipo: "numero" },
    { id: "email", label: "Email", tipo: "texto" },
    { id: "telefono", label: "Teléfono", tipo: "texto" },
  ],
  documento: [
    { id: "tipo_documento", label: "Tipo de documento", tipo: "select", opciones: ["CEDULA_IDENTIDAD", "COMPROBANTE_INGRESOS", "CERTIFICADO_LABORAL", "COMPROBANTE_DOMICILIO", "FACTURAS", "OTRO"] },
    { id: "estado", label: "Estado", tipo: "select", opciones: ["PENDIENTE", "APROBADO", "RECHAZADO"] },
  ],
  tarea: [
    { id: "tipo_tarea", label: "Tipo de tarea", tipo: "select", opciones: ["SEGUIMIENTO", "DOCUMENTACION", "REUNION", "LLAMADA", "OTRO"] },
    { id: "estado", label: "Estado", tipo: "select", opciones: ["PENDIENTE", "EN_PROGRESO", "COMPLETADA", "VENCIDA"] },
    { id: "prioridad", label: "Prioridad", tipo: "select", opciones: ["BAJA", "MEDIA", "ALTA", "URGENTE"] },
    { id: "dias_vencimiento", label: "Días para vencer", tipo: "numero" },
  ],
  credito: [
    { id: "banco", label: "Banco", tipo: "select", opciones: ["BCI", "SANTANDER", "BANCO_ESTADO", "ITAÚ", "BICE", "SCOTIABANK", "RIPLEY", "CMR", "OTRO"] },
    { id: "monto_aprobado", label: "Monto aprobado", tipo: "numero" },
    { id: "tasa", label: "Tasa", tipo: "numero" },
  ],
  comunicacion: [
    { id: "canal", label: "Canal", tipo: "select", opciones: ["EMAIL", "WHATSAPP", "SMS", "LLAMADA"] },
    { id: "direccion", label: "Dirección", tipo: "select", opciones: ["ENTRANTE", "SALIENTE"] },
  ],
};

// ─── Función de Permisos ───
export function tienePermisoAutomatizacion(rol: string, accion: string): boolean {
  const permisos = AUTOMATIZACION_PERMISOS[accion];
  if (!permisos) return false;
  return permisos.includes(rol as any);
}

// ─── Helpers ───
export function obtenerCategoriaTrigger(triggerId: string) {
  const trigger = TRIGGERS_TIPOS.find((t) => t.id === triggerId);
  if (!trigger) return TRIGGER_CATEGORIAS[0];
  return TRIGGER_CATEGORIAS.find((c) => c.id === trigger.categoria) || TRIGGER_CATEGORIAS[0];
}

export function obtenerAccionConfig(accionId: string) {
  return ACCIONES_TIPOS.find((a) => a.id === accionId);
}

export function obtenerCamposPorTrigger(triggerId: string) {
  const trigger = TRIGGERS_TIPOS.find((t) => t.id === triggerId);
  if (!trigger) return [];
  return CAMPOS_POR_CATEGORIA[trigger.categoria] || [];
}
