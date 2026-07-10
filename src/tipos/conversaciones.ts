export type TipoConversacion = "DIRECTO" | "GRUPO" | "CANAL";

export type EstadoMensaje = "ENVIADO" | "ENTREGADO" | "LEIDO";

export interface Mensaje {
  id: string;
  conversacionId: string;
  remitenteId: string;
  remitenteNombre: string;
  remitenteAvatar?: string;
  contenido: string;
  tipo: "TEXTO" | "ARCHIVO" | "IMAGEN" | "SISTEMA";
  estado: EstadoMensaje;
  archivoUrl?: string;
  creadoEn: Date;
  editadoEn?: Date;
  respondiendoA?: string;
  reacciones?: Record<string, string[]>;
}

export interface Conversacion {
  id: string;
  nombre: string;
  tipo: TipoConversacion;
  participantes: string[];
  ultimoMensaje?: Mensaje;
  mensajesNoLeidos: number;
  creadoEn: Date;
  creadoPor: string;
  avatar?: string;
  descripcion?: string;
  esFijo?: boolean;
}

export interface UsuarioOnline {
  usuarioId: string;
  estado: "ONLINE" | "OCUPADO" | "AUSENTE" | "OFFLINE";
  ultimaActividad: Date;
}

export const ESTADO_ONLINE_CONFIG: Record<UsuarioOnline["estado"], { label: string; color: string }> = {
  ONLINE: { label: "En línea", color: "bg-emerald-500" },
  OCUPADO: { label: "Ocupado", color: "bg-red-500" },
  AUSENTE: { label: "Ausente", color: "bg-amber-500" },
  OFFLINE: { label: "Desconectado", color: "bg-slate-400" },
};
