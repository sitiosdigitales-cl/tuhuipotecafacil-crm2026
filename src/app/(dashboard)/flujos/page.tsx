"use client";

import { useState, useMemo } from "react";
import {
  Workflow,
  Zap,
  Mail,
  MessageSquare,
  Phone,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  FileText,
  Calendar,
  Bell,
  ArrowRight,
  ArrowDown,
  Plus,
  Search,
  Play,
  Pause,
  Settings,
  Edit,
  Eye,
  Copy,
  GitBranch,
  Target,
  Send,
  Smartphone,
  Tag,
  User,
  DollarSign,
  TrendingUp,
  ChevronRight,
  BarChart3,
  Activity,
  RefreshCw,
  Layers,
  GitMerge,
  Timer,
  X,
  Trash2,
} from "lucide-react";

// Tipos de nodos disponibles
const TIPOS_NODOS = [
  { id: "trigger", nombre: "Trigger", icono: Zap, color: "#F59E0B", descripcion: "Evento que inicia el flujo" },
  { id: "condicion", nombre: "Condición", icono: GitBranch, color: "#8B5CF6", descripcion: "Evaluar condición" },
  { id: "email", nombre: "Email", icono: Mail, color: "#3B82F6", descripcion: "Enviar email" },
  { id: "whatsapp", nombre: "WhatsApp", icono: MessageSquare, color: "#22C55E", descripcion: "Enviar mensaje" },
  { id: "sms", nombre: "SMS", icono: Smartphone, color: "#EC4899", descripcion: "Enviar SMS" },
  { id: "llamada", nombre: "Llamada", icono: Phone, color: "#10B981", descripcion: "Registrar llamada" },
  { id: "espera", nombre: "Espera", icono: Clock, color: "#6366F1", descripcion: "Esperar tiempo" },
  { id: "tarea", nombre: "Tarea", icono: CheckCircle, color: "#14B8A6", descripcion: "Crear tarea" },
  { id: "notificacion", nombre: "Notificación", icono: Bell, color: "#F59E0B", descripcion: "Enviar notificación" },
  { id: "etiqueta", nombre: "Etiqueta", icono: Tag, color: "#EC4899", descripcion: "Agregar etiqueta" },
  { id: "asignar", nombre: "Asignar", icono: User, color: "#8B5CF6", descripcion: "Asignar ejecutivo" },
  { id: "fin", nombre: "Fin", icono: CheckCircle, color: "#10B981", descripcion: "Finalizar flujo" },
];

// Triggers disponibles
const TRIGGERS_DISPONIBLES = [
  { id: "nuevo_lead", nombre: "Nuevo lead registrado", icono: Users, color: "#3B82F6" },
  { id: "cambio_etapa", nombre: "Cambio de etapa", icono: ArrowRight, color: "#8B5CF6" },
  { id: "llamada_registrada", nombre: "Llamada registrada", icono: Phone, color: "#10B981" },
  { id: "email_recibido", nombre: "Email recibido", icono: Mail, color: "#3B82F6" },
  { id: "whatsapp_recibido", nombre: "WhatsApp recibido", icono: MessageSquare, color: "#22C55E" },
  { id: "documento_subido", nombre: "Documento subido", icono: FileText, color: "#8B5CF6" },
  { id: "tarea_vencida", nombre: "Tarea vencida", icono: AlertTriangle, color: "#EF4444" },
  { id: "credito_aprobado", nombre: "Crédito aprobado", icono: CheckCircle, color: "#10B981" },
  { id: "lead_inactivo", nombre: "Lead inactivo 30+ días", icono: Clock, color: "#F59E0B" },
  { id: "documento_pendiente", nombre: "Documento pendiente", icono: FileText, color: "#F97316" },
];

