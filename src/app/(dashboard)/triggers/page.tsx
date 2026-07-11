"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Zap,
  Play,
  Pause,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  Copy,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  Bell,
  GitBranch,
  ArrowRight,
  Settings,
  Activity,
  TrendingUp,
  BarChart3,
  Target,
  User,
  Building2,
  DollarSign,
  Tag,
  Workflow,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Info,
} from "lucide-react";

// Tipos de triggers disponibles
const TIPOS_TRIGGER = [
  { id: "lead_creado", nombre: "Lead Creado", icono: Users, color: "#3B82F6", categoria: "lead" },
  { id: "lead_cambio_etapa", nombre: "Cambio de Etapa", icono: ArrowRight, color: "#8B5CF6", categoria: "lead" },
  { id: "lead_inactivo", nombre: "Lead Inactivo", icono: Clock, color: "#F59E0B", categoria: "lead" },
  { id: "lead_calificado", nombre: "Lead Calificado", icono: Target, color: "#10B981", categoria: "lead" },
  { id: "doc_subido", nombre: "Documento Subido", icono: FileText, color: "#8B5CF6", categoria: "documento" },
  { id: "doc_aprobado", nombre: "Documento Aprobado", icono: CheckCircle, color: "#10B981", categoria: "documento" },
  { id: "doc_rechazado", nombre: "Documento Rechazado", icono: XCircle, color: "#EF4444", categoria: "documento" },
  { id: "tarea_creada", nombre: "Tarea Creada", icono: CheckCircle, color: "#14B8A6", categoria: "tarea" },
  { id: "tarea_vencida", nombre: "Tarea Vencida", icono: AlertTriangle, color: "#EF4444", categoria: "tarea" },
  { id: "tarea_completada", nombre: "Tarea Completada", icono: CheckCircle, color: "#10B981", categoria: "tarea" },
  { id: "credito_aprobado", nombre: "Crédito Aprobado", icono: DollarSign, color: "#10B981", categoria: "credito" },
  { id: "credito_rechazado", nombre: "Crédito Rechazado", icono: XCircle, color: "#EF4444", categoria: "credito" },
  { id: "llamada_registrada", nombre: "Llamada Registrada", icono: Phone, color: "#10B981", categoria: "comunicacion" },
  { id: "email_recibido", nombre: "Email Recibido", icono: Mail, color: "#3B82F6", categoria: "comunicacion" },
  { id: "whatsapp_recibido", nombre: "WhatsApp Recibido", icono: MessageSquare, color: "#22C55E", categoria: "comunicacion" },
];

// Acciones disponibles
const ACCIONES_DISPONIBLES = [
  { id: "enviar_email", nombre: "Enviar Email", icono: Mail, color: "#3B82F6" },
  { id: "enviar_whatsapp", nombre: "Enviar WhatsApp", icono: MessageSquare, color: "#22C55E" },
  { id: "enviar_sms", nombre: "Enviar SMS", icono: Phone, color: "#8B5CF6" },
  { id: "crear_tarea", nombre: "Crear Tarea", icono: CheckCircle, color: "#14B8A6" },
  { id: "asignar_ejecutivo", nombre: "Asignar Ejecutivo", icono: User, color: "#8B5CF6" },
  { id: "cambiar_etapa", nombre: "Cambiar Etapa", icono: ArrowRight, color: "#F59E0B" },
  { id: "agregar_etiqueta", nombre: "Agregar Etiqueta", icono: Tag, color: "#EC4899" },
  { id: "notificar_equipo", nombre: "Notificar Equipo", icono: Bell, color: "#F59E0B" },
  { id: "agendar_reunion", nombre: "Agendar Reunión", icono: Calendar, color: "#8B5CF6" },
  { id: "iniciar_flujo", nombre: "Iniciar Flujo", icono: Workflow, color: "#6366F1" },
];

