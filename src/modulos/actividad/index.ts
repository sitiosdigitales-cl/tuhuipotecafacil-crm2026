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
    fetch(`/api/tareas${qs ? `?${qs}` : ""}`, { credentials: "include" }).then(r => r.json()),
    fetch(`/api/eventos${qs ? `?${qs}` : ""}`, { credentials: "include" }).then(r => r.json()),
    fetch(`/api/recordatorios${qs ? `?${qs}` : ""}`, { credentials: "include" }).then(r => r.json()),
  ]);

  const actividades: Actividad[] = [];

  // Mapear tareas
  (tareas.data || []).forEach((t: any) => {
    actividades.push({
      id: t.id,
      tipo: "tarea",
      titulo: t.titulo,
      descripcion: t.descripcion,
      leadId: t.leadid,
      leadNombre: t.leadnombre,
      fecha: t.fechavencimiento || t.creadoen,
      estado: t.estado === "COMPLETADA" ? "completada" : t.estado === "VENCIDA" ? "vencida" : "pendiente",
      prioridad: t.prioridad?.toLowerCase(),
      asignadoA: t.asignadoa,
      created_at: t.creadoen,
    });
  });

  // Mapear eventos
  (eventos.data || []).forEach((e: any) => {
    actividades.push({
      id: e.id,
      tipo: "reunion",
      titulo: e.titulo,
      descripcion: e.descripcion,
      leadId: e.leadid,
      fecha: e.fecha,
      hora: e.hora,
      estado: e.estado === "COMPLETADO" ? "completada" : "pendiente",
      created_at: e.creadoen,
    });
  });

  // Mapear recordatorios
  (recordatorios.data || []).forEach((r: any) => {
    actividades.push({
      id: r.id,
      tipo: "recordatorio",
      titulo: r.titulo,
      descripcion: r.descripcion,
      leadId: r.leadid,
      fecha: r.fecha,
      estado: r.completado ? "completada" : "pendiente",
      created_at: r.creadoen,
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