// Plantillas disponibles para usar en flujos
const PLANTILLAS_DISPONIBLES = [
  { id: "p1", nombre: "Bienvenida Nuevo Lead", tipo: "EMAIL" },
  { id: "p2", nombre: "Recordatorio Documentos", tipo: "EMAIL" },
  { id: "p3", nombre: "Felicitación Crédito", tipo: "EMAIL" },
  { id: "p4", nombre: "Seguimiento Post Llamada", tipo: "EMAIL" },
  { id: "p5", nombre: "Saludo WhatsApp", tipo: "WHATSAPP" },
  { id: "p6", nombre: "Recordatorio WhatsApp", tipo: "WHATSAPP" },
  { id: "p7", nombre: "Felicitación WhatsApp", tipo: "WHATSAPP" },
  { id: "p8", nombre: "SMS Recordatorio", tipo: "SMS" },
];

// Datos detallados de flujos
const FLUJOS_DETALLE = [
  {
    id: "f1",
    nombre: "Bienvenida Nuevo Lead",
    descripcion: "Serie automatizada de emails y mensajes para dar la bienvenida a nuevos leads que ingresan al sistema",
    estado: "ACTIVO",
    tipo: "ONBOARDING",
    color: "#3B82F6",
    creadoPor: "Andrés Pérez",
    creadoEn: new Date(2026, 5, 4),
    ultimoInicio: new Date(2026, 6, 4, 9, 0),
    ejecuciones: 1247,
    exitosas: 1180,
    fallidas: 67,
    tasaExito: 94.6,
    tiempoPromedio: "2.3 días",
    conversiones: 156,
    tasaConversion: 12.5,
    trigger: {
      nombre: "Nuevo lead registrado",
      icono: Users,
      color: "#3B82F6",
    },
    pasos: [
      { id: 1, tipo: "email", nombre: "Email de bienvenida", delay: 0, plantilla: "Bienvenida Nuevo Lead", estado: "completado" },
      { id: 2, tipo: "espera", nombre: "Esperar 24 horas", delay: 1440, estado: "completado" },
      { id: 3, tipo: "whatsapp", nombre: "Mensaje de seguimiento", delay: 0, plantilla: "Saludo WhatsApp", estado: "completado" },
      { id: 4, tipo: "espera", nombre: "Esperar 48 horas", delay: 2880, estado: "completado" },
      { id: 5, tipo: "tarea", nombre: "Crear tarea de llamada", delay: 0, estado: "completado" },
    ],
    actividad: [
      { fecha: new Date(2026, 6, 4, 9, 0), accion: "Flujo ejecutado para María González", tipo: "ejecucion" },
      { fecha: new Date(2026, 6, 4, 6, 0), accion: "Flujo ejecutado para Pedro Sánchez", tipo: "ejecucion" },
      { fecha: new Date(2026, 6, 4, 3, 0), accion: "Plantilla actualizada", tipo: "cambio" },
    ],
  },
  {
    id: "f2",
    nombre: "Seguimiento Post Llamada",
    descripcion: "Enviar WhatsApp de seguimiento automáticamente después de cada llamada registrada en el sistema",
    estado: "ACTIVO",
    tipo: "SEGUIMIENTO",
    color: "#22C55E",
    creadoPor: "Carolina Muñoz",
    creadoEn: new Date(2026, 5, 9),
    ultimoInicio: new Date(2026, 6, 4, 10, 0),
    ejecuciones: 856,
    exitosas: 812,
    fallidas: 44,
    tasaExito: 94.9,
    tiempoPromedio: "1.5 días",
    conversiones: 89,
    tasaConversion: 10.4,
    trigger: {
      nombre: "Llamada registrada",
      icono: Phone,
      color: "#10B981",
    },
    pasos: [
      { id: 1, tipo: "espera", nombre: "Esperar 1 hora", delay: 60, estado: "completado" },
      { id: 2, tipo: "whatsapp", nombre: "Mensaje de seguimiento", delay: 0, plantilla: "Seguimiento Post Llamada", estado: "completado" },
      { id: 3, tipo: "tarea", nombre: "Crear tarea de seguimiento", delay: 0, estado: "completado" },
    ],
    actividad: [
      { fecha: new Date(2026, 6, 4, 10, 0), accion: "Flujo ejecutado para Ana Torres", tipo: "ejecucion" },
      { fecha: new Date(2026, 6, 4, 7, 0), accion: "Flujo ejecutado para Juan Pérez", tipo: "ejecucion" },
    ],
  },
  {
    id: "f3",
    nombre: "Reactivación Leads Fríos",
    descripcion: "Serie de 3 emails y 1 WhatsApp para reactivar leads que no han tenido contacto en los últimos 30 días",
    estado: "ACTIVO",
    tipo: "REACTIVACION",
    color: "#F59E0B",
    creadoPor: "Diego Silva",
    creadoEn: new Date(2026, 5, 14),
    ultimoInicio: new Date(2026, 6, 4, 8, 0),
    ejecuciones: 534,
    exitosas: 489,
    fallidas: 45,
    tasaExito: 91.6,
    tiempoPromedio: "7 días",
    conversiones: 67,
    tasaConversion: 12.5,
    trigger: {
      nombre: "Lead sin contacto 30+ días",
      icono: Clock,
      color: "#F59E0B",
    },
    pasos: [
      { id: 1, tipo: "email", nombre: "Primer email de reactivación", delay: 0, plantilla: "Reactivación Lead", estado: "completado" },
      { id: 2, tipo: "espera", nombre: "Esperar 3 días", delay: 4320, estado: "completado" },
      { id: 3, tipo: "email", nombre: "Segundo email", delay: 0, plantilla: "Reactivación Lead", estado: "completado" },
      { id: 4, tipo: "espera", nombre: "Esperar 3 días", delay: 4320, estado: "completado" },
      { id: 5, tipo: "whatsapp", nombre: "Mensaje final WhatsApp", delay: 0, plantilla: "Reactivación WhatsApp", estado: "completado" },
      { id: 6, tipo: "etiqueta", nombre: "Marcar como reactivado", delay: 0, estado: "completado" },
      { id: 7, tipo: "fin", nombre: "Fin del flujo", delay: 0, estado: "completado" },
    ],
    actividad: [
      { fecha: new Date(2026, 6, 4, 8, 0), accion: "12 leads reactivados", tipo: "ejecucion" },
      { fecha: new Date(2026, 6, 3, 11, 0), accion: "8 leads reactivados", tipo: "ejecucion" },
    ],
  },
  {
    id: "f4",
    nombre: "Recordatorio Documentos Pendientes",
    descripcion: "Enviar recordatorios automáticos cada 3 días mientras el cliente tenga documentos pendientes de subir",
    estado: "ACTIVO",
    tipo: "DOCUMENTOS",
    color: "#8B5CF6",
    creadoPor: "Valentina Torres",
    creadoEn: new Date(2026, 5, 19),
    ultimoInicio: new Date(2026, 6, 3, 23, 0),
    ejecuciones: 423,
    exitosas: 410,
    fallidas: 13,
    tasaExito: 96.9,
    tiempoPromedio: "4.5 días",
    conversiones: 98,
    tasaConversion: 23.2,
    trigger: {
      nombre: "Documentos pendientes",
      icono: FileText,
      color: "#8B5CF6",
    },
    pasos: [
      { id: 1, tipo: "email", nombre: "Primer recordatorio", delay: 0, plantilla: "Recordatorio Documentos", estado: "completado" },
      { id: 2, tipo: "espera", nombre: "Esperar 3 días", delay: 4320, estado: "completado" },
      { id: 3, tipo: "whatsapp", nombre: "Segundo recordatorio", delay: 0, plantilla: "Recordatorio WhatsApp", estado: "completado" },
      { id: 4, tipo: "tarea", nombre: "Crear tarea de seguimiento", delay: 0, estado: "completado" },
    ],
    actividad: [
      { fecha: new Date(2026, 6, 3, 23, 0), accion: "Recordatorio enviado a 5 clientes", tipo: "ejecucion" },
    ],
  },
  {
    id: "f5",
    nombre: "Felicitación Crédito Aprobado",
    descripcion: "Enviar felicitación al cliente por WhatsApp y email cuando su crédito hipotecario es aprobado por el banco",
    estado: "ACTIVO",
    tipo: "APROBACION",
    color: "#10B981",
    creadoPor: "Javier Morales",
    creadoEn: new Date(2026, 4, 20),
    ultimoInicio: new Date(2026, 6, 4, 6, 0),
    ejecuciones: 189,
    exitosas: 189,
    fallidas: 0,
    tasaExito: 100,
    tiempoPromedio: "Instantáneo",
    conversiones: 189,
    tasaConversion: 100,
    trigger: {
      nombre: "Crédito aprobado",
      icono: CheckCircle,
      color: "#10B981",
    },
    pasos: [
      { id: 1, tipo: "whatsapp", nombre: "Felicitación WhatsApp", delay: 0, plantilla: "Felicitación WhatsApp", estado: "completado" },
      { id: 2, tipo: "email", nombre: "Felicitación Email", delay: 0, plantilla: "Felicitación Crédito Aprobado", estado: "completado" },
    ],
    actividad: [
      { fecha: new Date(2026, 6, 4, 6, 0), accion: "Felicitación enviada a Roberto Silva", tipo: "ejecucion" },
    ],
  },
  {
    id: "f6",
    nombre: "Alerta Tarea Vencida",
    descripcion: "Notificar al ejecutivo responsable y al gerente cuando una tarea está vencida más de 24 horas",
    estado: "PAUSADO",
    tipo: "NOTIFICACION",
    color: "#EF4444",
    creadoPor: "Andrés Pérez",
    creadoEn: new Date(2026, 4, 5),
    ultimoInicio: new Date(2026, 6, 3, 11, 0),
    ejecuciones: 312,
    exitosas: 312,
    fallidas: 0,
    tasaExito: 100,
    tiempoPromedio: "Instantáneo",
    conversiones: 0,
    tasaConversion: 0,
    trigger: {
      nombre: "Tarea vencida",
      icono: AlertTriangle,
      color: "#EF4444",
    },
    pasos: [
      { id: 1, tipo: "notificacion", nombre: "Notificar ejecutivo", delay: 0, estado: "completado" },
      { id: 2, tipo: "notificacion", nombre: "Notificar gerente", delay: 60, estado: "completado" },
    ],
    actividad: [
      { fecha: new Date(2026, 6, 3, 11, 0), accion: "Alerta enviada por tarea de Diego Díaz", tipo: "ejecucion" },
    ],
  },
  {
    id: "f7",
    nombre: "Calificación Automática Lead",
    descripcion: "Asignar prioridad y etiquetas automáticamente basado en el monto solicitado y origen del lead",
    estado: "ACTIVO",
    tipo: "CALIFICACION",
    color: "#EC4899",
    creadoPor: "Carolina Muñoz",
    creadoEn: new Date(2026, 5, 24),
    ultimoInicio: new Date(2026, 6, 4, 10, 30),
    ejecuciones: 892,
    exitosas: 885,
    fallidas: 7,
    tasaExito: 99.2,
    tiempoPromedio: "Instantáneo",
    conversiones: 0,
    tasaConversion: 0,
    trigger: {
      nombre: "Nuevo lead registrado",
      icono: Users,
      color: "#3B82F6",
    },
    pasos: [
      { id: 1, tipo: "condicion", nombre: "Evaluar monto", delay: 0, estado: "completado" },
      { id: 2, tipo: "etiqueta", nombre: "Asignar prioridad", delay: 0, estado: "completado" },
      { id: 3, tipo: "asignar", nombre: "Asignar ejecutivo", delay: 0, estado: "completado" },
    ],
    actividad: [
      { fecha: new Date(2026, 6, 4, 10, 30), accion: "Lead Isidora Muñoz calificado", tipo: "ejecucion" },
    ],
  },
];

