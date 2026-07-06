import type { Conversacion, Mensaje, UsuarioOnline } from "@/tipos/conversaciones";
import { USUARIOS_MOCK } from "./mock";

function fecha(horasAtras: number): Date {
  return new Date(Date.now() - horasAtras * 3600000);
}

function fechaMin(minutosAtras: number): Date {
  return new Date(Date.now() - minutosAtras * 60000);
}

export const USUARIOS_ONLINE: UsuarioOnline[] = [
  { usuarioId: "u1", estado: "ONLINE", ultimaActividad: fechaMin(1) },
  { usuarioId: "u2", estado: "ONLINE", ultimaActividad: fechaMin(2) },
  { usuarioId: "u3", estado: "OCUPADO", ultimaActividad: fechaMin(5) },
  { usuarioId: "u4", estado: "ONLINE", ultimaActividad: fechaMin(1) },
  { usuarioId: "u5", estado: "AUSENTE", ultimaActividad: fechaMin(30) },
  { usuarioId: "u6", estado: "OFFLINE", ultimaActividad: fecha(48) },
  { usuarioId: "u7", estado: "OFFLINE", ultimaActividad: fecha(72) },
  { usuarioId: "u8", estado: "ONLINE", ultimaActividad: fechaMin(3) },
];

export const CONVERSACIONES_MOCK: Conversacion[] = [
  {
    id: "c1",
    nombre: "General",
    tipo: "CANAL",
    participantes: USUARIOS_MOCK.map((u) => u.id),
    mensajesNoLeidos: 3,
    creadoEn: new Date("2024-01-01"),
    creadoPor: "u1",
    descripcion: "Canal general de comunicaciones del equipo",
    esFijo: true,
  },
  {
    id: "c2",
    nombre: "Ventas Q3",
    tipo: "CANAL",
    participantes: ["u1", "u2", "u3", "u4", "u5"],
    mensajesNoLeidos: 0,
    creadoEn: new Date("2024-06-01"),
    creadoPor: "u1",
    descripcion: "Seguimiento de ventas del tercer trimestre",
    esFijo: true,
  },
  {
    id: "c3",
    nombre: "Soporte Técnico",
    tipo: "CANAL",
    participantes: ["u1", "u2", "u8"],
    mensajesNoLeidos: 1,
    creadoEn: new Date("2024-03-15"),
    creadoPor: "u1",
    descripcion: "Incidencias y soporte del sistema",
    esFijo: true,
  },
  {
    id: "c4",
    nombre: "Andrés Pérez",
    tipo: "DIRECTO",
    participantes: ["u1", "u2"],
    mensajesNoLeidos: 2,
    creadoEn: new Date("2024-02-15"),
    creadoPor: "u1",
  },
  {
    id: "c5",
    nombre: "Carolina Muñoz",
    tipo: "DIRECTO",
    participantes: ["u1", "u3"],
    mensajesNoLeidos: 0,
    creadoEn: new Date("2024-03-10"),
    creadoPor: "u1",
  },
  {
    id: "c6",
    nombre: "Diego Silva",
    tipo: "DIRECTO",
    participantes: ["u1", "u4"],
    mensajesNoLeidos: 0,
    creadoEn: new Date("2024-04-05"),
    creadoPor: "u1",
  },
  {
    id: "c7",
    nombre: "Ejecutivos",
    tipo: "GRUPO",
    participantes: ["u2", "u3", "u4", "u5", "u8"],
    mensajesNoLeidos: 5,
    creadoEn: new Date("2024-05-01"),
    creadoPor: "u2",
    descripcion: "Grupo de ejecutivos comerciales",
  },
  {
    id: "c8",
    nombre: "Roberto Silva",
    tipo: "DIRECTO",
    participantes: ["u1", "u8"],
    mensajesNoLeidos: 0,
    creadoEn: new Date("2024-08-10"),
    creadoPor: "u1",
  },
];

const now = Date.now();

