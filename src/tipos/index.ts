export type Rol = "SUPER_ADMIN" | "ADMIN" | "GERENTE" | "AGENTE" | "CLIENTE" | "EJECUTIVO";

export type OrigenLead =
  | "WEB"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "GOOGLE"
  | "TIKTOK"
  | "LINKEDIN"
  | "WHATSAPP"
  | "REFERIDO"
  | "OTRO";

export type Etapa =
  | "NUEVO_LEAD"
  | "CONTACTO_INICIAL"
  | "CONTACTADO"
  | "INTERESADO"
  | "CALIFICACION_COMERCIAL"
  | "DOCS_PENDIENTES"
  | "DOCS_PARCIALES"
  | "DOCS_COMPLETAS"
  | "EVALUACION_BANCARIA"
  | "PREAPROBADO"
  | "APROBADO"
  | "FIRMA_DIGITAL"
  | "NOTARIA"
  | "CREDITO_PAGADO"
  | "CLIENTE_FINALIZADO";

export type Prioridad = "BAJA" | "MEDIA" | "ALTA" | "URGENTE";

export type SituacionLaboral = "DEPENDIENTE" | "INDEPENDIENTE";

export interface Lead {
  id: string;
  // Datos del formulario web
  nombre: string;
  apellido: string;
  rut: string;
  edad?: number;
  email?: string;
  telefono?: string;
  situacionLaboral: SituacionLaboral;
  enDicom: boolean;
  dicomDetalle?: string;
  rentaMensual?: string;
  complementarRenta?: boolean;
  tipoCredito?: string;
  cuentaPie?: boolean;
  comentarios?: string;
  // Datos del CRM
  origen: OrigenLead;
  etapa: Etapa;
  prioridad: Prioridad;
  asignadoA?: string;
  nombreEjecutivo?: string;
  banco?: string;
  montoSolicitado?: number;
  valorPropiedad?: number;
  pieDisponible?: number;
  etiquetas?: string;
  notas?: string;
  // Referidos
  referidoPor?: string;
  referidoPorNombre?: string;
  codigoReferido?: string;
  creadoEn: Date;
  diasEnEtapa: number;

  // Datos personales extendidos
  cargasLegales?: string;
  estadoCivil?: string;
  regimenMatrimonial?: string;
  fechaNacimiento?: string;
  estudios?: string;
  profesion?: string;
  domicilioParticular?: string;
  comunaCiudad?: string;
  valorArriendo?: number;
  afp?: string;

  // Datos del empleador
  nombreEmpleador?: string;
  rutEmpresa?: string;
  fechaIngreso?: string;
  cargo?: string;
  rentaLiquida?: number;
  bancoAbonoRenta?: string;
  fechaPago?: string;
  direccionLaboral?: string;
  comunaCiudadLaboral?: string;
  telefonoLaboralFijo?: string;
  emailLaboral?: string;
  otrosIngresos?: string;
}

export const SITUACION_LABORAL_CONFIG: Record<SituacionLaboral, { label: string; icono: string }> = {
  DEPENDIENTE: { label: "Trabajador Dependiente", icono: "👔" },
  INDEPENDIENTE: { label: "Trabajador Independiente", icono: "💼" },
};

export const RENTAS_MENSUALES = [
  "Menos de $800.000",
  "Entre $800.000 y $1.000.000",
  "Entre $1.000.000 y $1.200.000",
  "Entre $1.200.000 y $1.400.000",
  "Entre $1.400.000 y $1.600.000",
  "Entre $1.600.000 y $1.800.000",
  "Entre $1.800.000 y $2.000.000",
  "Entre $2.000.000 y $2.200.000",
  "Entre $2.200.000 y $2.400.000",
  "Entre $2.400.000 y $2.600.000",
  "Entre $2.600.000 y $2.800.000",
  "Entre $2.800.000 y $3.000.000",
  "Entre $3.000.000 y $3.200.000",
  "Entre $3.200.000 y $3.400.000",
  "Entre $3.400.000 y $3.600.000",
];

export interface KPI {
  titulo: string;
  valor: string;
  valorUF?: string;
  cambio?: number;
  cambioLabel?: string;
  icono: string;
  color?: string;
}

export interface Ejecutivo {
  id: string;
  nombre: string;
  avatar?: string;
  aprobados: number;
  montoTotal: number;
}

export interface Banco {
  nombre: string;
  montoTotal: number;
  color: string;
}

export interface Notificacion {
  id: string;
  titulo: string;
  descripcion: string;
  tiempo: string;
  tipo: "documento" | "seguimiento" | "tarea" | "reunion";
}

export interface Recordatorio {
  id: string;
  titulo: string;
  proximo: string;
  icono: string;
}

export interface ActividadTiempoReal {
  id: string;
  titulo: string;
  detalle: string;
  tiempo: string;
  icono: string;
  color: string;
}

