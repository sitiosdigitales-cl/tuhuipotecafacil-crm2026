import { Lead, Etapa, OrigenLead, Prioridad, ETAPAS_CONFIG, ORIGEN_LABELS, Tarea, DocumentoLead, Usuario, RegistroAuditoria, Rol, TipoTarea } from "@/tipos";

export { ETAPAS_CONFIG, ORIGEN_LABELS };

const ETAPAS: Etapa[] = [
  "NUEVO_LEAD",
  "CONTACTO_INICIAL",
  "CONTACTADO",
  "INTERESADO",
  "CALIFICACION_COMERCIAL",
  "DOCS_PENDIENTES",
  "DOCS_COMPLETAS",
  "EVALUACION_BANCARIA",
  "PREAPROBADO",
  "APROBADO",
  "FIRMA_DIGITAL",
  "NOTARIA",
  "CREDITO_PAGADO",
];

const ORIGENES: OrigenLead[] = [
  "WEB",
  "FACEBOOK",
  "INSTAGRAM",
  "GOOGLE",
  "WHATSAPP",
  "REFERIDO",
  "LINKEDIN",
  "TIKTOK",
];

const EJECUTIVOS = [
  "Andrés Pérez",
  "Carolina Muñoz",
  "Diego Silva",
  "Valentina Torres",
  "Javier Morales",
  "Ana Torres",
  "Roberto Silva",
  "Fernanda Rojas",
];

const BANCOS = [
  "Banco de Chile",
  "Santander",
  "Bci",
  "Itaú",
  "Scotiabank",
  "Banco Estado",
  "Falabella",
  "CorpGroup",
];

const NOMBRES = [
  "Lucía", "Pedro", "María", "Carlos", "Ana", "Juan", "Sofía",
  "Diego", "Valentina", "Roberto", "Fernanda", "Alejandro", "Paula",
  "Martín", "Constanza", "Felipe", "Isidora", "Sebastián", "Florencia",
  "Mateo", "Catalina", "Tomás", "Javiera", "Benjamín", "Amanda",
  "Vicente", "Emilia", "Cristóbal", "Agustina", "Gabriel",
];

const APELLIDOS = [
  "Fernández", "Gómez", "López", "Rojas", "Torres", "Pérez",
  "Martínez", "Díaz", "Cruz", "Silva", "Vargas", "Herrera",
  "Morales", "García", "Soto", "Mendoza", "Reyes", "Contreras",
  "Espinoza", "Arriagada", "Fuentes", "Castillo", "Vásquez",
  "Ruiz", "Muñoz", "Jara", "Sepúlveda", "Cáceres", "Miranda",
];

const TIPOS_CREDITO = ["Créditos Hipotecarios", "Créditos de Consumos", "Fines Generales", "Capital para Empresas"];

// Generador pseudo-random determinístico basado en seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function generarRUTDeterministico(id: number): string {
  const num = Math.floor(seededRandom(id) * 20000000) + 5000000;
  const DV = String(num).split("").reverse().reduce((acc, d, i) => acc + Number(d) * ((i % 6) + 2), 0) % 11;
  const dv = DV === 11 ? "0" : DV === 10 ? "K" : String(DV);
  return `${num.toLocaleString("es-CL")}-${dv}`;
}