export const MENSAJES_MOCK: Record<string, Mensaje[]> = {
  c1: [
    { id: "m1-1", conversacionId: "c1", remitenteId: "u1", remitenteNombre: "Super Admin", contenido: "Buenos días equipo. Recuerden que hoy es el cierre del reporte mensual.", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 7200000) },
    { id: "m1-2", conversacionId: "c1", remitenteId: "u2", remitenteNombre: "Andrés Pérez", contenido: "Buenos días. Ya estoy revisando los números del pipeline.", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 6800000) },
    { id: "m1-3", conversacionId: "c1", remitenteId: "u3", remitenteNombre: "Carolina Muñoz", contenido: "Yo estoy con los documentos pendientes. Tenemos 12 carpetas que necesitan revisión.", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 6500000) },
    { id: "m1-4", conversacionId: "c1", remitenteId: "u4", remitenteNombre: "Diego Silva", contenido: "Genial. Yo ya actualicé el pipeline con los 3 leads nuevos de ayer.", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 5000000) },
    { id: "m1-5", conversacionId: "c1", remitenteId: "u1", remitenteNombre: "Super Admin", contenido: "Perfecto. Las métricas de este mes van muy bien. Tasa de conversión subió a 24.6%.", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 3600000) },
    { id: "m1-6", conversacionId: "c1", remitenteId: "u8", remitenteNombre: "Roberto Silva", contenido: "Excelente noticia. ¿Podemos revisar el ranking de ejecutivos en la reunión de hoy?", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 2400000) },
    { id: "m1-7", conversacionId: "c1", remitenteId: "u2", remitenteNombre: "Andrés Pérez", contenido: "Sí, estoy preparando los datos. Tenemos 312 créditos aprobados este mes.", tipo: "TEXTO", estado: "ENTREGADO", creadoEn: new Date(now - 1200000) },
    { id: "m1-8", conversacionId: "c1", remitenteId: "u5", remitenteNombre: "Valentina Torres", contenido: "Yo también quiero revisar mi pipeline. Tengo 5 leads en evaluación bancaria.", tipo: "TEXTO", estado: "ENTREGADO", creadoEn: new Date(now - 600000) },
    { id: "m1-9", conversacionId: "c1", remitenteId: "u1", remitenteNombre: "Super Admin", contenido: "Perfecto. Reunión a las 15:00. Preparen sus reportes.", tipo: "TEXTO", estado: "ENVIADO", creadoEn: new Date(now - 300000) },
  ],
  c4: [
    { id: "m4-1", conversacionId: "c4", remitenteId: "u1", remitenteNombre: "Super Admin", contenido: "Andrés, ¿cómo va el lead de María González? Vi que está en evaluación bancaria.", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 86400000) },
    { id: "m4-2", conversacionId: "c4", remitenteId: "u2", remitenteNombre: "Andrés Pérez", contenido: "Va muy bien. Ya tiene documentos aprobados y está esperando respuesta del Banco de Chile.", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 82800000) },
    { id: "m4-3", conversacionId: "c4", remitenteId: "u1", remitenteNombre: "Super Admin", contenido: "Perfecto. Mantén el seguimiento. Es un monto importante.", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 79200000) },
    { id: "m4-4", conversacionId: "c4", remitenteId: "u2", remitenteNombre: "Andrés Pérez", contenido: "Entendido. Ya agendé una llamada de seguimiento para mañana.", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 75600000) },
    { id: "m4-5", conversacionId: "c4", remitenteId: "u2", remitenteNombre: "Andrés Pérez", contenido: "Actualización: El banco respondió. Están revisando la documentación adicional.", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 43200000) },
    { id: "m4-6", conversacionId: "c4", remitenteId: "u1", remitenteNombre: "Super Admin", contenido: "Bien. ¿Necesita algún documento extra?", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 39600000) },
    { id: "m4-7", conversacionId: "c4", remitenteId: "u2", remitenteNombre: "Andrés Pérez", contenido: "No por ahora. El cliente está muy colaborativo. Creo que esta semana saldrá la preaprobación.", tipo: "TEXTO", estado: "ENTREGADO", creadoEn: new Date(now - 36000000) },
    { id: "m4-8", conversacionId: "c4", remitenteId: "u1", remitenteNombre: "Super Admin", contenido: "Excelente. Si necesitas algo, avísame.", tipo: "TEXTO", estado: "ENTREGADO", creadoEn: new Date(now - 7200000) },
  ],
  c7: [
    { id: "m7-1", conversacionId: "c7", remitenteId: "u2", remitenteNombre: "Andrés Pérez", contenido: "Hola equipo. ¿Cómo van con sus leads este mes?", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 172800000) },
    { id: "m7-2", conversacionId: "c7", remitenteId: "u4", remitenteNombre: "Diego Silva", contenido: "Yo voy bien. Ya cerré 2 créditos esta semana.", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 169200000) },
    { id: "m7-3", conversacionId: "c7", remitenteId: "u5", remitenteNombre: "Valentina Torres", contenido: "Yo también. Tengo 3 leads en evaluación. El banco Santander está respondiendo rápido.", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 165600000) },
    { id: "m7-4", conversacionId: "c7", remitenteId: "u3", remitenteNombre: "Carolina Muñoz", contenido: "Yo estoy revisando documentación. Tenemos muchas carpetas pendientes.", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 162000000) },
    { id: "m7-5", conversacionId: "c7", remitenteId: "u8", remitenteNombre: "Roberto Silva", contenido: "Estoy trabajando con un grupo de clientes nuevos. El programa de referidos está funcionando.", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 158400000) },
    { id: "m7-6", conversacionId: "c7", remitenteId: "u2", remitenteNombre: "Andrés Pérez", contenido: "Genial. ¿Podemos hacer una reunión esta semana para revisar el pipeline?", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 86400000) },
    { id: "m7-7", conversacionId: "c7", remitenteId: "u4", remitenteNombre: "Diego Silva", contenido: "Sí, estoy disponible mañana por la tarde.", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 82800000) },
    { id: "m7-8", conversacionId: "c7", remitenteId: "u5", remitenteNombre: "Valentina Torres", contenido: "Yo también. ¿A las 16:00?", tipo: "TEXTO", estado: "LEIDO", creadoEn: new Date(now - 79200000) },
    { id: "m7-9", conversacionId: "c7", remitenteId: "u3", remitenteNombre: "Carolina Muñoz", contenido: "A las 16:00 me viene perfecto.", tipo: "TEXTO", estado: "ENTREGADO", creadoEn: new Date(now - 43200000) },
    { id: "m7-10", conversacionId: "c7", remitenteId: "u8", remitenteNombre: "Roberto Silva", contenido: "Confirmado. Prepararé los datos de referidos.", tipo: "TEXTO", estado: "ENTREGADO", creadoEn: new Date(now - 39600000) },
    { id: "m7-11", conversacionId: "c7", remitenteId: "u2", remitenteNombre: "Andrés Pérez", contenido: "Perfecto. Nos vemos a las 16:00.", tipo: "TEXTO", estado: "ENVIADO", creadoEn: new Date(now - 36000000) },
  ],
};