export const ETAPAS_CONFIG: Record<Etapa, { label: string; color: string }> = {
  NUEVO_LEAD: { label: "Nuevo Lead", color: "#3B82F6" },
  CONTACTO_INICIAL: { label: "Contacto Inicial", color: "#6366F1" },
  CONTACTADO: { label: "Contactado", color: "#8B5CF6" },
  INTERESADO: { label: "Interesado", color: "#A855F7" },
  CALIFICACION_COMERCIAL: { label: "Calificación", color: "#D946EF" },
  DOCS_PENDIENTES: { label: "Docs. Pendientes", color: "#F97316" },
  DOCS_PARCIALES: { label: "Docs. Parciales", color: "#FB923C" },
  DOCS_COMPLETAS: { label: "Docs. Completas", color: "#22C55E" },
  EVALUACION_BANCARIA: { label: "Evaluación Bancaria", color: "#06B6D4" },
  PREAPROBADO: { label: "Pre Aprobación", color: "#14B8A6" },
  APROBADO: { label: "Aprobado", color: "#10B981" },
  FIRMA_DIGITAL: { label: "Firma", color: "#6366F1" },
  NOTARIA: { label: "Notaría", color: "#8B5CF6" },
  CREDITO_PAGADO: { label: "Crédito Pagado", color: "#22C55E" },
  CLIENTE_FINALIZADO: { label: "Finalizado", color: "#64748B" },
};

export const ORIGEN_COLORS: Record<OrigenLead, string> = {
  WEB: "#3B82F6",
  FACEBOOK: "#1877F2",
  INSTAGRAM: "#E4405F",
  GOOGLE: "#EA4335",
  TIKTOK: "#000000",
  LINKEDIN: "#0A66C2",
  WHATSAPP: "#25D366",
  REFERIDO: "#D4AF37",
  OTRO: "#64748B",
};

export const ORIGEN_LABELS: Record<OrigenLead, string> = {
  WEB: "Sitio Web",
  FACEBOOK: "Facebook Ads",
  INSTAGRAM: "Instagram",
  GOOGLE: "Google Ads",
  TIKTOK: "TikTok Ads",
  LINKEDIN: "LinkedIn",
  WHATSAPP: "WhatsApp",
  REFERIDO: "Referido",
  OTRO: "Otros",
};

// Tipos para Tareas
export type EstadoTarea = "PENDIENTE" | "EN_PROGRESO" | "COMPLETADA" | "VENCIDA";
export type TipoTarea = "SEGUIMIENTO" | "DOCUMENTACION" | "REUNION" | "LLAMADA" | "OTRO";

export interface ComentarioTarea {
  id: string;
  autor: string;
  contenido: string;
  creadoEn: Date;
}

export interface HistorialTarea {
  id: string;
  accion: string;
  usuario: string;
  fecha: Date;
  detalle?: string;
}

export interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: EstadoTarea;
  tipo: TipoTarea;
  prioridad: Prioridad;
  asignadoA?: string;
  nombreEjecutivo?: string;
  leadId?: string;
  leadNombre?: string;
  fechaVencimiento?: Date;
  recordatorio?: Date;
  duracionEstimada?: number;
  etiquetas?: string[];
  comentarios: ComentarioTarea[];
  historial: HistorialTarea[];
  creadoEn: Date;
}

export const ESTADOS_TAREA_CONFIG: Record<EstadoTarea, { label: string; color: string }> = {
  PENDIENTE: { label: "Pendiente", color: "#F59E0B" },
  EN_PROGRESO: { label: "En Progreso", color: "#3B82F6" },
  COMPLETADA: { label: "Completada", color: "#10B981" },
  VENCIDA: { label: "Vencida", color: "#EF4444" },
};

export const TIPOS_TAREA_CONFIG: Record<TipoTarea, { label: string; color: string }> = {
  SEGUIMIENTO: { label: "Seguimiento", color: "#3B82F6" },
  DOCUMENTACION: { label: "Documentación", color: "#F97316" },
  REUNION: { label: "Reunión", color: "#8B5CF6" },
  LLAMADA: { label: "Llamada", color: "#10B981" },
  OTRO: { label: "Otro", color: "#64748B" },
};

// Tipos para Documentos
export type TipoDocumento = "CEDULA_IDENTIDAD" | "CONTRATO_TRABAJO" | "COMPROBANTE_INGRESOS" | "CERTIFICADO_AFP" | "DECLARACION_RENTA" | "VALORIZACION" | "CERTIFICADO_PIE" | "OTRO";

export interface DocumentoLead {
  id: string;
  leadId: string;
  leadNombre?: string;
  nombre: string;
  tipo: TipoDocumento;
  estado: "PENDIENTE" | "EN_REVISION" | "APROBADO" | "RECHAZADO";
  archivoUrl?: string;
  creadoEn: Date;
}

