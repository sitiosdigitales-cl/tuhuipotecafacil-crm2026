"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus, Search, Bell, Clock, CheckCircle, AlertTriangle, Calendar,
  Mail, MessageSquare, Phone, Trash2, Edit, Eye, Play, Send,
  Zap, Repeat, Timer, Users, ClipboardList, Columns3, CalendarDays,
  List, LayoutDashboard, Square, CheckSquare, RotateCcw, ToggleLeft, ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLeads } from "@/lib/contexts/LeadContext";
import { useUser } from "@/lib/contexts/UserContext";
import { ESTADOS_TAREA_CONFIG, TIPOS_TAREA_CONFIG } from "@/tipos";
import type { Tarea, EstadoTarea, TipoTarea, Prioridad } from "@/tipos";

// Tipos unificados
type TipoActividad = "tarea" | "recordatorio";
type VistaActiva = "lista" | "kanban" | "calendario";

interface Recordatorio {
  id: string; titulo: string; descripcion: string;
  tipo: "email" | "whatsapp" | "llamada" | "sistema";
  frecuencia: "una_vez" | "diario" | "semanal" | "mensual";
  leadId?: string; leadNombre?: string;
  fechaEnvio: Date; proximoEnvio: Date;
  estado: "pendiente" | "enviado" | "fallido" | "programado";
  activo: boolean; intentos: number; maxIntentos: number;
  creadoEn: Date; ultimoEnvio?: Date;
}

// Configs
const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string; icono: typeof Bell }> = {
  tarea: { label: "Tarea", color: "text-blue-600", bg: "bg-blue-50", icono: ClipboardList },
  recordatorio: { label: "Recordatorio", color: "text-purple-600", bg: "bg-purple-50", icono: Bell },
};

const ESTADO_TAREAS: { value: string; label: string; color: string }[] = [
  { value: "todos", label: "Todos", color: "bg-slate-100 text-slate-600" },
  { value: "PENDIENTE", label: "Pendiente", color: "bg-amber-100 text-amber-700" },
  { value: "EN_PROGRESO", label: "En Progreso", color: "bg-blue-100 text-blue-700" },
  { value: "COMPLETADA", label: "Completada", color: "bg-emerald-100 text-emerald-700" },
  { value: "VENCIDA", label: "Vencida", color: "bg-red-100 text-red-700" },
];

const ESTADO_RECORDATORIOS: { value: string; label: string; color: string }[] = [
  { value: "todos", label: "Todos", color: "bg-slate-100 text-slate-600" },
  { value: "pendiente", label: "Pendiente", color: "bg-amber-100 text-amber-700" },
  { value: "enviado", label: "Enviado", color: "bg-emerald-100 text-emerald-700" },
  { value: "fallido", label: "Fallido", color: "bg-red-100 text-red-700" },
  { value: "programado", label: "Programado", color: "bg-blue-100 text-blue-700" },
];

const CANAL_CONFIG: Record<string, { label: string; icono: typeof Mail; color: string }> = {
  email: { label: "Email", icono: Mail, color: "text-blue-600" },
  whatsapp: { label: "WhatsApp", icono: MessageSquare, color: "text-green-600" },
  llamada: { label: "Llamada", icono: Phone, color: "text-amber-600" },
  sistema: { label: "Sistema", icono: Zap, color: "text-purple-600" },
};