export function getUsuarioById(id: string) {
  return USUARIOS_MOCK.find((u) => u.id === id);
}

export function getEstadoOnline(usuarioId: string): UsuarioOnline["estado"] {
  const online = USUARIOS_ONLINE.find((u) => u.usuarioId === usuarioId);
  return online?.estado ?? "OFFLINE";
}

export function getAvatarColor(nombre: string): string {
  const colores = [
    "from-blue-500 to-blue-600",
    "from-emerald-500 to-emerald-600",
    "from-violet-500 to-violet-600",
    "from-amber-500 to-amber-600",
    "from-rose-500 to-rose-600",
    "from-cyan-500 to-cyan-600",
    "from-indigo-500 to-indigo-600",
    "from-teal-500 to-teal-600",
  ];
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colores[Math.abs(hash) % colores.length];
}

export function getIniciales(nombre: string): string {
  return nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatTime(fecha: Date): string {
  const now = new Date();
  const diff = now.getTime() - fecha.getTime();
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);

  if (minutos < 1) return "Ahora";
  if (minutos < 60) return `${minutos}m`;
  if (horas < 24) return `${horas}h`;
  if (dias < 7) return `${dias}d`;
  return fecha.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

export function formatMensajeTime(fecha: Date): string {
  return fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

export function formatFullDate(fecha: Date): string {
  const now = new Date();
  const diff = now.getTime() - fecha.getTime();
  const dias = Math.floor(diff / 86400000);

  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return fecha.toLocaleDateString("es-CL", { weekday: "long" });
  return fecha.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
}