export const TIPOS_DOCUMENTO_CONFIG: Record<TipoDocumento, { label: string; icono: string }> = {
  CEDULA_IDENTIDAD: { label: "Cédula de Identidad", icono: "file-text" },
  CONTRATO_TRABAJO: { label: "Contrato de Trabajo", icono: "file-text" },
  COMPROBANTE_INGRESOS: { label: "Comprobante de Ingresos", icono: "dollar-sign" },
  CERTIFICADO_AFP: { label: "Certificado AFP", icono: "file-text" },
  DECLARACION_RENTA: { label: "Declaración de Renta", icono: "file-text" },
  VALORIZACION: { label: "Valorización", icono: "home" },
  CERTIFICADO_PIE: { label: "Certificado de Pie", icono: "file-text" },
  OTRO: { label: "Otro", icono: "file" },
};

// Tipos para Usuarios
export type EstadoUsuario = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  rol: Rol;
  estado: EstadoUsuario;
  avatar?: string;
  ultimoAcceso?: Date;
  creadoEn: Date;
  creadoPor?: string;
  doisFA?: boolean;
  intentosFallidos?: number;
  suspendidoHasta?: Date;
}

export const ESTADOS_USUARIO_CONFIG: Record<EstadoUsuario, { label: string; color: string }> = {
  ACTIVO: { label: "Activo", color: "bg-emerald-100 text-emerald-700" },
  INACTIVO: { label: "Inactivo", color: "bg-slate-100 text-slate-600" },
  SUSPENDIDO: { label: "Suspendido", color: "bg-red-100 text-red-700" },
};

export const ROLES_CONFIG: Record<Rol, { label: string; color: string; descripcion: string }> = {
  SUPER_ADMIN: { label: "Super Admin", color: "bg-purple-100 text-purple-700", descripcion: "Acceso total al sistema" },
  ADMIN: { label: "Administrador", color: "bg-blue-100 text-blue-700", descripcion: "Gestión avanzada" },
  GERENTE: { label: "Gerente", color: "bg-amber-100 text-amber-700", descripcion: "Supervisión de equipo" },
  AGENTE: { label: "Agente", color: "bg-slate-100 text-slate-700", descripcion: "Operaciones básicas" },
  CLIENTE: { label: "Cliente", color: "bg-emerald-100 text-emerald-700", descripcion: "Solo puede ver y editar su perfil y documentos" },
  EJECUTIVO: { label: "Ejecutivo", color: "bg-cyan-100 text-cyan-700", descripcion: "Ejecutivo comercial" },
};

// Tipos para Auditoría
export type TipoAccion = "CREAR" | "EDITAR" | "ELIMINAR" | "RESTAURAR" | "LOGIN" | "LOGOUT" | "EXPORTAR" | "IMPORTAR" | "CAMBIO_ROL" | "CAMBIO_ESTADO";

export interface RegistroAuditoria {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  accion: TipoAccion;
  modulo: string;
  registroId?: string;
  registroNombre?: string;
  valorAnterior?: string;
  valorNuevo?: string;
  motivo?: string;
  ip: string;
  navegador: string;
  dispositivo: string;
  fecha: Date;
}

export const ACCIONES_AUDITORIA_CONFIG: Record<TipoAccion, { label: string; color: string }> = {
  CREAR: { label: "Crear", color: "bg-emerald-100 text-emerald-700" },
  EDITAR: { label: "Editar", color: "bg-blue-100 text-blue-700" },
  ELIMINAR: { label: "Eliminar", color: "bg-red-100 text-red-700" },
  RESTAURAR: { label: "Restaurar", color: "bg-amber-100 text-amber-700" },
  LOGIN: { label: "Login", color: "bg-indigo-100 text-indigo-700" },
  LOGOUT: { label: "Logout", color: "bg-slate-100 text-slate-600" },
  EXPORTAR: { label: "Exportar", color: "bg-cyan-100 text-cyan-700" },
  IMPORTAR: { label: "Importar", color: "bg-teal-100 text-teal-700" },
  CAMBIO_ROL: { label: "Cambio Rol", color: "bg-purple-100 text-purple-700" },
  CAMBIO_ESTADO: { label: "Cambio Estado", color: "bg-orange-100 text-orange-700" },
};

// Permisos del sistema
export interface Permiso {
  id: string;
  nombre: string;
  descripcion: string;
  modulo: string;
}

export const MODULOS_SISTEMA = [
  "CRM Comercial",
  "Pipeline",
  "Leads",
  "Clientes",
  "Documentos",
  "Bancos",
  "Marketing",
  "Automatizaciones",
  "Reportes",
  "Configuración",
  "Usuarios",
  "Auditoría",
];