export default function ActividadesPage() {
  const { leads } = useLeads();
  const { usuarios } = useUser();

  // State
  const [vista, setVista] = useState<VistaActiva>("lista");
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoActividad | "todos">("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroCanal, setFiltroCanal] = useState("todos");

  // Tareas
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargandoTareas, setCargandoTareas] = useState(true);

  // Recordatorios
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [cargandoRecordatorios, setCargandoRecordatorios] = useState(true);

  // Modales
  const [crearTipo, setCrearTipo] = useState<TipoActividad | null>(null);
  const [editarItem, setEditarItem] = useState<Tarea | Recordatorio | null>(null);
  const [eliminarItem, setEliminarItem] = useState<{ id: string; tipo: TipoActividad } | null>(null);

  // Formulario
  const [form, setForm] = useState({
    titulo: "", descripcion: "", tipoTarea: "SEGUIMIENTO" as TipoTarea,
    prioridad: "MEDIA" as Prioridad, leadId: "", leadNombre: "",
    fechaVencimiento: "", fechaEnvio: "", canal: "whatsapp" as string,
    frecuencia: "una_vez" as string, horaEnvio: "09:00",
  });

  // Cargar datos
  useEffect(() => {
    async function cargar() {
      try {
        const [resT, resR] = await Promise.all([
          fetch("/api/tareas"),
          fetch("/api/recordatorios"),
        ]);
        const [dT, dR] = await Promise.all([resT.json(), resR.json()]);
        if (dT.success && dT.data) setTareas(dT.data.map((t: any) => ({ ...t, fechaVencimiento: t.fechaVencimiento ? new Date(t.fechaVencimiento) : undefined, creadoEn: new Date(t.creadoEn || Date.now()) })));
        if (dR.success && dR.data) setRecordatorios(dR.data.map((r: any) => ({ ...r, fechaEnvio: new Date(r.fechaEnvio), proximoEnvio: new Date(r.proximoEnvio), creadoEn: new Date(r.creadoEn || Date.now()) })));
      } catch {}
      setCargandoTareas(false);
      setCargandoRecordatorios(false);
    }
    cargar();
  }, []);

  // Stats combinados
  const stats = useMemo(() => ({
    total: tareas.length + recordatorios.length,
    tareasPendientes: tareas.filter((t) => t.estado === "PENDIENTE").length,
    tareasEnProgreso: tareas.filter((t) => t.estado === "EN_PROGRESO").length,
    tareasCompletadas: tareas.filter((t) => t.estado === "COMPLETADA").length,
    tareasVencidas: tareas.filter((t) => t.estado === "VENCIDA").length,
    recPendientes: recordatorios.filter((r) => r.estado === "pendiente").length,
    recEnviados: recordatorios.filter((r) => r.estado === "enviado").length,
    recFallidos: recordatorios.filter((r) => r.estado === "fallido").length,
    recActivos: recordatorios.filter((r) => r.activo).length,
  }), [tareas, recordatorios]);

  // Datos unificados filtrados
  const itemsFiltrados = useMemo(() => {
    const items: { id: string; tipo: TipoActividad; titulo: string; estado: string; prioridad?: string; canal?: string; leadNombre?: string; fecha: Date; activo?: boolean }[] = [];

    if (filtroTipo === "todos" || filtroTipo === "tarea") {
      tareas.forEach((t) => {
        items.push({ id: t.id, tipo: "tarea", titulo: t.titulo, estado: t.estado, prioridad: t.prioridad, leadNombre: t.leadNombre, fecha: t.fechaVencimiento || t.creadoEn });
      });
    }
    if (filtroTipo === "todos" || filtroTipo === "recordatorio") {
      recordatorios.forEach((r) => {
        items.push({ id: r.id, tipo: "recordatorio", titulo: r.titulo, estado: r.estado, canal: r.tipo, leadNombre: r.leadNombre, fecha: r.proximoEnvio, activo: r.activo });
      });
    }

    return items.filter((item) => {
      const matchBusqueda = !busqueda || item.titulo.toLowerCase().includes(busqueda.toLowerCase()) || item.leadNombre?.toLowerCase().includes(busqueda.toLowerCase());
      const matchEstado = filtroEstado === "todos" || item.estado === filtroEstado;
      const matchCanal = filtroCanal === "todos" || item.canal === filtroCanal;
      return matchBusqueda && matchEstado && matchCanal;
    }).sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }, [tareas, recordatorios, busqueda, filtroTipo, filtroEstado, filtroCanal]);

  // Acciones
  const toggleActivo = async (id: string) => {
    try {
      await fetch(`/api/recordatorios/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ activo: !recordatorios.find((r) => r.id === id)?.activo }) });
      setRecordatorios((prev) => prev.map((r) => r.id === id ? { ...r, activo: !r.activo } : r));
      toast.success("Estado actualizado");
    } catch { toast.error("Error"); }
  };

  const marcarEnviado = async (id: string) => {
    try {
      await fetch(`/api/recordatorios/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ estado: "enviado" }) });
      setRecordatorios((prev) => prev.map((r) => r.id === id ? { ...r, estado: "enviado" as const, ultimoEnvio: new Date() } : r));
      toast.success("Marcado como enviado");
    } catch { toast.error("Error"); }
  };

  const cambiarEstadoTarea = async (id: string, nuevoEstado: string) => {
    try {
      await fetch(`/api/tareas/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ estado: nuevoEstado }) });
      setTareas((prev) => prev.map((t) => t.id === id ? { ...t, estado: nuevoEstado as EstadoTarea } : t));
    } catch {}
  };

  const eliminar = async () => {
    if (!eliminarItem) return;
    const url = eliminarItem.tipo === "tarea" ? `/api/tareas/${eliminarItem.id}` : `/api/recordatorios/${eliminarItem.id}`;
    try {
      await fetch(url, { method: "DELETE", credentials: "include" });
      if (eliminarItem.tipo === "tarea") setTareas((prev) => prev.filter((t) => t.id !== eliminarItem.id));
      else setRecordatorios((prev) => prev.filter((r) => r.id !== eliminarItem.id));
      toast.success("Eliminado");
    } catch { toast.error("Error"); }
    setEliminarItem(null);
  };

  const guardarItem = async () => {
    if (!form.titulo.trim()) { toast.error("Título requerido"); return; }
    if (crearTipo === "tarea") {
      await fetch("/api/tareas", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ titulo: form.titulo, descripcion: form.descripcion, estado: "PENDIENTE", tipo: form.tipoTarea, prioridad: form.prioridad, leadId: form.leadId || null, leadNombre: form.leadNombre || null, fechaVencimiento: form.fechaVencimiento || null }) });
      toast.success("Tarea creada");
      const res = await fetch("/api/tareas"); const d = await res.json();
      if (d.success && d.data) setTareas(d.data.map((t: any) => ({ ...t, fechaVencimiento: t.fechaVencimiento ? new Date(t.fechaVencimiento) : undefined, creadoEn: new Date(t.creadoEn || Date.now()) })));
    } else {
      await fetch("/api/recordatorios", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ titulo: form.titulo, descripcion: form.descripcion, tipo: form.canal, frecuencia: form.frecuencia, leadNombre: form.leadNombre || null, fechaEnvio: form.fechaEnvio ? `${form.fechaEnvio}T${form.horaEnvio}:00` : new Date().toISOString() }) });
      toast.success("Recordatorio creado");
      const res = await fetch("/api/recordatorios"); const d = await res.json();
      if (d.success && d.data) setRecordatorios(d.data.map((r: any) => ({ ...r, fechaEnvio: new Date(r.fechaEnvio), proximoEnvio: new Date(r.proximoEnvio), creadoEn: new Date(r.creadoEn || Date.now()) })));
    }
    setCrearTipo(null);
    setForm({ titulo: "", descripcion: "", tipoTarea: "SEGUIMIENTO", prioridad: "MEDIA", leadId: "", leadNombre: "", fechaVencimiento: "", fechaEnvio: "", canal: "whatsapp", frecuencia: "una_vez", horaEnvio: "09:00" });
  };

  const formatearFecha = (fecha: Date) => {
    const ahora = new Date();
    const diff = fecha.getTime() - ahora.getTime();
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    if (diff < 0) return "Vencido";
    if (horas < 1) return "En minutos";
    if (horas < 24) return `En ${horas}h`;
    if (dias === 0) return "Hoy";
    if (dias === 1) return "Mañana";
    return fecha.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
  };

  const cargando = cargandoTareas || cargandoRecordatorios;

  return (
    <div className="space-y-5">
      {/* Header + KPIs */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2"><ClipboardList size={20} /> Actividades</h1>
              <p className="text-blue-200/70 text-[11px]">Gestión unificada de tareas y recordatorios</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCrearTipo("tarea")} className="flex items-center gap-1.5 px-4 py-2 bg-white/20 text-white rounded-xl text-[11px] font-semibold hover:bg-white/30 transition-colors">
                <ClipboardList size={13} /> Nueva Tarea
              </button>
              <button onClick={() => setCrearTipo("recordatorio")} className="flex items-center gap-1.5 px-4 py-2 bg-[#FFD447] text-slate-900 rounded-xl text-[11px] font-semibold hover:bg-yellow-400 transition-colors">
                <Bell size={13} /> Nuevo Recordatorio
              </button>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Tareas Pendientes", value: stats.tareasPendientes, color: "text-amber-300" },
              { label: "En Progreso", value: stats.tareasEnProgreso, color: "text-blue-200" },
              { label: "Completadas", value: stats.tareasCompletadas, color: "text-emerald-300" },
              { label: "Recordatorios", value: stats.recPendientes, color: "text-purple-300" },
              { label: "Vencidas", value: stats.tareasVencidas, color: "text-red-300" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[9px] text-blue-200/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros + Vistas */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tabs vista */}
          <div className="flex bg-white rounded-xl p-1 border border-slate-200/60 shadow-sm">
            {[
              { id: "lista" as VistaActiva, label: "Lista", icono: <List size={13} /> },
              { id: "kanban" as VistaActiva, label: "Kanban", icono: <Columns3 size={13} /> },
              { id: "calendario" as VistaActiva, label: "Calendario", icono: <CalendarDays size={13} /> },
            ].map((v) => (
              <button key={v.id} onClick={() => setVista(v.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${vista === v.id ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-700"}`}>
                {v.icono} {v.label}
              </button>
            ))}
          </div>

          {/* Filtro tipo */}
          <div className="flex gap-1">
            {(["todos", "tarea", "recordatorio"] as const).map((t) => (
              <button key={t} onClick={() => setFiltroTipo(t)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${filtroTipo === t ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                {t === "todos" ? "Todo" : t === "tarea" ? "Tareas" : "Recordatorios"}
              </button>
            ))}
          </div>

          {/* Filtro estado */}
          <div className="flex gap-1">
            {(filtroTipo === "recordatorio" ? ESTADO_RECORDATORIOS : ESTADO_TAREAS).slice(0, 4).map((e) => (
              <button key={e.value} onClick={() => setFiltroEstado(e.value)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${filtroEstado === e.value ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar..."
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
        </div>
      </div>

      {/* Vista Lista */}
      {vista === "lista" && (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          {cargando ? (
            <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
          ) : itemsFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Sin actividades</p>
              <p className="text-[11px] text-slate-400">Crea una tarea o recordatorio para empezar</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-[9px] font-bold text-slate-400 uppercase">Actividad</th>
                  <th className="text-left px-3 py-3 text-[9px] font-bold text-slate-400 uppercase">Tipo</th>
                  <th className="text-left px-3 py-3 text-[9px] font-bold text-slate-400 uppercase">Estado</th>
                  <th className="text-left px-3 py-3 text-[9px] font-bold text-slate-400 uppercase">Prioridad</th>
                  <th className="text-left px-3 py-3 text-[9px] font-bold text-slate-400 uppercase">Lead</th>
                  <th className="text-left px-3 py-3 text-[9px] font-bold text-slate-400 uppercase">Fecha</th>
                  <th className="text-right px-4 py-3 text-[9px] font-bold text-slate-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {itemsFiltrados.map((item) => {
                  const tc = TIPO_CONFIG[item.tipo];
                  const Icon = tc.icono;
                  const isTarea = item.tipo === "tarea";
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {isTarea ? (
                            <button onClick={() => cambiarEstadoTarea(item.id, item.estado === "COMPLETADA" ? "PENDIENTE" : "COMPLETADA")}
                              className="flex-shrink-0">
                              {item.estado === "COMPLETADA" ? <CheckSquare size={15} className="text-emerald-500" /> : <Square size={15} className="text-slate-300" />}
                            </button>
                          ) : (
                            <button onClick={() => toggleActivo(item.id)} className="flex-shrink-0">
                              {item.activo ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} className="text-slate-300" />}
                            </button>
                          )}
                          <div>
                            <div className={`text-[11px] font-semibold ${item.estado === "COMPLETADA" || item.estado === "VENCIDA" ? "line-through text-slate-400" : "text-slate-800"}`}>{item.titulo}</div>
                            {item.leadNombre && <div className="text-[9px] text-slate-400">{item.leadNombre}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${tc.bg} ${tc.color}`}>{tc.label}</span></td>
                      <td className="px-3 py-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isTarea ? (ESTADOS_TAREA_CONFIG as any)[item.estado]?.color || "bg-slate-100 text-slate-600"
                          : item.estado === "enviado" ? "bg-emerald-100 text-emerald-700" : item.estado === "fallido" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {isTarea ? (ESTADOS_TAREA_CONFIG as any)[item.estado]?.label || item.estado : item.estado}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {item.prioridad && <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                          item.prioridad === "URGENTE" ? "bg-red-50 text-red-600" : item.prioridad === "ALTA" ? "bg-orange-50 text-orange-600" : item.prioridad === "MEDIA" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"
                        }`}>{item.prioridad}</span>}
                        {item.canal && <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${CANAL_CONFIG[item.canal]?.color || ""}`}>{CANAL_CONFIG[item.canal]?.label}</span>}
                      </td>
                      <td className="px-3 py-3"><span className="text-[10px] text-slate-500">{item.leadNombre || "-"}</span></td>
                      <td className="px-3 py-3"><span className="text-[10px] text-slate-500">{formatearFecha(item.fecha)}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isTarea && item.estado === "pendiente" && (
                            <button onClick={() => marcarEnviado(item.id)} className="p-1.5 hover:bg-blue-50 rounded-lg" title="Marcar enviado"><Send size={12} className="text-blue-500" /></button>
                          )}
                          <button onClick={() => setEliminarItem({ id: item.id, tipo: item.tipo })} className="p-1.5 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 size={12} className="text-red-400" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Vista Kanban */}
      {vista === "kanban" && (
        <div className="grid grid-cols-4 gap-4">
          {["PENDIENTE", "EN_PROGRESO", "COMPLETADA", "VENCIDA"].map((estado) => (
            <div key={estado} className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-100">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (ESTADOS_TAREA_CONFIG as any)[estado]?.color }} />
                <span className="text-[11px] font-bold text-slate-700">{(ESTADOS_TAREA_CONFIG as any)[estado]?.label}</span>
                <span className="text-[9px] text-slate-400 ml-auto">{tareas.filter((t) => t.estado === estado).length}</span>
              </div>
              {tareas.filter((t) => t.estado === estado).map((t) => (
                <div key={t.id} className="bg-white rounded-xl border border-slate-100 p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                      t.prioridad === "URGENTE" ? "bg-red-50 text-red-600" : t.prioridad === "ALTA" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                    }`}>{t.prioridad}</span>
                    <span className="text-[9px] text-slate-400">{t.tipo}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-800 mb-2">{t.titulo}</p>
                  {t.leadNombre && <p className="text-[9px] text-slate-400 mb-2">{t.leadNombre}</p>}
                  <div className="flex items-center gap-1 mt-2">
                    {t.estado !== "COMPLETADA" && (
                      <button onClick={() => cambiarEstadoTarea(t.id, t.estado === "PENDIENTE" ? "EN_PROGRESO" : "COMPLETADA")}
                        className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-semibold hover:bg-blue-100">
                        {t.estado === "PENDIENTE" ? "Iniciar" : "Completar"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Vista Calendario */}
      {vista === "calendario" && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Próximas actividades</h3>
          <div className="space-y-2">
            {itemsFiltrados.filter((i) => i.fecha >= new Date()).slice(0, 15).map((item) => {
              const tc = TIPO_CONFIG[item.tipo];
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="text-center min-w-[50px]">
                    <div className="text-[10px] font-bold text-slate-800">{item.fecha.getDate()}</div>
                    <div className="text-[9px] text-slate-400">{item.fecha.toLocaleDateString("es-CL", { month: "short" })}</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className={`w-8 h-8 ${tc.bg} rounded-lg flex items-center justify-center`}>
                    <tc.icono size={14} className={tc.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-slate-800 truncate">{item.titulo}</div>
                    <div className="text-[9px] text-slate-400">{formatearFecha(item.fecha)} · {tc.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Crear */}
      {crearTipo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCrearTipo(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4">{crearTipo === "tarea" ? "Nueva Tarea" : "Nuevo Recordatorio"}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Título *</label>
                <input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Descripción</label>
                <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Detalles..." rows={2}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
              </div>
              {crearTipo === "tarea" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Tipo</label>
                    <select value={form.tipoTarea} onChange={(e) => setForm({ ...form, tipoTarea: e.target.value as TipoTarea })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                      {Object.entries(TIPOS_TAREA_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Prioridad</label>
                    <div className="flex gap-1">
                      {(["BAJA", "MEDIA", "ALTA", "URGENTE"] as const).map((p) => (
                        <button key={p} onClick={() => setForm({ ...form, prioridad: p })}
                          className={`flex-1 py-2 rounded-lg text-[9px] font-bold transition-all ${form.prioridad === p ? "bg-blue-100 text-blue-700 border-2 border-blue-500" : "bg-slate-50 text-slate-500 border border-slate-200"}`}>
                          {p.slice(0, 4)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Canal</label>
                    <select value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                      <option value="email">Email</option><option value="whatsapp">WhatsApp</option>
                      <option value="llamada">Llamada</option><option value="sistema">Sistema</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Frecuencia</label>
                    <select value={form.frecuencia} onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                      <option value="una_vez">Una vez</option><option value="diario">Diario</option>
                      <option value="semanal">Semanal</option><option value="mensual">Mensual</option>
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Cliente asociado</label>
                <select value={form.leadId} onChange={(e) => {
                  const lead = leads.find((l) => l.id === e.target.value);
                  setForm({ ...form, leadId: e.target.value, leadNombre: lead ? `${lead.nombre} ${lead.apellido}` : "" });
                }} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                  <option value="">Sin cliente</option>
                  {leads.slice(0, 20).map((l) => <option key={l.id} value={l.id}>{l.nombre} {l.apellido}</option>)}
                </select>
              </div>
              {crearTipo === "tarea" && (
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Fecha vencimiento</label>
                  <input type="datetime-local" value={form.fechaVencimiento} onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setCrearTipo(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={guardarItem} className="flex-[2] py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">Crear {crearTipo === "tarea" ? "Tarea" : "Recordatorio"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar Eliminar */}
      <ConfirmDialog open={!!eliminarItem} onOpenChange={() => setEliminarItem(null)} title="Eliminar" description="¿Estás seguro? Esta acción no se puede deshacer." confirmLabel="Eliminar" variant="danger" onConfirm={eliminar} />
    </div>
  );
}