const tipoFlujoConfig: Record<string, { label: string; color: string; bg: string }> = {
  ONBOARDING: { label: "Onboarding", color: "text-blue-600", bg: "bg-blue-50" },
  SEGUIMIENTO: { label: "Seguimiento", color: "text-green-600", bg: "bg-green-50" },
  REACTIVACION: { label: "Reactivación", color: "text-amber-600", bg: "bg-amber-50" },
  DOCUMENTOS: { label: "Documentos", color: "text-purple-600", bg: "bg-purple-50" },
  APROBACION: { label: "Aprobación", color: "text-emerald-600", bg: "bg-emerald-50" },
  NOTIFICACION: { label: "Notificación", color: "text-red-600", bg: "bg-red-50" },
  CALIFICACION: { label: "Calificación", color: "text-pink-600", bg: "bg-pink-50" },
};

type TabFlujo = "todos" | "activos" | "pausados";

export default function FlujosPage() {
  const [tabActiva, setTabActiva] = useState<TabFlujo>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState<string | null>(null);
  const [modalDetalle, setModalDetalle] = useState<string | null>(null);
  const [flujos, setFlujos] = useState(FLUJOS_DETALLE);

  const flujosFiltrados = useMemo(() => {
    return flujos.filter((f) => {
      const coincideTab =
        tabActiva === "todos" ||
        (tabActiva === "activos" && f.estado === "ACTIVO") ||
        (tabActiva === "pausados" && f.estado === "PAUSADO");
      const coincideBusqueda =
        !busqueda ||
        f.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      return coincideTab && coincideBusqueda;
    });
  }, [tabActiva, busqueda, flujos]);

  const flujoDetalle = flujos.find((f) => f.id === modalDetalle);

  const toggleEstado = (flujoId: string) => {
    setFlujos((prev) =>
      prev.map((f) =>
        f.id === flujoId
          ? { ...f, estado: f.estado === "ACTIVO" ? "PAUSADO" : "ACTIVO" }
          : f
      )
    );
  };

  const stats = useMemo(() => ({
    total: flujos.length,
    activos: flujos.filter((f) => f.estado === "ACTIVO").length,
    pausados: flujos.filter((f) => f.estado === "PAUSADO").length,
    ejecuciones: flujos.reduce((sum, f) => sum + f.ejecuciones, 0),
    exitosas: flujos.reduce((sum, f) => sum + f.exitosas, 0),
    fallidas: flujos.reduce((sum, f) => sum + f.fallidas, 0),
    conversiones: flujos.reduce((sum, f) => sum + f.conversiones, 0),
  }), [flujos]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Flujos Automáticos
            </h1>
            <p className="text-purple-200 text-[11px] font-medium">
              Automatiza tareas repetitivas y mejora la eficiencia del equipo
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-[10px] text-purple-200">Flujos</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-300">{stats.activos}</div>
              <div className="text-[10px] text-purple-200">Activos</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-300">{stats.ejecuciones.toLocaleString()}</div>
              <div className="text-[10px] text-purple-200">Ejecuciones</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300">{stats.conversiones}</div>
              <div className="text-[10px] text-purple-200">Conversiones</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-violet-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Ejecuciones</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.ejecuciones.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">Total procesadas</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Exitosas</span>
          </div>
          <div className="text-xl font-bold text-emerald-600">{stats.exitosas.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-500 mt-1">
            {stats.ejecuciones > 0 ? Math.round((stats.exitosas / stats.ejecuciones) * 100) : 0}% éxito
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Target size={18} className="text-amber-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Conversiones</span>
          </div>
          <div className="text-xl font-bold text-amber-600">{stats.conversiones}</div>
          <div className="text-[10px] text-amber-500 mt-1">Leads convertidos</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={18} className="text-blue-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Tasa Conversión</span>
          </div>
          <div className="text-xl font-bold text-blue-600">
            {stats.ejecuciones > 0 ? ((stats.conversiones / stats.ejecuciones) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-[10px] text-blue-500 mt-1">Promedio general</div>
        </div>
      </div>

      {/* Filtros y Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {[
              { id: "todos", label: "Todos", count: stats.total },
              { id: "activos", label: "Activos", count: stats.activos },
              { id: "pausados", label: "Pausados", count: stats.pausados },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id as TabFlujo)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                  tabActiva === tab.id
                    ? "bg-violet-500 text-white shadow-md shadow-violet-500/20"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {tab.label}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  tabActiva === tab.id ? "bg-white/20" : "bg-slate-200"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar flujo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-48 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all"
              />
            </div>
            <button
              onClick={() => setModalCrear(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-500 text-white rounded-xl text-[11px] font-semibold hover:bg-violet-600 transition-colors shadow-md shadow-violet-500/20"
            >
              <Plus size={14} /> Nuevo Flujo
            </button>
          </div>
        </div>
      </div>

      {/* Lista de flujos */}
      <div className="space-y-4">
        {flujosFiltrados.map((flujo) => {
          const tipoConfig = tipoFlujoConfig[flujo.tipo] || { label: flujo.tipo, color: "text-slate-600", bg: "bg-slate-50" };

          return (
            <div
              key={flujo.id}
              className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${flujo.color}15` }}
                  >
                    <Workflow size={20} style={{ color: flujo.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[13px] font-bold text-slate-800">{flujo.nombre}</h4>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tipoConfig.bg} ${tipoConfig.color}`}>
                        {tipoConfig.label}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          flujo.estado === "ACTIVO"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {flujo.estado === "ACTIVO" ? "● Activo" : "● Pausado"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{flujo.descripcion}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span>Creado por {flujo.creadoPor}</span>
                      <span>•</span>
                      <span>{flujo.pasos.length} pasos</span>
                      <span>•</span>
                      <span>Último: {flujo.ultimoInicio.toLocaleDateString("es-CL")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleEstado(flujo.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      flujo.estado === "ACTIVO"
                        ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                        : "bg-amber-100 text-amber-600 hover:bg-amber-200"
                    }`}
                    title={flujo.estado === "ACTIVO" ? "Pausar" : "Activar"}
                  >
                    {flujo.estado === "ACTIVO" ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button
                    onClick={() => setModalDetalle(flujo.id)}
                    className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Ver detalle"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>

              {/* Diagrama visual del flujo */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4 overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max">
                  {/* Trigger */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${flujo.trigger.color}15` }}
                    >
                      <flujo.trigger.icono size={18} style={{ color: flujo.trigger.color }} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1">Trigger</span>
                  </div>

                  <ArrowRight size={14} className="text-slate-300 flex-shrink-0" />

                  {/* Pasos del flujo */}
                  {flujo.pasos.map((paso, idx) => {
                    const nodoConfig = TIPOS_NODOS.find((n) => n.id === paso.tipo);
                    return (
                      <div key={paso.id} className="flex items-center gap-2">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${nodoConfig?.color || "#64748B"}15` }}
                          >
                            {nodoConfig && (
                              <nodoConfig.icono size={16} style={{ color: nodoConfig.color }} />
                            )}
                          </div>
                          <span className="text-[7px] font-medium text-slate-500 mt-1 text-center max-w-[60px] truncate">
                            {paso.nombre}
                          </span>
                          {paso.delay > 0 && (
                            <span className="text-[7px] text-slate-400">
                              +{paso.delay >= 60 ? `${Math.round(paso.delay / 60)}h` : `${paso.delay}m`}
                            </span>
                          )}
                        </div>
                        {idx < flujo.pasos.length - 1 && (
                          <ArrowRight size={12} className="text-slate-300 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="text-[13px] font-bold text-slate-800">{flujo.ejecuciones.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400">Ejecuciones</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <div className="text-[13px] font-bold text-emerald-700">{flujo.tasaExito}%</div>
                  <div className="text-[11px] text-emerald-500">Éxito</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-[13px] font-bold text-blue-700">{flujo.tiempoPromedio}</div>
                  <div className="text-[11px] text-blue-500">Tiempo prom.</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <div className="text-[13px] font-bold text-amber-700">{flujo.conversiones}</div>
                  <div className="text-[11px] text-amber-500">Conversiones</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Detalle */}
      {flujoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${flujoDetalle.color}15` }}
                  >
                    <Workflow size={24} style={{ color: flujoDetalle.color }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{flujoDetalle.nombre}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{flujoDetalle.descripcion}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          flujoDetalle.estado === "ACTIVO"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {flujoDetalle.estado}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Creado por {flujoDetalle.creadoPor}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setModalDetalle(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Diagrama detallado */}
              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h4 className="text-sm font-bold text-slate-800 mb-4">Diagrama del Flujo</h4>
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {/* Trigger */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${flujoDetalle.trigger.color}15` }}
                    >
                      <flujoDetalle.trigger.icono size={22} style={{ color: flujoDetalle.trigger.color }} />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 mt-2">Trigger</span>
                    <span className="text-[10px] text-slate-400">{flujoDetalle.trigger.nombre}</span>
                  </div>

                  <ArrowRight size={16} className="text-slate-300 flex-shrink-0" />

                  {/* Pasos */}
                  {flujoDetalle.pasos.map((paso, idx) => {
                    const nodoConfig = TIPOS_NODOS.find((n) => n.id === paso.tipo);
                    return (
                      <div key={paso.id} className="flex items-center gap-2">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${nodoConfig?.color || "#64748B"}15` }}
                          >
                            {nodoConfig && (
                              <nodoConfig.icono size={18} style={{ color: nodoConfig.color }} />
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-600 mt-1 text-center">
                            {paso.nombre}
                          </span>
                          {paso.plantilla && (
                            <span className="text-[7px] text-violet-500">
                              📄 {paso.plantilla}
                            </span>
                          )}
                          {paso.delay > 0 && (
                            <span className="text-[7px] text-slate-400 flex items-center gap-0.5">
                              <Timer size={8} /> +{paso.delay >= 60 ? `${Math.round(paso.delay / 60)}h` : `${paso.delay}m`}
                            </span>
                          )}
                        </div>
                        {idx < flujoDetalle.pasos.length - 1 && (
                          <ArrowRight size={14} className="text-slate-300 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-blue-700">{flujoDetalle.ejecuciones.toLocaleString()}</div>
                  <div className="text-[10px] text-blue-500">Ejecuciones</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-emerald-700">{flujoDetalle.tasaExito}%</div>
                  <div className="text-[10px] text-emerald-500">Tasa Éxito</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-amber-700">{flujoDetalle.tiempoPromedio}</div>
                  <div className="text-[10px] text-amber-500">Tiempo Promedio</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-purple-700">{flujoDetalle.conversiones}</div>
                  <div className="text-[10px] text-purple-500">Conversiones ({flujoDetalle.tasaConversion}%)</div>
                </div>
              </div>

              {/* Actividad reciente */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3">Actividad Reciente</h4>
                <div className="space-y-2">
                  {flujoDetalle.actividad.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                      <div className="w-2 h-2 bg-violet-500 rounded-full" />
                      <span className="text-[10px] text-slate-600 flex-1">{act.accion}</span>
                      <span className="text-[11px] text-slate-400">
                        {act.fecha.toLocaleDateString("es-CL")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setModalDetalle(null)}
                className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setModalDetalle(null);
                  setModalEditar(flujoDetalle.id);
                }}
                className="px-4 py-2 bg-violet-500 text-white text-[11px] font-semibold rounded-xl hover:bg-violet-600 transition-colors flex items-center gap-1.5"
              >
                <Edit size={14} /> Editar Flujo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear */}
      {modalCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Nuevo Flujo Automático</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Diseña un flujo de automatización para tu equipo
                  </p>
                </div>
                <button
                  onClick={() => setModalCrear(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Información básica */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700">Nombre del Flujo *</label>
                    <input
                      type="text"
                      placeholder="Ej: Bienvenida Nuevo Lead"
                      className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700">Tipo de Flujo</label>
                    <select className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400">
                      {Object.entries(tipoFlujoConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Descripción</label>
                  <textarea
                    placeholder="Describe qué hace este flujo y cuándo se activa..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 resize-none transition-all"
                  />
                </div>
              </div>

              {/* Selector de Trigger */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-800 mb-3">1. Selecciona el Trigger</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {TRIGGERS_DISPONIBLES.map((trigger) => {
                    const IconoTrigger = trigger.icono;
                    return (
                      <button
                        key={trigger.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-violet-50 rounded-xl border border-slate-200 hover:border-violet-300 transition-all text-left"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${trigger.color}15` }}
                        >
                          <IconoTrigger size={18} style={{ color: trigger.color }} />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700">
                          {trigger.nombre}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Acciones disponibles */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3">2. Agrega Acciones</h4>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {TIPOS_NODOS.filter((n) => n.id !== "trigger" && n.id !== "fin").map((nodo) => {
                    const IconoNodo = nodo.icono;
                    return (
                      <button
                        key={nodo.id}
                        className="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-violet-50 rounded-xl border border-slate-200 hover:border-violet-300 transition-all"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${nodo.color}15` }}
                        >
                          <IconoNodo size={18} style={{ color: nodo.color }} />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-700">{nodo.nombre}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setModalCrear(false)}
                className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setModalCrear(false)}
                className="px-5 py-2 bg-violet-500 text-white text-[11px] font-semibold rounded-xl hover:bg-violet-600 transition-colors shadow-md shadow-violet-500/20"
              >
                Crear Flujo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {modalEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Edit size={18} className="text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Editar Flujo</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Modifica la configuración del flujo automatizado
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalEditar(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Información básica */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700">Nombre del Flujo *</label>
                    <input
                      type="text"
                      defaultValue={flujos.find((f) => f.id === modalEditar)?.nombre}
                      className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700">Tipo de Flujo</label>
                    <select
                      defaultValue={flujos.find((f) => f.id === modalEditar)?.tipo}
                      className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400"
                    >
                      {Object.entries(tipoFlujoConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Descripción</label>
                  <textarea
                    defaultValue={flujos.find((f) => f.id === modalEditar)?.descripcion}
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400 resize-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Estado</label>
                  <select
                    defaultValue={flujos.find((f) => f.id === modalEditar)?.estado}
                    className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="PAUSADO">Pausado</option>
                  </select>
                </div>
              </div>

              {/* Pasos del flujo */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-800">Pasos del Flujo</h4>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-600 rounded-lg text-[10px] font-semibold hover:bg-violet-200 transition-colors">
                    <Plus size={12} /> Agregar Paso
                  </button>
                </div>
                <div className="space-y-2">
                  {flujos.find((f) => f.id === modalEditar)?.pasos.map((paso, idx) => {
                    const nodoConfig = TIPOS_NODOS.find((n) => n.id === paso.tipo);
                    return (
                      <div
                        key={paso.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60"
                      >
                        <div className="text-[10px] font-bold text-slate-400 w-6">{idx + 1}</div>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${nodoConfig?.color || "#64748B"}15` }}
                        >
                          {nodoConfig && (
                            <nodoConfig.icono size={14} style={{ color: nodoConfig.color }} />
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            defaultValue={paso.nombre}
                            className="w-full bg-transparent text-[11px] font-semibold text-slate-700 focus:outline-none"
                          />
                          {paso.plantilla && (
                            <span className="text-[11px] text-violet-500">
                              📄 {paso.plantilla}
                            </span>
                          )}
                        </div>
                        {paso.delay > 0 && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Timer size={10} />
                            {paso.delay >= 60 ? `${Math.round(paso.delay / 60)}h` : `${paso.delay}m`}
                          </span>
                        )}
                        <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
                          <Edit size={12} className="text-slate-400" />
                        </button>
                        <button className="p-1.5 hover:bg-red-100 rounded-lg transition-colors">
                          <Trash2 size={12} className="text-red-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Configuración avanzada */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-bold text-slate-800 mb-3">Configuración Avanzada</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700">Máximo de ejecuciones diarias</label>
                    <input
                      type="number"
                      defaultValue="100"
                      className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700">Reintentos en caso de fallo</label>
                    <input
                      type="number"
                      defaultValue="3"
                      className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setFlujos((prev) => prev.filter((f) => f.id !== modalEditar));
                  setModalEditar(null);
                }}
                className="px-4 py-2 bg-red-50 text-red-600 text-[11px] font-semibold rounded-xl hover:bg-red-100 transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Eliminar Flujo
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalEditar(null)}
                  className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setModalEditar(null)}
                  className="px-5 py-2 bg-amber-500 text-white text-[11px] font-semibold rounded-xl hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
