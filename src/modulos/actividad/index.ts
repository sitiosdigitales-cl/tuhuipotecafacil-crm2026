/**
 * Módulo Centro de Actividad
 * 
 * Unifica tareas, agenda, conversaciones y notificaciones
 * en un solo panel de trabajo diario.
 */

// ─── Tipos de actividad ───
export type TipoActividad = 
  | "tarea"
  | "llamada"
  | "correo"
  | "whatsapp"
  | "reunion"
  | "nota"
  | "documento"
  | "recordatorio";

export interface Actividad {
  id: string;
  tipo: TipoActividad;
  titulo: string;
  descripcion?: string;
  leadId?: string;
  leadNombre?: string;
  fecha: string;
  hora?: string;
  estado: "pendiente" | "completada" | "vencida";
  prioridad?: "baja" | "media" | "alta";
  asignadoA?: string;
  created_at: string;
}

interface RespuestaLista<T> {
  data?: T[];
}

interface TareaActividadApi {
  id: string;
  titulo: string;
  descripcion?: string;
  leadId?: string;
  leadid?: string;
  leadNombre?: string;
  leadnombre?: string;
  fechaVencimiento?: string;
  fechavencimiento?: string;
  estado?: string;
  prioridad?: string;
  asignadoA?: string;
  asignadoa?: string;
  creadoEn?: string;
  creadoen?: string;
}

interface EventoActividadApi {
  id: string;
  titulo: string;
  descripcion?: string;
  leadId?: string;
  leadid?: string;
  fecha: string;
  hora?: string;
  estado?: string;
  creadoEn?: string;
  creadoen?: string;
}

interface RecordatorioActividadApi {
  id: string;
  titulo: string;
  descripcion?: string;
  leadId?: string;
  leadid?: string;
  fecha: string;
  completado?: boolean;
  creadoEn?: string;
  creadoen?: string;
}

async function obtenerLista<T>(url: string): Promise<RespuestaLista<T>> {
  const respuesta = await fetch(url, { credentials: "include" });
  return respuesta.json();
}

function normalizarPrioridad(prioridad?: string): Actividad["prioridad"] {
  const valor = prioridad?.toLowerCase();
  return valor === "baja" || valor === "media" || valor === "alta" ? valor : undefined;
}

// ─── Configuración de tipos ───
export const TIPOS_ACTIVIDAD_CONFIG: Record<TipoActividad, { label: string; icono: string; color: string }> = {
  tarea: { label: "Tarea", icono: "CheckSquare", color: "#3B82F6" },
  llamada: { label: "Llamada", icono: "Phone", color: "#10B981" },
  correo: { label: "Correo", icono: "Mail", color: "#8B5CF6" },
  whatsapp: { label: "WhatsApp", icono: "MessageSquare", color: "#25D366" },
  reunion: { label: "Reunión", icono: "Calendar", color: "#F59E0B" },
  nota: { label: "Nota", icono: "FileText", color: "#64748B" },
  documento: { label: "Documento", icono: "Paperclip", color: "#EC4899" },
  recordatorio: { label: "Recordatorio", icono: "Bell", color: "#EF4444" },
};

// ─── Configuración de estados ───
export const ESTADOS_ACTIVIDAD = [
  { id: "pendiente", label: "Pendiente", color: "#F59E0B", icono: "Clock" },
  { id: "completada", label: "Completada", color: "#10B981", icono: "CheckCircle" },
  { id: "vencida", label: "Vencida", color: "#EF4444", icono: "AlertTriangle" },
] as const;

// ─── Funciones de servicio ───
export async function obtenerActividades(filtros?: { fecha?: string; leadId?: string; tipo?: TipoActividad }) {
  const params = new URLSearchParams();
  if (filtros?.fecha) params.set("fecha", filtros.fecha);
  if (filtros?.leadId) params.set("leadId", filtros.leadId);
  if (filtros?.tipo) params.set("tipo", filtros.tipo);
  const qs = params.toString();
  
  // Combinar tareas, eventos y recordatorios
  const [tareas, eventos, recordatorios] = await Promise.all([
    obtenerLista<TareaActividadApi>(`/api/tareas${qs ? `?${qs}` : ""}`),
    obtenerLista<EventoActividadApi>(`/api/eventos${qs ? `?${qs}` : ""}`),
    obtenerLista<RecordatorioActividadApi>(`/api/recordatorios${qs ? `?${qs}` : ""}`),
  ]);

  const actividades: Actividad[] = [];

  // Mapear tareas
  (tareas.data || []).forEach((tarea) => {
    const creadoEn = tarea.creadoEn || tarea.creadoen || "";
    actividades.push({
      id: tarea.id,
      tipo: "tarea",
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      leadId: tarea.leadId || tarea.leadid,
      leadNombre: tarea.leadNombre || tarea.leadnombre,
      fecha: tarea.fechaVencimiento || tarea.fechavencimiento || creadoEn,
      estado: tarea.estado === "COMPLETADA" ? "completada" : tarea.estado === "VENCIDA" ? "vencida" : "pendiente",
      prioridad: normalizarPrioridad(tarea.prioridad),
      asignadoA: tarea.asignadoA || tarea.asignadoa,
      created_at: creadoEn,
    });
  });

  // Mapear eventos
  (eventos.data || []).forEach((evento) => {
    actividades.push({
      id: evento.id,
      tipo: "reunion",
      titulo: evento.titulo,
      descripcion: evento.descripcion,
      leadId: evento.leadId || evento.leadid,
      fecha: evento.fecha,
      hora: evento.hora,
      estado: evento.estado === "COMPLETADO" ? "completada" : "pendiente",
      created_at: evento.creadoEn || evento.creadoen || "",
    });
  });

  // Mapear recordatorios
  (recordatorios.data || []).forEach((recordatorio) => {
    actividades.push({
      id: recordatorio.id,
      tipo: "recordatorio",
      titulo: recordatorio.titulo,
      descripcion: recordatorio.descripcion,
      leadId: recordatorio.leadId || recordatorio.leadid,
      fecha: recordatorio.fecha,
      estado: recordatorio.completado ? "completada" : "pendiente",
      created_at: recordatorio.creadoEn || recordatorio.creadoen || "",
    });
  });

  // Ordenar por fecha
  actividades.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return actividades;
}

export async function obtenerActividadHoy() {
  const hoy = new Date().toISOString().split("T")[0];
  return obtenerActividades({ fecha: hoy });
}

export async function completarActividad(id: string, tipo: TipoActividad) {
  const endpoint = tipo === "tarea" ? "/api/tareas" : "/api/recordatorios";
  return fetch(`${endpoint}/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: "COMPLETADA", completado: true }),
  }).then(r => r.json());
}