// Triggers mock
const TRIGGERS_MOCK = [
  {
    id: "t1",
    nombre: "Bienvenida Nuevo Lead",
    descripcion: "Enviar email y WhatsApp de bienvenida cuando se registra un nuevo lead",
    trigger: "lead_creado",
    condiciones: [
      { campo: "origen", operador: "es", valor: "WEB" },
    ],
    acciones: [
      { tipo: "enviar_email", plantilla: "Bienvenida Nuevo Lead", delay: 0 },
      { tipo: "enviar_whatsapp", plantilla: "Saludo WhatsApp", delay: 30 },
    ],
    estado: "ACTIVO",
    ejecuciones: 1247,
    exitosas: 1180,
    fallidas: 67,
    ultimoDisparo: new Date(2026, 6, 4, 9, 0),
    creadoEn: new Date(2026, 5, 4),
    creadoPor: "Andrés Pérez",
  },
  {
    id: "t2",
    nombre: "Reactivación Lead Inactivo",
    descripcion: "Cuando un lead lleva 30 días sin actividad, enviar serie de reactivación",
    trigger: "lead_inactivo",
    condiciones: [
      { campo: "dias_sin_contacto", operador: ">=", valor: "30" },
      { campo: "etapa", operador: "no es", valor: "CLIENTE_FINALIZADO" },
    ],
    acciones: [
      { tipo: "enviar_email", plantilla: "Reactivación Lead", delay: 0 },
      { tipo: "agregar_etiqueta", valor: "reactivacion-iniciada", delay: 0 },
      { tipo: "crear_tarea", valor: "Seguimiento post reactivación", delay: 720 },
    ],
    estado: "ACTIVO",
    ejecuciones: 534,
    exitosas: 489,
    fallidas: 45,
    ultimoDisparo: new Date(2026, 6, 4, 6, 0),
    creadoEn: new Date(2026, 5, 9),
    creadoPor: "Diego Silva",
  },
  {
    id: "t3",
    nombre: "Alerta Documentos Pendientes",
    descripcion: "Enviar recordatorio cada 3 días mientras haya documentos pendientes",
    trigger: "doc_subido",
    condiciones: [
      { campo: "documentos_pendientes", operador: ">", valor: "0" },
    ],
    acciones: [
      { tipo: "enviar_whatsapp", plantilla: "Recordatorio Documentos WhatsApp", delay: 4320 },
      { tipo: "crear_tarea", valor: "Verificar documentos del cliente", delay: 4320 },
    ],
    estado: "ACTIVO",
    ejecuciones: 423,
    exitosas: 410,
    fallidas: 13,
    ultimoDisparo: new Date(2026, 6, 3, 23, 0),
    creadoEn: new Date(2026, 5, 14),
    creadoPor: "Valentina Torres",
  },
  {
    id: "t4",
    nombre: "Felicitación Crédito Aprobado",
    descripcion: "Enviar felicitación al cliente y notificar al equipo cuando se aprueba un crédito",
    trigger: "credito_aprobado",
    condiciones: [],
    acciones: [
      { tipo: "enviar_whatsapp", plantilla: "Felicitación WhatsApp", delay: 0 },
      { tipo: "enviar_email", plantilla: "Felicitación Crédito Aprobado", delay: 0 },
      { tipo: "notificar_equipo", valor: "¡Crédito aprobado!", delay: 0 },
      { tipo: "cambiar_etapa", valor: "FIRMA_DIGITAL", delay: 1440 },
    ],
    estado: "ACTIVO",
    ejecuciones: 189,
    exitosas: 189,
    fallidas: 0,
    ultimoDisparo: new Date(2026, 6, 4, 3, 0),
    creadoEn: new Date(2026, 4, 20),
    creadoPor: "Javier Morales",
  },
  {
    id: "t5",
    nombre: "Asignación Automática Lead",
    descripcion: "Asignar lead al ejecutivo con menos carga cuando se registra por teléfono",
    trigger: "lead_creado",
    condiciones: [
      { campo: "origen", operador: "es", valor: "TELEFONO" },
    ],
    acciones: [
      { tipo: "asignar_ejecutivo", valor: "menor_carga", delay: 0 },
      { tipo: "agregar_etiqueta", valor: "auto-asignado", delay: 0 },
    ],
    estado: "ACTIVO",
    ejecuciones: 312,
    exitosas: 308,
    fallidas: 4,
    ultimoDisparo: new Date(2026, 6, 4, 8, 0),
    creadoEn: new Date(2026, 5, 19),
    creadoPor: "Andrés Pérez",
  },
  {
    id: "t6",
    nombre: "Tarea Vencida - Notificar Gerente",
    descripcion: "Cuando una tarea está vencida, notificar al gerente del equipo",
    trigger: "tarea_vencida",
    condiciones: [],
    acciones: [
      { tipo: "notificar_equipo", valor: "Tarea vencida requiere atención", delay: 0 },
      { tipo: "enviar_email", plantilla: "Alerta Tarea Vencida", delay: 60 },
    ],
    estado: "PAUSADO",
    ejecuciones: 245,
    exitosas: 245,
    fallidas: 0,
    ultimoDisparo: new Date(2026, 6, 3, 11, 0),
    creadoEn: new Date(2026, 4, 5),
    creadoPor: "Carolina Muñoz",
  },
];