function crearLead(id: number, etapa: Etapa): Lead {
  const nombre = NOMBRES[id % NOMBRES.length];
  const apellido = APELLIDOS[id % APELLIDOS.length];
  const origen = ORIGENES[id % ORIGENES.length];
  const banco = BANCOS[id % BANCOS.length];
  const ejecutivo = EJECUTIVOS[id % EJECUTIVOS.length];
  const tipoCredito = TIPOS_CREDITO[id % TIPOS_CREDITO.length];
  const monto = Math.floor(seededRandom(id * 100) * 250 + 80) * 1000000;
  const valorProp = monto + Math.floor(seededRandom(id * 200) * 50 + 20) * 1000000;
  const pie = valorProp - monto;
  const prioridad: Prioridad = (["BAJA", "MEDIA", "ALTA", "URGENTE"] as const)[id % 4];
  const diasEnEtapa = Math.floor(seededRandom(id * 300) * 10) + 1;
  const situacionLaboral = id % 2 === 0 ? "DEPENDIENTE" : "INDEPENDIENTE";
  const enDicom = id % 5 === 0;
  const rentas = ["Menos de $500.000", "Entre $500.000 y $800.000", "Entre $800.000 y $1.200.000", "Entre $1.200.000 y $1.400.000", "Entre $1.400.000 y $2.000.000"];

  return {
    id: `lead-${id}`,
    nombre,
    apellido,
    rut: generarRUTDeterministico(id),
    edad: Math.floor(seededRandom(id * 400) * 30) + 25,
    email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@email.cl`,
    telefono: `+569${Math.floor(seededRandom(id * 500) * 90000000 + 10000000)}`,
    situacionLaboral: situacionLaboral as "DEPENDIENTE" | "INDEPENDIENTE",
    enDicom,
    dicomDetalle: enDicom ? "Deuda consumo" : undefined,
    rentaMensual: rentas[id % rentas.length],
    complementarRenta: id % 3 === 0,
    tipoCredito,
    cuentaPie: id % 4 !== 0,
    comentarios: id % 7 === 0 ? "Contactar después de las 18:00" : undefined,
    origen,
    etapa,
    prioridad,
    nombreEjecutivo: ejecutivo,
    banco,
    montoSolicitado: monto,
    valorPropiedad: valorProp,
    pieDisponible: pie,
    notas: id % 7 === 0 ? "Contactar después de las 18:00" : undefined,
    creadoEn: new Date(2026, 5, 15 - Math.floor(seededRandom(id * 600) * 30)),
    diasEnEtapa,
  };
}

export function generarLeads(): Lead[] {
  const leads: Lead[] = [];
  let id = 1;

  const leadsPorEtapa: Record<Etapa, number> = {
    NUEVO_LEAD: 64,
    CONTACTO_INICIAL: 41,
    CONTACTADO: 55,
    INTERESADO: 51,
    CALIFICACION_COMERCIAL: 31,
    DOCS_PENDIENTES: 28,
    DOCS_PARCIALES: 10,
    DOCS_COMPLETAS: 20,
    EVALUACION_BANCARIA: 18,
    PREAPROBADO: 6,
    APROBADO: 14,
    FIRMA_DIGITAL: 5,
    NOTARIA: 7,
    CREDITO_PAGADO: 11,
    CLIENTE_FINALIZADO: 3,
  };

  for (const etapa of ETAPAS) {
    const cantidad = leadsPorEtapa[etapa] || 0;
    for (let i = 0; i < cantidad; i++) {
      leads.push(crearLead(id++, etapa));
    }
  }

  return leads;
}

export const KPI_DATA = [
  { titulo: "Leads nuevos hoy", valor: "56", cambio: 24, cambioLabel: "vs ayer", icono: "users" },
  { titulo: "Leads del mes", valor: "1.248", cambio: 18, cambioLabel: "vs mes pasado", icono: "user-plus" },
  { titulo: "Créditos aprobados", valor: "312", cambio: 22, cambioLabel: "vs mes pasado", icono: "check-circle" },
  { titulo: "En evaluación bancaria", valor: "78", cambio: 0, cambioLabel: "Sin cambios", icono: "clock" },
  { titulo: "Valor total financiado", valor: "$12.850M", valorUF: "329.670 UF", cambio: 28, cambioLabel: "vs mes pasado", icono: "dollar-sign" },
  { titulo: "Tasa de conversión", valor: "24,6%", cambio: 5.3, cambioLabel: "vs mes pasado", icono: "trending-up" },
  { titulo: "Ticket promedio", valor: "$98.450M", valorUF: "2.527 UF", cambio: -4, cambioLabel: "vs mes pasado", icono: "award" },
];

export const RANKING_EJECUTIVOS = [
  { nombre: "Andrés Pérez", aprobados: 38, montoTotal: 2450000000 },
  { nombre: "Carolina Muñoz", aprobados: 32, montoTotal: 1980000000 },
  { nombre: "Diego Silva", aprobados: 28, montoTotal: 1620000000 },
  { nombre: "Valentina Torres", aprobados: 24, montoTotal: 1120000000 },
  { nombre: "Javier Morales", aprobados: 21, montoTotal: 980000000 },
];

export const RENDIMIENTO_BANCOS = [
  { nombre: "Banco de Chile", montoTotal: 3250000000, color: "#E31837" },
  { nombre: "Santander", montoTotal: 2980000000, color: "#EC0000" },
  { nombre: "Bci", montoTotal: 2450000000, color: "#003DA5" },
  { nombre: "Itaú", montoTotal: 2100000000, color: "#F7941D" },
  { nombre: "Scotiabank", montoTotal: 1850000000, color: "#EC111A" },
];

export const APROBACIONES_MENSUALES = [
  { mes: "Ene", aprobados: 120 },
  { mes: "Feb", aprobados: 135 },
  { mes: "Mar", aprobados: 155 },
  { mes: "Abr", aprobados: 142 },
  { mes: "May", aprobados: 168 },
  { mes: "Jun", aprobados: 180 },
  { mes: "Jul", aprobados: 165 },
  { mes: "Ago", aprobados: 148 },
  { mes: "Sep", aprobados: 190 },
  { mes: "Oct", aprobados: 200 },
  { mes: "Nov", aprobados: 195 },
  { mes: "Dic", aprobados: 175 },
];

export const LEADS_POR_ORIGEN = [
  { nombre: "Sitio Web", valor: 28, color: "#3B82F6" },
  { nombre: "Facebook Ads", valor: 20, color: "#1877F2" },
  { nombre: "Instagram", valor: 15, color: "#E4405F" },
  { nombre: "Google Ads", valor: 14, color: "#EA4335" },
  { nombre: "WhatsApp", valor: 9, color: "#25D366" },
  { nombre: "Referido", valor: 7, color: "#D4AF37" },
  { nombre: "LinkedIn", valor: 4, color: "#0A66C2" },
  { nombre: "Otros", valor: 3, color: "#64748B" },
];

export const ACTIVIDAD_RECIENTE = [
  { id: "1", titulo: "Nuevo lead desde Facebook Ads", detalle: "María González", tiempo: "Hace 2 min", icono: "user-plus", color: "#3B82F6" },
  { id: "2", titulo: "Documento subido por cliente", detalle: "Carlos Rojas", tiempo: "Hace 12 min", icono: "file-text", color: "#22C55E" },
  { id: "3", titulo: "Recordatorio enviado", detalle: "Juan Pérez", tiempo: "Hace 10 min", icono: "bell", color: "#F59E0B" },
  { id: "4", titulo: "Reunión agendada", detalle: "Ana Torres", tiempo: "Hace 15 min", icono: "calendar", color: "#8B5CF6" },
  { id: "5", titulo: "Crédito aprobado", detalle: "Diego Díaz", tiempo: "Hace 20 min", icono: "check-circle", color: "#10B981" },
];

export const NOTIFICACIONES = [
  { id: "1", titulo: "12 documentos pendientes de revisión", tipo: "documento" as const, tiempo: "" },
  { id: "2", titulo: "5 leads sin seguimiento", tipo: "seguimiento" as const, tiempo: "" },
  { id: "3", titulo: "3 tareas vencidas", tipo: "tarea" as const, tiempo: "" },
  { id: "4", titulo: "2 reuniones hoy", tipo: "reunion" as const, tiempo: "" },
];

export const RECORDATORIOS_SISTEMA = [
  { id: "1", titulo: "Revisión automática de documentos", proximo: "Cada 24 horas", icono: "refresh-cw" },
  { id: "2", titulo: "Recordatorio a clientes", proximo: "Siguiente: Mañana 09:00 AM", icono: "users" },
  { id: "3", titulo: "Sincronización bancaria", proximo: "Siguiente: Hoy 11:00 PM", icono: "building" },
  { id: "4", titulo: "Respaldo automático", proximo: "Último: Hoy 02:00 AM", icono: "hard-drive" },
];

export const RESUMEN_SISTEMA = [
  { titulo: "Usuarios activos", valor: "86", icono: "users" },
  { titulo: "Almacenamiento", valor: "68%", icono: "database" },
  { titulo: "Integraciones activas", valor: "12", icono: "plug" },
  { titulo: "Automatizaciones activas", valor: "24", icono: "zap" },
  { titulo: "Uptime del sistema", valor: "99.9%", icono: "activity" },
];

// Helper para crear fechas relativas
const hace = (dias: number) => new Date(Date.now() - dias * 86400000);
const en = (dias: number) => new Date(Date.now() + dias * 86400000);
const haceHoras = (horas: number) => new Date(Date.now() - horas * 3600000);

// Datos mock para Tareas
export const TAREAS_MOCK: Tarea[] = [
  {
    id: "t1", titulo: "Llamar a María González", descripcion: "Seguimiento post aprobación del crédito. Confirmar documentación final.", estado: "PENDIENTE", tipo: "LLAMADA", prioridad: "ALTA",
    leadId: "lead-1", leadNombre: "María González", nombreEjecutivo: "Andrés Pérez", asignadoA: "u2",
    fechaVencimiento: en(1), duracionEstimada: 30, etiquetas: ["seguimiento", "urgente"],
    comentarios: [
      { id: "c1", autor: "Andrés Pérez", contenido: "María confirmó que recibió la carta del banco.", creadoEn: hace(2) },
      { id: "c2", autor: "Carolina Muñoz", contenido: "Falta solo el certificado de AFP.", creadoEn: hace(1) },
    ],
    historial: [
      { id: "h1", accion: "Creada", usuario: "Andrés Pérez", fecha: hace(3) },
      { id: "h2", accion: "Prioridad cambiada a Alta", usuario: "Andrés Pérez", fecha: hace(2), detalle: "El cliente necesita respuesta rápido" },
    ],
    creadoEn: hace(3),
  },
  {
    id: "t2", titulo: "Revisar documentos de Carlos Rojas", descripcion: "Falta certificado de AFP y comprobante de domicilio.", estado: "EN_PROGRESO", tipo: "DOCUMENTACION", prioridad: "MEDIA",
    leadId: "lead-2", leadNombre: "Carlos Rojas", nombreEjecutivo: "Carolina Muñoz", asignadoA: "u3",
    fechaVencimiento: en(3), duracionEstimada: 60, etiquetas: ["documentos"],
    comentarios: [
      { id: "c3", autor: "Carolina Muñoz", contenido: "Carlos va a enviar el certificado de AFP mañana.", creadoEn: hace(1) },
    ],
    historial: [
      { id: "h3", accion: "Creada", usuario: "Carolina Muñoz", fecha: hace(5) },
      { id: "h4", accion: "Estado cambiado a En Progreso", usuario: "Carolina Muñoz", fecha: hace(2) },
    ],
    creadoEn: hace(5),
  },
  {
    id: "t3", titulo: "Enviar propuesta comercial a Juan Pérez", descripcion: "Incluir comparativa de tasas entre Banco Estado y Santander.", estado: "COMPLETADA", tipo: "SEGUIMIENTO", prioridad: "BAJA",
    leadId: "lead-3", leadNombre: "Juan Pérez", nombreEjecutivo: "Diego Silva", asignadoA: "u4",
    etiquetas: ["propuesta"],
    comentarios: [
      { id: "c4", autor: "Diego Silva", contenido: "Propuesta enviada por email. Juan revisará esta semana.", creadoEn: hace(4) },
    ],
    historial: [
      { id: "h5", accion: "Creada", usuario: "Diego Silva", fecha: hace(7) },
      { id: "h6", accion: "Estado cambiado a En Progreso", usuario: "Diego Silva", fecha: hace(5) },
      { id: "h7", accion: "Completada", usuario: "Diego Silva", fecha: hace(4) },
    ],
    creadoEn: hace(7),
  },
  {
    id: "t4", titulo: "Agendar reunión con Ana Torres", descripcion: "Revisión de condiciones bancarias y evaluación de alternativas.", estado: "PENDIENTE", tipo: "REUNION", prioridad: "URGENTE",
    leadId: "lead-4", leadNombre: "Ana Torres", nombreEjecutivo: "Valentina Torres", asignadoA: "u5",
    fechaVencimiento: en(0), duracionEstimada: 45, etiquetas: ["reunión", "urgente"],
    comentarios: [
      { id: "c5", autor: "Valentina Torres", contenido: "Ana solo puede los martes y jueves por la tarde.", creadoEn: hace(1) },
    ],
    historial: [
      { id: "h8", accion: "Creada", usuario: "Valentina Torres", fecha: hace(2) },
    ],
    creadoEn: hace(2),
  },
  {
    id: "t5", titulo: "Actualizar avalúo de Diego Díaz", descripcion: "El avalúo venció. Solicitar nuevo avalúo al banco.", estado: "VENCIDA", tipo: "DOCUMENTACION", prioridad: "ALTA",
    leadId: "lead-5", leadNombre: "Diego Díaz", nombreEjecutivo: "Javier Morales", asignadoA: "u6",
    fechaVencimiento: hace(1), duracionEstimada: 120, etiquetas: ["avalúo", "vencido"],
    comentarios: [],
    historial: [
      { id: "h9", accion: "Creada", usuario: "Javier Morales", fecha: hace(10) },
      { id: "h10", accion: "Vencida", usuario: "Sistema", fecha: hace(1) },
    ],
    creadoEn: hace(10),
  },
  {
    id: "t6", titulo: "Preparar contrato para Sofía Martínez", descripcion: "Redactar contrato de promesa de compraventa con cláusulas especiales.", estado: "PENDIENTE", tipo: "DOCUMENTACION", prioridad: "MEDIA",
    leadId: "lead-6", leadNombre: "Sofía Martínez", nombreEjecutivo: "Andrés Pérez", asignadoA: "u2",
    fechaVencimiento: en(5), duracionEstimada: 90, etiquetas: ["contrato"],
    comentarios: [
      { id: "c6", autor: "Andrés Pérez", contenido: "Sofía solicitó incluir cláusula de arrepentimiento de 5 días.", creadoEn: hace(1) },
    ],
    historial: [
      { id: "h11", accion: "Creada", usuario: "Andrés Pérez", fecha: hace(1) },
    ],
    creadoEn: hace(1),
  },
  {
    id: "t7", titulo: "Verificar estado de crédito Roberto Silva", descripcion: "Consultar con el banco el estado de la evaluación interna.", estado: "EN_PROGRESO", tipo: "SEGUIMIENTO", prioridad: "BAJA",
    leadId: "lead-7", leadNombre: "Roberto Silva", nombreEjecutivo: "Carolina Muñoz", asignadoA: "u3",
    fechaVencimiento: en(7), etiquetas: ["seguimiento"],
    comentarios: [
      { id: "c7", autor: "Carolina Muñoz", contenido: "Banco informa que falta la revisión de scored.", creadoEn: hace(3) },
    ],
    historial: [
      { id: "h12", accion: "Creada", usuario: "Carolina Muñoz", fecha: hace(6) },
      { id: "h13", accion: "Estado cambiado a En Progreso", usuario: "Carolina Muñoz", fecha: hace(3) },
    ],
    creadoEn: hace(6),
  },
  {
    id: "t8", titulo: "Enviar recordatorio a Fernanda Rojas", descripcion: "Recordar envío de comprobante de ingresos actualizado.", estado: "COMPLETADA", tipo: "LLAMADA", prioridad: "MEDIA",
    leadId: "lead-8", leadNombre: "Fernanda Rojas", nombreEjecutivo: "Diego Silva", asignadoA: "u4",
    etiquetas: ["recordatorio"],
    comentarios: [
      { id: "c8", autor: "Diego Silva", contenido: "Fernanda envió el comprobante por WhatsApp.", creadoEn: hace(5) },
    ],
    historial: [
      { id: "h14", accion: "Creada", usuario: "Diego Silva", fecha: hace(8) },
      { id: "h15", accion: "Completada", usuario: "Diego Silva", fecha: hace(5) },
    ],
    creadoEn: hace(8),
  },
  {
    id: "t9", titulo: "Coordinar visita a propiedad con Alejandro Vargas", descripcion: "El cliente quiere ver la propiedad antes de firmar.", estado: "PENDIENTE", tipo: "REUNION", prioridad: "ALTA",
    leadId: "lead-9", leadNombre: "Alejandro Vargas", nombreEjecutivo: "Valentina Torres", asignadoA: "u5",
    fechaVencimiento: en(2), duracionEstimada: 60, etiquetas: ["visita", "propiedad"],
    comentarios: [],
    historial: [
      { id: "h16", accion: "Creada", usuario: "Valentina Torres", fecha: haceHoras(6) },
    ],
    creadoEn: haceHoras(6),
  },
  {
    id: "t10", titulo: "Solicitar certificado de deudas a Paula Herrera", descripcion: "Requerido para evaluación bancaria final.", estado: "EN_PROGRESO", tipo: "DOCUMENTACION", prioridad: "MEDIA",
    leadId: "lead-10", leadNombre: "Paula Herrera", nombreEjecutivo: "Andrés Pérez", asignadoA: "u2",
    fechaVencimiento: en(4), etiquetas: ["documentos", "certificado"],
    comentarios: [
      { id: "c9", autor: "Andrés Pérez", contenido: "Paula dice que lo obtendrá el viernes.", creadoEn: hace(1) },
    ],
    historial: [
      { id: "h17", accion: "Creada", usuario: "Andrés Pérez", fecha: hace(3) },
      { id: "h18", accion: "Estado cambiado a En Progreso", usuario: "Andrés Pérez", fecha: hace(1) },
    ],
    creadoEn: hace(3),
  },
  {
    id: "t11", titulo: "Llamar a Camila Espinoza para actualización", descripcion: "No responde llamadas desde la semana pasada.", estado: "PENDIENTE", tipo: "LLAMADA", prioridad: "ALTA",
    leadId: "lead-11", leadNombre: "Camila Espinoza", nombreEjecutivo: "Carolina Muñoz", asignadoA: "u3",
    fechaVencimiento: en(0), duracionEstimada: 15, etiquetas: ["seguimiento", "contacto"],
    comentarios: [],
    historial: [
      { id: "h19", accion: "Creada", usuario: "Carolina Muñoz", fecha: haceHoras(3) },
    ],
    creadoEn: haceHoras(3),
  },
  {
    id: "t12", titulo: "Revisar avalúo de Sebastián Castillo", descripcion: "Avalúo recibido. Verificar que cumple con el monto solicitado.", estado: "COMPLETADA", tipo: "DOCUMENTACION", prioridad: "BAJA",
    leadId: "lead-12", leadNombre: "Sebastián Castillo", nombreEjecutivo: "Diego Silva", asignadoA: "u4",
    etiquetas: ["avalúo", "revisión"],
    comentarios: [
      { id: "c10", autor: "Diego Silva", contenido: "Avalúo aprobado. Propiedad vale $180.000.000.", creadoEn: hace(6) },
    ],
    historial: [
      { id: "h20", accion: "Creada", usuario: "Diego Silva", fecha: hace(9) },
      { id: "h21", accion: "Completada", usuario: "Diego Silva", fecha: hace(6) },
    ],
    creadoEn: hace(9),
  },
  {
    id: "t13", titulo: "Agendar reunión con equipo bancario BBVA", descripcion: "Reunión con gerente de crédito para discutir condiciones especiales.", estado: "PENDIENTE", tipo: "REUNION", prioridad: "URGENTE",
    leadId: "lead-13", leadNombre: "Roberto Silva", nombreEjecutivo: "Javier Morales", asignadoA: "u6",
    fechaVencimiento: en(1), duracionEstimada: 90, etiquetas: ["banco", "bbva", "urgente"],
    comentarios: [
      { id: "c11", autor: "Javier Morales", contenido: "Gerente BBVA disponible martes 10:00.", creadoEn: haceHoras(2) },
    ],
    historial: [
      { id: "h22", accion: "Creada", usuario: "Javier Morales", fecha: haceHoras(4) },
    ],
    creadoEn: haceHoras(4),
  },
  {
    id: "t14", titulo: "Enviar documentación a notaría para Martín Lagos", descripcion: "Preparar carpetas con todos los documentos para la firma.", estado: "PENDIENTE", tipo: "DOCUMENTACION", prioridad: "ALTA",
    leadId: "lead-14", leadNombre: "Martín Lagos", nombreEjecutivo: "Valentina Torres", asignadoA: "u5",
    fechaVencimiento: en(3), duracionEstimada: 120, etiquetas: ["notaría", "firma"],
    comentarios: [],
    historial: [
      { id: "h23", accion: "Creada", usuario: "Valentina Torres", fecha: hace(1) },
    ],
    creadoEn: hace(1),
  },
  {
    id: "t15", titulo: "Seguimiento post firma Valentina Cruz", descripcion: "Confirmar que el crédito fue desembolsado correctamente.", estado: "EN_PROGRESO", tipo: "SEGUIMIENTO", prioridad: "MEDIA",
    leadId: "lead-15", leadNombre: "Valentina Cruz", nombreEjecutivo: "Andrés Pérez", asignadoA: "u2",
    fechaVencimiento: en(5), etiquetas: ["desembolso", "seguimiento"],
    comentarios: [
      { id: "c12", autor: "Andrés Pérez", contenido: "Banco confirma desembolso pendiente para el viernes.", creadoEn: haceHoras(8) },
    ],
    historial: [
      { id: "h24", accion: "Creada", usuario: "Andrés Pérez", fecha: hace(2) },
      { id: "h25", accion: "Estado cambiado a En Progreso", usuario: "Andrés Pérez", fecha: haceHoras(8) },
    ],
    creadoEn: hace(2),
  },
  {
    id: "t16", titulo: "Llamar a Isidora Muñoz - contacto inicial", descripcion: "Primer contacto. Lead nuevo por formulario web.", estado: "PENDIENTE", tipo: "LLAMADA", prioridad: "MEDIA",
    leadId: "lead-16", leadNombre: "Isidora Muñoz", nombreEjecutivo: "Carolina Muñoz", asignadoA: "u3",
    fechaVencimiento: en(2), duracionEstimada: 20, etiquetas: ["nuevo-lead", "contacto-inicial"],
    comentarios: [],
    historial: [
      { id: "h26", accion: "Creada", usuario: "Sistema", fecha: haceHoras(1), detalle: "Auto-creada por formulario web" },
    ],
    creadoEn: haceHoras(1),
  },
  {
    id: "t17", titulo: "Revisar contrato de Tomás Fernández", descripcion: "Contrato enviado por abogado. Revisar cláusulas antes de firma.", estado: "PENDIENTE", tipo: "DOCUMENTACION", prioridad: "ALTA",
    leadId: "lead-17", leadNombre: "Tomás Fernández", nombreEjecutivo: "Diego Silva", asignadoA: "u4",
    fechaVencimiento: en(2), duracionEstimada: 45, etiquetas: ["contrato", "legal"],
    comentarios: [],
    historial: [
      { id: "h27", accion: "Creada", usuario: "Diego Silva", fecha: haceHoras(5) },
    ],
    creadoEn: haceHoras(5),
  },
  {
    id: "t18", titulo: "Agendar visita a propiedad con Valentina Rojas", descripcion: "Propiedad en Las Condes. Cliente muy interesada.", estado: "PENDIENTE", tipo: "REUNION", prioridad: "MEDIA",
    leadId: "lead-18", leadNombre: "Valentina Rojas", nombreEjecutivo: "Javier Morales", asignadoA: "u6",
    fechaVencimiento: en(4), duracionEstimada: 60, etiquetas: ["visita", "propiedad"],
    comentarios: [],
    historial: [
      { id: "h28", accion: "Creada", usuario: "Javier Morales", fecha: hace(1) },
    ],
    creadoEn: hace(1),
  },
  {
    id: "t19", titulo: "Verificar scored de Francisco Soto", descripcion: "Banco requiere scored actualizado para continuar.", estado: "VENCIDA", tipo: "DOCUMENTACION", prioridad: "URGENTE",
    leadId: "lead-19", leadNombre: "Francisco Soto", nombreEjecutivo: "Valentina Torres", asignadoA: "u5",
    fechaVencimiento: hace(2), duracionEstimada: 30, etiquetas: ["scored", "urgente", "vencido"],
    comentarios: [
      { id: "c13", autor: "Valentina Torres", contenido: "Francisco no ha respondido los últimos 3 llamados.", creadoEn: hace(1) },
    ],
    historial: [
      { id: "h29", accion: "Creada", usuario: "Valentina Torres", fecha: hace(7) },
      { id: "h30", accion: "Vencida", usuario: "Sistema", fecha: hace(2) },
    ],
    creadoEn: hace(7),
  },
  {
    id: "t20", titulo: "Enviar propuesta a Javiera Reyes", descripcion: "Incluir opciones de crédito con y sin cuenta de ahorro.", estado: "COMPLETADA", tipo: "SEGUIMIENTO", prioridad: "MEDIA",
    leadId: "lead-20", leadNombre: "Javiera Reyes", nombreEjecutivo: "Andrés Pérez", asignadoA: "u2",
    etiquetas: ["propuesta"],
    comentarios: [
      { id: "c14", autor: "Andrés Pérez", contenido: "Javiera eligió la opción sin cuenta de ahorro.", creadoEn: hace(3) },
    ],
    historial: [
      { id: "h31", accion: "Creada", usuario: "Andrés Pérez", fecha: hace(6) },
      { id: "h32", accion: "Completada", usuario: "Andrés Pérez", fecha: hace(3) },
    ],
    creadoEn: hace(6),
  },
  {
    id: "t21", titulo: "Coordinar firma digital con Bastián Morales", descripcion: "Cliente prefiere firma digital. Coordinar horario.", estado: "EN_PROGRESO", tipo: "REUNION", prioridad: "ALTA",
    leadId: "lead-21", leadNombre: "Bastián Morales", nombreEjecutivo: "Carolina Muñoz", asignadoA: "u3",
    fechaVencimiento: en(1), duracionEstimada: 30, etiquetas: ["firma", "digital"],
    comentarios: [
      { id: "c15", autor: "Carolina Muñoz", contenido: "Bastián disponible mañana 15:00 para firma.", creadoEn: haceHoras(4) },
    ],
    historial: [
      { id: "h33", accion: "Creada", usuario: "Carolina Muñoz", fecha: hace(2) },
      { id: "h34", accion: "Estado cambiado a En Progreso", usuario: "Carolina Muñoz", fecha: haceHoras(4) },
    ],
    creadoEn: hace(2),
  },
  {
    id: "t22", titulo: "Llamar a Consuelo Díaz - seguimiento", descripcion: "Seguimiento mensual post desembolso.", estado: "PENDIENTE", tipo: "LLAMADA", prioridad: "BAJA",
    leadId: "lead-22", leadNombre: "Consuelo Díaz", nombreEjecutivo: "Diego Silva", asignadoA: "u4",
    fechaVencimiento: en(10), duracionEstimada: 15, etiquetas: ["seguimiento", "post-venta"],
    comentarios: [],
    historial: [
      { id: "h35", accion: "Creada", usuario: "Diego Silva", fecha: hace(1) },
    ],
    creadoEn: hace(1),
  },
  {
    id: "t23", titulo: "Revisar documentos de Ignacio Vera", descripcion: "Cédula de identidad, comprobante de ingresos y certificado de AFP.", estado: "PENDIENTE", tipo: "DOCUMENTACION", prioridad: "MEDIA",
    leadId: "lead-23", leadNombre: "Ignacio Vera", nombreEjecutivo: "Javier Morales", asignadoA: "u6",
    fechaVencimiento: en(6), etiquetas: ["documentos", "pendiente"],
    comentarios: [],
    historial: [
      { id: "h36", accion: "Creada", usuario: "Javier Morales", fecha: haceHoras(10) },
    ],
    creadoEn: haceHoras(10),
  },
  {
    id: "t24", titulo: "Agendar reunión con Banco Chile para Francisca Riquelme", descripcion: "Negociar tasa preferencial por vinculación.", estado: "PENDIENTE", tipo: "REUNION", prioridad: "ALTA",
    leadId: "lead-24", leadNombre: "Francisca Riquelme", nombreEjecutivo: "Valentina Torres", asignadoA: "u5",
    fechaVencimiento: en(3), duracionEstimada: 60, etiquetas: ["banco", "negociación"],
    comentarios: [],
    historial: [
      { id: "h37", accion: "Creada", usuario: "Valentina Torres", fecha: haceHoras(2) },
    ],
    creadoEn: haceHoras(2),
  },
  {
    id: "t25", titulo: "Completar evaluación de Matías Concha", descripcion: "Último paso antes de enviar a evaluación bancaria.", estado: "EN_PROGRESO", tipo: "SEGUIMIENTO", prioridad: "MEDIA",
    leadId: "lead-25", leadNombre: "Matías Concha", nombreEjecutivo: "Andrés Pérez", asignadoA: "u2",
    fechaVencimiento: en(2), etiquetas: ["evaluación", "calificación"],
    comentarios: [
      { id: "c16", autor: "Andrés Pérez", contenido: "Ingresos verificados. Falta revisar endeudamiento.", creadoEn: haceHoras(6) },
    ],
    historial: [
      { id: "h38", accion: "Creada", usuario: "Andrés Pérez", fecha: hace(2) },
      { id: "h39", accion: "Estado cambiado a En Progreso", usuario: "Andrés Pérez", fecha: haceHoras(6) },
    ],
    creadoEn: hace(2),
  },
];

// Datos mock para Documentos
export const DOCUMENTOS_MOCK: DocumentoLead[] = [
  // María González - Lead 1
  { id: "d1", leadId: "lead-1", leadNombre: "María González", nombre: "Cédula de Identidad", tipo: "CEDULA_IDENTIDAD", estado: "APROBADO", creadoEn: new Date(Date.now() - 604800000) },
  { id: "d2", leadId: "lead-1", leadNombre: "María González", nombre: "Contrato de Trabajo", tipo: "CONTRATO_TRABAJO", estado: "APROBADO", creadoEn: new Date(Date.now() - 518400000) },
  { id: "d3", leadId: "lead-1", leadNombre: "María González", nombre: "Comprobante de Ingresos", tipo: "COMPROBANTE_INGRESOS", estado: "EN_REVISION", creadoEn: new Date(Date.now() - 432000000) },
  { id: "d3b", leadId: "lead-1", leadNombre: "María González", nombre: "Certificado AFP", tipo: "CERTIFICADO_AFP", estado: "PENDIENTE", creadoEn: new Date(Date.now() - 200000000) },

  // Carlos Rojas - Lead 2
  { id: "d4", leadId: "lead-2", leadNombre: "Carlos Rojas", nombre: "Certificado AFP", tipo: "CERTIFICADO_AFP", estado: "PENDIENTE", creadoEn: new Date(Date.now() - 345600000) },
  { id: "d5", leadId: "lead-2", leadNombre: "Carlos Rojas", nombre: "Cédula de Identidad", tipo: "CEDULA_IDENTIDAD", estado: "APROBADO", creadoEn: new Date(Date.now() - 259200000) },
  { id: "d5b", leadId: "lead-2", leadNombre: "Carlos Rojas", nombre: "Comprobante de Domicilio", tipo: "OTRO", estado: "APROBADO", creadoEn: new Date(Date.now() - 200000000) },
  { id: "d5c", leadId: "lead-2", leadNombre: "Carlos Rojas", nombre: "Declaración de Renta", tipo: "DECLARACION_RENTA", estado: "EN_REVISION", creadoEn: new Date(Date.now() - 150000000) },

  // Juan Pérez - Lead 3
  { id: "d6", leadId: "lead-3", leadNombre: "Juan Pérez", nombre: "Valorización", tipo: "VALORIZACION", estado: "RECHAZADO", creadoEn: new Date(Date.now() - 172800000) },
  { id: "d6b", leadId: "lead-3", leadNombre: "Juan Pérez", nombre: "Cédula de Identidad", tipo: "CEDULA_IDENTIDAD", estado: "APROBADO", creadoEn: new Date(Date.now() - 300000000) },
  { id: "d6c", leadId: "lead-3", leadNombre: "Juan Pérez", nombre: "Certificado de Pie", tipo: "CERTIFICADO_PIE", estado: "PENDIENTE", creadoEn: new Date(Date.now() - 100000000) },

  // Ana Torres - Lead 4
  { id: "d7", leadId: "lead-4", leadNombre: "Ana Torres", nombre: "Declaración de Renta", tipo: "DECLARACION_RENTA", estado: "PENDIENTE", creadoEn: new Date(Date.now() - 86400000) },
  { id: "d7b", leadId: "lead-4", leadNombre: "Ana Torres", nombre: "Cédula de Identidad", tipo: "CEDULA_IDENTIDAD", estado: "APROBADO", creadoEn: new Date(Date.now() - 400000000) },
  { id: "d7c", leadId: "lead-4", leadNombre: "Ana Torres", nombre: "Contrato de Trabajo", tipo: "CONTRATO_TRABAJO", estado: "APROBADO", creadoEn: new Date(Date.now() - 350000000) },
  { id: "d7d", leadId: "lead-4", leadNombre: "Ana Torres", nombre: "Certificado AFP", tipo: "CERTIFICADO_AFP", estado: "EN_REVISION", creadoEn: new Date(Date.now() - 50000000) },

  // Diego Díaz - Lead 5
  { id: "d8", leadId: "lead-5", leadNombre: "Diego Díaz", nombre: "Certificado de Pie", tipo: "CERTIFICADO_PIE", estado: "APROBADO", creadoEn: new Date(Date.now() - 604800000) },
  { id: "d8b", leadId: "lead-5", leadNombre: "Diego Díaz", nombre: "Cédula de Identidad", tipo: "CEDULA_IDENTIDAD", estado: "APROBADO", creadoEn: new Date(Date.now() - 500000000) },
  { id: "d8c", leadId: "lead-5", leadNombre: "Diego Díaz", nombre: "Comprobante de Ingresos", tipo: "COMPROBANTE_INGRESOS", estado: "APROBADO", creadoEn: new Date(Date.now() - 450000000) },
  { id: "d8d", leadId: "lead-5", leadNombre: "Diego Díaz", nombre: "Valorización", tipo: "VALORIZACION", estado: "RECHAZADO", creadoEn: new Date(Date.now() - 200000000) },

  // Sofía Martínez - Lead 6
  { id: "d9", leadId: "lead-6", leadNombre: "Sofía Martínez", nombre: "Cédula de Identidad", tipo: "CEDULA_IDENTIDAD", estado: "APROBADO", creadoEn: new Date(Date.now() - 700000000) },
  { id: "d9b", leadId: "lead-6", leadNombre: "Sofía Martínez", nombre: "Contrato de Trabajo", tipo: "CONTRATO_TRABAJO", estado: "PENDIENTE", creadoEn: new Date(Date.now() - 10000000) },

  // Roberto Silva - Lead 7
  { id: "d10", leadId: "lead-7", leadNombre: "Roberto Silva", nombre: "Cédula de Identidad", tipo: "CEDULA_IDENTIDAD", estado: "APROBADO", creadoEn: new Date(Date.now() - 800000000) },
  { id: "d10b", leadId: "lead-7", leadNombre: "Roberto Silva", nombre: "Declaración de Renta", tipo: "DECLARACION_RENTA", estado: "APROBADO", creadoEn: new Date(Date.now() - 750000000) },
  { id: "d10c", leadId: "lead-7", leadNombre: "Roberto Silva", nombre: "Certificado AFP", tipo: "CERTIFICADO_AFP", estado: "APROBADO", creadoEn: new Date(Date.now() - 700000000) },
  { id: "d10d", leadId: "lead-7", leadNombre: "Roberto Silva", nombre: "Valorización", tipo: "VALORIZACION", estado: "APROBADO", creadoEn: new Date(Date.now() - 650000000) },
  { id: "d10e", leadId: "lead-7", leadNombre: "Roberto Silva", nombre: "Certificado de Pie", tipo: "CERTIFICADO_PIE", estado: "APROBADO", creadoEn: new Date(Date.now() - 600000000) },

  // Fernanda Rojas - Lead 8
  { id: "d11", leadId: "lead-8", leadNombre: "Fernanda Rojas", nombre: "Cédula de Identidad", tipo: "CEDULA_IDENTIDAD", estado: "APROBADO", creadoEn: new Date(Date.now() - 300000000) },
  { id: "d11b", leadId: "lead-8", leadNombre: "Fernanda Rojas", nombre: "Comprobante de Ingresos", tipo: "COMPROBANTE_INGRESOS", estado: "EN_REVISION", creadoEn: new Date(Date.now() - 250000000) },
  { id: "d11c", leadId: "lead-8", leadNombre: "Fernanda Rojas", nombre: "Certificado AFP", tipo: "CERTIFICADO_AFP", estado: "PENDIENTE", creadoEn: new Date(Date.now() - 50000000) },
];

// Datos mock para Usuarios
export const USUARIOS_MOCK: Usuario[] = [
  { id: "u1", nombre: "Super", apellido: "Admin", email: "admin@tuhipotecafacil.cl", telefono: "+56 9 9999 9999", rol: "SUPER_ADMIN", estado: "ACTIVO", ultimoAcceso: new Date(Date.now() - 3600000), creadoEn: new Date("2024-01-01"), doisFA: true },
  { id: "u2", nombre: "Andrés", apellido: "Pérez", email: "andres.perez@tuhipotecafacil.cl", telefono: "+56 9 1234 5678", rol: "ADMIN", estado: "ACTIVO", ultimoAcceso: new Date(Date.now() - 7200000), creadoEn: new Date("2024-02-15"), creadoPor: "u1", doisFA: true },
  { id: "u3", nombre: "Carolina", apellido: "Muñoz", email: "carolina.munoz@tuhipotecafacil.cl", telefono: "+56 9 2345 6789", rol: "GERENTE", estado: "ACTIVO", ultimoAcceso: new Date(Date.now() - 86400000), creadoEn: new Date("2024-03-10"), creadoPor: "u1" },
  { id: "u4", nombre: "Diego", apellido: "Silva", email: "diego.silva@tuhipotecafacil.cl", telefono: "+56 9 3456 7890", rol: "AGENTE", estado: "ACTIVO", ultimoAcceso: new Date(Date.now() - 172800000), creadoEn: new Date("2024-04-05"), creadoPor: "u2" },
  { id: "u5", nombre: "Valentina", apellido: "Torres", email: "valentina.torres@tuhipotecafacil.cl", telefono: "+56 9 4567 8901", rol: "AGENTE", estado: "ACTIVO", ultimoAcceso: new Date(Date.now() - 259200000), creadoEn: new Date("2024-05-20"), creadoPor: "u2" },
  { id: "u6", nombre: "Javier", apellido: "Morales", email: "javier.morales@tuhipotecafacil.cl", telefono: "+56 9 5678 9012", rol: "AGENTE", estado: "SUSPENDIDO", ultimoAcceso: new Date(Date.now() - 604800000), creadoEn: new Date("2024-06-15"), creadoPor: "u3", suspendidoHasta: new Date(Date.now() + 2592000000) },
  { id: "u7", nombre: "Ana", apellido: "Torres", email: "ana.torres@tuhipotecafacil.cl", telefono: "+56 9 6789 0123", rol: "AGENTE", estado: "INACTIVO", ultimoAcceso: new Date(Date.now() - 2592000000), creadoEn: new Date("2024-07-01"), creadoPor: "u3" },
  { id: "u8", nombre: "Roberto", apellido: "Silva", email: "roberto.silva@tuhipotecafacil.cl", telefono: "+56 9 7890 1234", rol: "GERENTE", estado: "ACTIVO", ultimoAcceso: new Date(Date.now() - 43200000), creadoEn: new Date("2024-08-10"), creadoPor: "u1", doisFA: true },
];

// Datos mock para Auditoría
export const AUDITORIA_MOCK: RegistroAuditoria[] = [
  { id: "a1", usuarioId: "u1", usuarioNombre: "Super Admin", accion: "LOGIN", modulo: "Sistema", ip: "192.168.1.100", navegador: "Chrome 120", dispositivo: "Desktop", fecha: new Date(Date.now() - 300000) },
  { id: "a2", usuarioId: "u2", usuarioNombre: "Andrés Pérez", accion: "CREAR", modulo: "Leads", registroId: "lead-100", registroNombre: "María González", ip: "192.168.1.101", navegador: "Chrome 120", dispositivo: "Desktop", fecha: new Date(Date.now() - 600000) },
  { id: "a3", usuarioId: "u3", usuarioNombre: "Carolina Muñoz", accion: "EDITAR", modulo: "Pipeline", registroId: "etapa-3", registroNombre: "Contactado", valorAnterior: "Etapa anterior", valorNuevo: "Etapa modificada", ip: "192.168.1.102", navegador: "Firefox 121", dispositivo: "Desktop", fecha: new Date(Date.now() - 900000) },
  { id: "a4", usuarioId: "u1", usuarioNombre: "Super Admin", accion: "CAMBIO_ROL", modulo: "Usuarios", registroId: "u6", registroNombre: "Javier Morales", valorAnterior: "Agente", valorNuevo: "Suspendido", motivo: "Inactividad prolongada", ip: "192.168.1.100", navegador: "Chrome 120", dispositivo: "Desktop", fecha: new Date(Date.now() - 1800000) },
  { id: "a5", usuarioId: "u4", usuarioNombre: "Diego Silva", accion: "CREAR", modulo: "Documentos", registroId: "doc-50", registroNombre: "Certificado AFP", ip: "192.168.1.103", navegador: "Safari 17", dispositivo: "iPhone", fecha: new Date(Date.now() - 3600000) },
  { id: "a6", usuarioId: "u2", usuarioNombre: "Andrés Pérez", accion: "ELIMINAR", modulo: "Leads", registroId: "lead-95", registroNombre: "Lead descartado", motivo: "Datos duplicados", ip: "192.168.1.101", navegador: "Chrome 120", dispositivo: "Desktop", fecha: new Date(Date.now() - 7200000) },
  { id: "a7", usuarioId: "u1", usuarioNombre: "Super Admin", accion: "EXPORTAR", modulo: "Reportes", motivo: "Exportación mensual", ip: "192.168.1.100", navegador: "Chrome 120", dispositivo: "Desktop", fecha: new Date(Date.now() - 14400000) },
  { id: "a8", usuarioId: "u8", usuarioNombre: "Roberto Silva", accion: "LOGIN", modulo: "Sistema", ip: "192.168.1.104", navegador: "Edge 120", dispositivo: "Desktop", fecha: new Date(Date.now() - 28800000) },
];