const CATEGORIA_COLORS: Record<string, string> = {
  lead: "text-blue-600",
  documento: "text-purple-600",
  tarea: "text-emerald-600",
  credito: "text-amber-600",
  comunicacion: "text-green-600",
};

type TabTrigger = "todos" | "activos" | "pausados";

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState<TabTrigger>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalle, setModalDetalle] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/triggers");
        const json = await res.json();
        if (json.success && json.data) setTriggers(json.data);
      } catch { setTriggers([]); }
      finally { setCargando(false); }
    }
    cargar();
  }, []);

  const triggersFiltrados = useMemo(() => {
    return triggers.filter((t) => {
      const coincideTab =
        tabActiva === "todos" ||
        (tabActiva === "activos" && t.estado === "ACTIVO") ||
        (tabActiva === "pausados" && t.estado === "PAUSADO");
      const coincideBusqueda =
        !busqueda ||
        t.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        t.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      return coincideTab && coincideBusqueda;
    });
  }, [tabActiva, busqueda, triggers]);

  const triggerDetalle = triggers.find((t) => t.id === modalDetalle);

  const toggleEstado = (triggerId: string) => {
    setTriggers((prev) =>
      prev.map((t) =>
        t.id === triggerId
          ? { ...t, estado: t.estado === "ACTIVO" ? "PAUSADO" : "ACTIVO" }
          : t
      )
    );
  };

  const stats = useMemo(() => ({
    total: triggers.length,
    activos: triggers.filter((t) => t.estado === "ACTIVO").length,
    pausados: triggers.filter((t) => t.estado === "PAUSADO").length,
    ejecuciones: triggers.reduce((sum, t) => sum + t.ejecuciones, 0),
    exitosas: triggers.reduce((sum, t) => sum + t.exitosas, 0),
    fallidas: triggers.reduce((sum, t) => sum + t.fallidas, 0),
  }), [triggers]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Triggers Automáticos
            </h1>
            <p className="text-amber-200 text-[11px] font-medium">
              Reglas que se activan según condiciones específicas del sistema
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-[10px] text-amber-200">Total</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-300">{stats.activos}</div>
              <div className="text-[10px] text-amber-200">Activos</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-300">{stats.ejecuciones.toLocaleString()}</div>
              <div className="text-[10px] text-amber-200">Ejecuciones</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-amber-500" />
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
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Fallidas</span>
          </div>
          <div className="text-xl font-bold text-red-600">{stats.fallidas.toLocaleString()}</div>
          <div className="text-[10px] text-red-500 mt-1">Requieren revisión</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Activity size={18} className="text-blue-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Activos</span>
          </div>
          <div className="text-xl font-bold text-blue-600">{stats.activos}</div>
          <div className="text-[10px] text-blue-500 mt-1">de {stats.total} totales</div>
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
                onClick={() => setTabActiva(tab.id as TabTrigger)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                  tabActiva === tab.id
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
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
                placeholder="Buscar trigger..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-48 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400 transition-all"
              />
            </div>
            <button
              onClick={() => setModalCrear(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-[11px] font-semibold hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20"
            >
              <Plus size={14} /> Nuevo Trigger
            </button>
          </div>
        </div>
      </div>

      {/* Lista de triggers */}
      <div className="space-y-4">
        {triggersFiltrados.map((trigger) => {
          const tipoTrigger = TIPOS_TRIGGER.find((t) => t.id === trigger.trigger);

          return (
            <div
              key={trigger.id}
              className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${tipoTrigger?.color || "#F59E0B"}15` }}
                  >
                    <Zap size={20} style={{ color: tipoTrigger?.color || "#F59E0B" }} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-800">{trigger.nombre}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{trigger.descripcion}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          trigger.estado === "ACTIVO"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {trigger.estado === "ACTIVO" ? "● Activo" : "● Pausado"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Trigger: {tipoTrigger?.nombre}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleEstado(trigger.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      trigger.estado === "ACTIVO"
                        ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                        : "bg-amber-100 text-amber-600 hover:bg-amber-200"
                    }`}
                    title={trigger.estado === "ACTIVO" ? "Pausar" : "Activar"}
                  >
                    {trigger.estado === "ACTIVO" ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button
                    onClick={() => setModalDetalle(trigger.id)}
                    className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Ver detalle"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>

              {/* Condiciones */}
              <div className="mb-4">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Condiciones
                </h5>
                <div className="flex flex-wrap gap-2">
                  {trigger.condiciones.length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic">Sin condiciones (siempre se ejecuta)</span>
                  ) : (
                    (trigger.condiciones || []).map((cond: any, idx: number) => (
                      <span
                        key={idx}
                        className="text-[11px] font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg"
                      >
                        {cond.campo} {cond.operador} {cond.valor}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="mb-4">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Acciones ({trigger.acciones.length})
                </h5>
                <div className="flex flex-wrap gap-2">
                  {(trigger.acciones || []).map((accion: any, idx: number) => {
                    const accionConfig = ACCIONES_DISPONIBLES.find((a) => a.id === accion.tipo);
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200/60"
                      >
                        {accionConfig && (
                          <span style={{ color: accionConfig.color }}>
                            <accionConfig.icono size={10} />
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-slate-600">
                          {accionConfig?.nombre}
                        </span>
                        {accion.delay > 0 && (
                          <span className="text-[10px] text-slate-400">
                            +{accion.delay >= 60 ? `${Math.round(accion.delay / 60)}h` : `${accion.delay}m`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Métricas */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-4 text-[10px] text-slate-400">
                  <span>
                    <span className="font-semibold text-slate-600">{trigger.ejecuciones.toLocaleString()}</span> ejecuciones
                  </span>
                  <span>
                    <span className="font-semibold text-emerald-600">{trigger.exitosas}</span> éxitos
                  </span>
                  <span>
                    <span className="font-semibold text-red-600">{trigger.fallidas}</span> fallos
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Último: {trigger.ultimoDisparo.toLocaleDateString("es-CL")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Detalle */}
      {triggerDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Zap size={24} className="text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{triggerDetalle.nombre}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{triggerDetalle.descripcion}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          triggerDetalle.estado === "ACTIVO"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {triggerDetalle.estado}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Creado por {triggerDetalle.creadoPor}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setModalDetalle(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <span className="text-slate-400">✕</span>
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Diagrama del trigger */}
              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h4 className="text-sm font-bold text-slate-800 mb-4">Flujo del Trigger</h4>
                <div className="flex items-center gap-3 overflow-x-auto">
                  {/* Trigger */}
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                      <Zap size={22} className="text-amber-500" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 mt-2">Trigger</span>
                    <span className="text-[10px] text-slate-400 text-center">
                      {TIPOS_TRIGGER.find((t) => t.id === triggerDetalle.trigger)?.nombre}
                    </span>
                  </div>

                  <ArrowRight size={16} className="text-slate-300 flex-shrink-0" />

                  {/* Condiciones */}
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                      <Filter size={22} className="text-purple-500" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 mt-2">Condición</span>
                    <span className="text-[10px] text-slate-400 text-center">
                      {triggerDetalle.condiciones.length > 0
                        ? `${triggerDetalle.condiciones.length} regla(s)`
                        : "Siempre"}
                    </span>
                  </div>

                  <ArrowRight size={16} className="text-slate-300 flex-shrink-0" />

                  {/* Acciones */}
                  {(triggerDetalle.acciones || []).map((accion: any, idx: number) => {
                    const accionConfig = ACCIONES_DISPONIBLES.find((a) => a.id === accion.tipo);
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex flex-col items-center min-w-[80px]">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${accionConfig?.color || "#64748B"}15` }}
                          >
                            {accionConfig && (
                              <span style={{ color: accionConfig.color }}>
                                <accionConfig.icono size={18} />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-600 mt-1 text-center">
                            {accionConfig?.nombre}
                          </span>
                        </div>
                        {idx < triggerDetalle.acciones.length - 1 && (
                          <ArrowRight size={12} className="text-slate-300 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-blue-700">{triggerDetalle.ejecuciones.toLocaleString()}</div>
                  <div className="text-[10px] text-blue-500">Ejecuciones</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-emerald-700">{triggerDetalle.exitosas}</div>
                  <div className="text-[10px] text-emerald-500">Exitosas</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-red-700">{triggerDetalle.fallidas}</div>
                  <div className="text-[10px] text-red-500">Fallidas</div>
                </div>
              </div>

              {/* Condiciones detalladas */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-800 mb-3">Condiciones</h4>
                {triggerDetalle.condiciones.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    Este trigger se ejecuta siempre que se produce el evento
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(triggerDetalle.condiciones || []).map((cond: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] font-semibold text-slate-600">{cond.campo}</span>
                        <span className="text-[10px] text-slate-400">{cond.operador}</span>
                        <span className="text-[10px] font-bold text-slate-800">{cond.valor}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Acciones detalladas */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3">Acciones</h4>
                <div className="space-y-2">
                  {(triggerDetalle.acciones || []).map((accion: any, idx: number) => {
                    const accionConfig = ACCIONES_DISPONIBLES.find((a) => a.id === accion.tipo);
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${accionConfig?.color || "#64748B"}15` }}
                        >
                          {accionConfig && (
                            <span style={{ color: accionConfig.color }}>
                              <accionConfig.icono size={14} />
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="text-[11px] font-semibold text-slate-700">
                            {accionConfig?.nombre}
                          </span>
                          {accion.plantilla && (
                            <span className="text-[11px] text-slate-400 ml-2">
                              Plantilla: {accion.plantilla}
                            </span>
                          )}
                        </div>
                        {accion.delay > 0 && (
                          <span className="text-[11px] text-slate-400">
                            Espera: {accion.delay >= 60 ? `${Math.round(accion.delay / 60)} horas` : `${accion.delay} min`}
                          </span>
                        )}
                      </div>
                    );
                  })}
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
              <button className="px-4 py-2 bg-amber-500 text-white text-[11px] font-semibold rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-1.5">
                <Edit size={14} /> Editar Trigger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Trigger */}
      {modalCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Nuevo Trigger</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Configura una regla automática para tu CRM
                  </p>
                </div>
                <button
                  onClick={() => setModalCrear(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <span className="text-slate-400">✕</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Nombre del Trigger *</label>
                <input
                  type="text"
                  placeholder="Ej: Bienvenida Nuevo Lead"
                  className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Descripción</label>
                <textarea
                  placeholder="Describe qué hace este trigger..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400 resize-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Evento Trigger *</label>
                <select className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400">
                  {TIPOS_TRIGGER.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Condiciones (opcional)</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-[10px] text-slate-400 text-center">
                    Sin condiciones = se ejecuta siempre
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Acciones *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCIONES_DISPONIBLES.slice(0, 6).map((accion) => {
                    const IconoAccion = accion.icono;
                    return (
                      <button
                        key={accion.id}
                        className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-amber-50 rounded-xl border border-slate-200 hover:border-amber-300 transition-all text-left"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${accion.color}15` }}
                        >
                          <IconoAccion size={14} style={{ color: accion.color }} />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-700">
                          {accion.nombre}
                        </span>
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
                className="px-5 py-2 bg-amber-500 text-white text-[11px] font-semibold rounded-xl hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20"
              >
                Crear Trigger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icono XCircle
function XCircle({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
