"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Bell,
  Clock,
  Calendar,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Mail,
  MessageSquare,
  Phone,
  Trash2,
  Edit,
  Zap,
  Filter,
  Repeat,
  Send,
  Eye,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  ChevronDown,
  X,
  Timer,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ETAPAS_CONFIG } from "@/tipos";
import { useLeads } from "@/lib/contexts/LeadContext";
import { toast } from "sonner";
import type { Lead } from "@/tipos";

interface Recordatorio {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: "email" | "whatsapp" | "llamada" | "sistema";
  frecuencia: "una_vez" | "diario" | "semanal" | "mensual";
  leadId?: string;
  leadNombre?: string;
  fechaEnvio: Date;
  proximoEnvio: Date;
  estado: "pendiente" | "enviado" | "fallido" | "programado";
  activo: boolean;
  intentos: number;
  maxIntentos: number;
  creadoEn: Date;
  ultimoEnvio?: Date;
}

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icono: typeof Mail }> = {
  email: { label: "Email", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icono: Mail },
  whatsapp: { label: "WhatsApp", color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icono: MessageSquare },
  llamada: { label: "Llamada", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icono: Phone },
  sistema: { label: "Sistema", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", icono: Zap },
};

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pendiente: { label: "Pendiente", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-400" },
  enviado: { label: "Enviado", color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-400" },
  fallido: { label: "Fallido", color: "text-red-700", bg: "bg-red-50", dot: "bg-red-400" },
  programado: { label: "Programado", color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-400" },
};

const FRECUENCIA_CONFIG: Record<string, { label: string; icono: typeof Repeat }> = {
  una_vez: { label: "Una vez", icono: Timer },
  diario: { label: "Diario", icono: Repeat },
  semanal: { label: "Semanal", icono: Repeat },
  mensual: { label: "Mensual", icono: Repeat },
};

function formatearTiempoProximo(fecha: Date): string {
  const ahora = new Date();
  const diff = fecha.getTime() - ahora.getTime();
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);

  if (diff < 0) return "Vencido";
  if (horas < 1) return "En minutos";
  if (horas < 24) return `En ${horas}h`;
  if (dias === 1) return "Mañana";
  if (dias < 7) return `En ${dias} días`;
  return fecha.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

function formatearFechaCorta(fecha: Date): string {
  return fecha.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
}

export default function RecordatoriosPage() {
  const { leads } = useLeads();
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [crearOpen, setCrearOpen] = useState(false);
  const [editarRecordatorio, setEditarRecordatorio] = useState<Recordatorio | null>(null);
  const [eliminarId, setEliminarId] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<Recordatorio | null>(null);
  const [vista, setVista] = useState<"tarjetas" | "tabla">("tarjetas");

  const formularioVacio = {
    titulo: "",
    descripcion: "",
    tipo: "whatsapp" as Recordatorio["tipo"],
    frecuencia: "una_vez" as Recordatorio["frecuencia"],
    leadNombre: "",
    leadId: "",
    fechaEnvio: "",
    horaEnvio: "09:00",
  };
  const [form, setForm] = useState(formularioVacio);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/recordatorios");
        const json = await res.json();
        if (json.success && json.data) {
          setRecordatorios(json.data.map((r: Record<string, any>) => ({
            ...r,
            fechaEnvio: r.fechaEnvio ? new Date(r.fechaEnvio) : new Date(),
            proximoEnvio: r.proximoEnvio ? new Date(r.proximoEnvio) : new Date(),
            creadoEn: r.creadoEn ? new Date(r.creadoEn) : new Date(),
            ultimoEnvio: r.ultimoEnvio ? new Date(r.ultimoEnvio) : undefined,
          })));
        }
      } catch { setRecordatorios([]); }
      finally { setCargando(false); }
    }
    cargar();
  }, []);

  const leadsFiltrados = useMemo(() => leads.slice(0, 20), [leads]);

  const recordatoriosFiltrados = useMemo(() => {
    return recordatorios.filter((r) => {
      const coincideBusqueda = !busqueda ||
        r.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.leadNombre?.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEstado = filtroEstado === "todos" || r.estado === filtroEstado;
      const coincideTipo = filtroTipo === "todos" || r.tipo === filtroTipo;
      return coincideBusqueda && coincideEstado && coincideTipo;
    }).sort((a, b) => b.proximoEnvio.getTime() - a.proximoEnvio.getTime());
  }, [recordatorios, busqueda, filtroEstado, filtroTipo]);

  const stats = useMemo(() => ({
    total: recordatorios.length,
    pendientes: recordatorios.filter((r) => r.estado === "pendiente").length,
    enviados: recordatorios.filter((r) => r.estado === "enviado").length,
    fallidos: recordatorios.filter((r) => r.estado === "fallido").length,
    activos: recordatorios.filter((r) => r.activo).length,
    vencidos: recordatorios.filter((r) => r.proximoEnvio < new Date() && r.activo).length,
  }), [recordatorios]);

  const toggleActivo = async (id: string) => {
    const rec = recordatorios.find((r) => r.id === id);
    if (!rec) return;
    try {
      await fetch(`/api/recordatorios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ activo: !rec.activo }),
      });
      setRecordatorios((prev) => prev.map((r) => r.id === id ? { ...r, activo: !r.activo } : r));
      toast.success(rec.activo ? "Recordatorio pausado" : "Recordatorio activado");
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const marcarEnviado = async (id: string) => {
    try {
      await fetch(`/api/recordatorios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ estado: "enviado", ultimoEnvio: new Date().toISOString() }),
      });
      setRecordatorios((prev) => prev.map((r) => r.id === id ? { ...r, estado: "enviado" as const, ultimoEnvio: new Date() } : r));
      toast.success("Marcado como enviado");
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const eliminarRecordatorio = async () => {
    if (!eliminarId) return;
    try {
      await fetch(`/api/recordatorios/${eliminarId}`, { method: "DELETE", credentials: "include" });
      setRecordatorios((prev) => prev.filter((r) => r.id !== eliminarId));
      toast.success("Recordatorio eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
    setEliminarId(null);
  };

  const abrirEditar = (rec: Recordatorio) => {
    setEditarRecordatorio(rec);
    setForm({
      titulo: rec.titulo,
      descripcion: rec.descripcion || "",
      tipo: rec.tipo,
      frecuencia: rec.frecuencia,
      leadNombre: rec.leadNombre || "",
      leadId: rec.leadId || "",
      fechaEnvio: rec.fechaEnvio.toISOString().slice(0, 10),
      horaEnvio: rec.fechaEnvio.toTimeString().slice(0, 5),
    });
  };

  const guardarRecordatorio = async () => {
    if (!form.titulo.trim()) {
      toast.error("Ingresa un título");
      return;
    }
    const body = {
      titulo: form.titulo,
      descripcion: form.descripcion,
      tipo: form.tipo,
      frecuencia: form.frecuencia,
      leadNombre: form.leadNombre || null,
      leadId: form.leadId || null,
      fechaEnvio: form.fechaEnvio
        ? `${form.fechaEnvio}T${form.horaEnvio || "09:00"}:00`
        : new Date().toISOString(),
    };

    try {
      if (editarRecordatorio) {
        const res = await fetch(`/api/recordatorios/${editarRecordatorio.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setRecordatorios((prev) => prev.map((r) => r.id === editarRecordatorio.id
            ? { ...r, ...body, fechaEnvio: new Date(body.fechaEnvio) }
            : r
          ));
          toast.success("Recordatorio actualizado");
        }
      } else {
        const res = await fetch("/api/recordatorios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setRecordatorios((prev) => [{ ...json.data, fechaEnvio: new Date(json.data.fechaEnvio), proximoEnvio: new Date(json.data.proximoEnvio), creadoEn: new Date(json.data.creadoEn) }, ...prev]);
          toast.success("Recordatorio creado");
        }
      }
    } catch {
      toast.error(editarRecordatorio ? "Error al actualizar" : "Error al crear");
    }
    setCrearOpen(false);
    setEditarRecordatorio(null);
    setForm(formularioVacio);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell size={22} className="text-blue-500" />
            Recordatorios
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Gestiona alertas y seguimientos automáticos</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setVista("tarjetas")}
              className={`px-3 py-2 text-[10px] font-semibold transition-colors ${vista === "tarjetas" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"}`}
            >
              Tarjetas
            </button>
            <button
              onClick={() => setVista("tabla")}
              className={`px-3 py-2 text-[10px] font-semibold transition-colors ${vista === "tabla" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"}`}
            >
              Tabla
            </button>
          </div>
          <button
            onClick={() => { setEditarRecordatorio(null); setForm(formularioVacio); setCrearOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
          >
            <Plus size={14} /> Nuevo Recordatorio
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-slate-900", bg: "bg-slate-50", iconBg: "bg-slate-100", Icon: Bell, iconColor: "text-slate-500" },
          { label: "Pendientes", value: stats.pendientes, color: "text-amber-600", bg: "bg-amber-50/50", iconBg: "bg-amber-100", Icon: Clock, iconColor: "text-amber-500" },
          { label: "Enviados", value: stats.enviados, color: "text-emerald-600", bg: "bg-emerald-50/50", iconBg: "bg-emerald-100", Icon: CheckCircle, iconColor: "text-emerald-500" },
          { label: "Fallidos", value: stats.fallidos, color: "text-red-600", bg: "bg-red-50/50", iconBg: "bg-red-100", Icon: XCircle, iconColor: "text-red-500" },
          { label: "Activos", value: stats.activos, color: "text-blue-600", bg: "bg-blue-50/50", iconBg: "bg-blue-100", Icon: Zap, iconColor: "text-blue-500" },
        ].map((kpi) => (
          <div key={kpi.label} className={`${kpi.bg} rounded-xl border border-slate-100/80 p-3.5`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 ${kpi.iconBg} rounded-lg flex items-center justify-center`}>
                <kpi.Icon size={15} className={kpi.iconColor} />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">{kpi.label}</span>
            </div>
            <div className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 min-w-0 w-full sm:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar recordatorios..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/60 rounded-lg text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mr-1">Estado:</span>
          {["todos", "pendiente", "enviado", "fallido", "programado"].map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                filtroEstado === e ? "bg-blue-600 text-white" : "bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {e === "todos" ? "Todos" : ESTADO_CONFIG[e]?.label || e}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mr-1">Canal:</span>
          {["todos", "email", "whatsapp", "llamada", "sistema"].map((t) => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                filtroTipo === t ? "bg-blue-600 text-white" : "bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {t === "todos" ? "Todos" : TIPO_CONFIG[t]?.label || t}
            </button>
          ))}
        </div>
      </div>

      {/* Vista Tarjetas */}
      {vista === "tarjetas" && (
        <div className="space-y-3">
          {recordatoriosFiltrados.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell size={28} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No hay recordatorios</p>
              <p className="text-[11px] text-slate-400 mt-1 mb-4">Crea tu primer recordatorio para empezar</p>
              <button
                onClick={() => { setEditarRecordatorio(null); setForm(formularioVacio); setCrearOpen(true); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-[11px] font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus size={13} /> Crear Recordatorio
              </button>
            </div>
          ) : (
            recordatoriosFiltrados.map((rec) => {
              const tipo = TIPO_CONFIG[rec.tipo] || TIPO_CONFIG.sistema;
              const estado = ESTADO_CONFIG[rec.estado] || ESTADO_CONFIG.pendiente;
              const TipoIcon = tipo.icono;
              const FrecIcon = FRECUENCIA_CONFIG[rec.frecuencia]?.icono || Repeat;
              const proximo = formatearTiempoProximo(rec.proximoEnvio);
              const vencido = rec.proximoEnvio < new Date() && rec.activo;

              return (
                <div key={rec.id} className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md group ${vencido ? "border-red-200 bg-red-50/30" : "border-slate-100"}`}>
                  <div className="flex items-start gap-4">
                    {/* Icono tipo */}
                    <div className={`w-11 h-11 ${tipo.bg} rounded-xl flex items-center justify-center flex-shrink-0 border ${tipo.border}`}>
                      <TipoIcon size={18} className={tipo.color} />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[13px] font-bold text-slate-800 truncate">{rec.titulo}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${estado.bg} ${estado.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
                          {estado.label}
                        </span>
                        {vencido && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[9px] font-bold">
                            <AlertCircle size={9} /> Vencido
                          </span>
                        )}
                      </div>
                      {rec.descripcion && (
                        <p className="text-[11px] text-slate-400 truncate mb-2">{rec.descripcion}</p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                          <FrecIcon size={10} className="text-slate-400" />
                          {FRECUENCIA_CONFIG[rec.frecuencia]?.label}
                        </span>
                        {rec.leadNombre && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                            <Users size={10} className="text-slate-400" />
                            {rec.leadNombre}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                          <Calendar size={10} className="text-slate-400" />
                          {formatearFechaCorta(rec.proximoEnvio)}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${vencido ? "text-red-500" : "text-blue-500"}`}>
                          <Clock size={10} />
                          {proximo}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => toggleActivo(rec.id)}
                        className={`p-2 rounded-lg transition-colors ${rec.activo ? "hover:bg-emerald-50 text-emerald-500" : "hover:bg-slate-100 text-slate-400"}`}
                        title={rec.activo ? "Pausar" : "Activar"}
                      >
                        {rec.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      {rec.estado === "pendiente" && (
                        <button
                          onClick={() => marcarEnviado(rec.id)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-500"
                          title="Marcar enviado"
                        >
                          <Send size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setDetalle(rec)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                        title="Ver detalle"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => abrirEditar(rec)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                        title="Editar"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setEliminarId(rec.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-400"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Vista Tabla */}
      {vista === "tabla" && (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Recordatorio</th>
                <th className="text-left px-3 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Canal</th>
                <th className="text-left px-3 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                <th className="text-left px-3 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Frecuencia</th>
                <th className="text-left px-3 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Próximo envío</th>
                <th className="text-left px-3 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="text-center px-3 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Activo</th>
                <th className="text-right px-4 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recordatoriosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Bell size={24} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-[11px] text-slate-400">No hay recordatorios</p>
                  </td>
                </tr>
              ) : recordatoriosFiltrados.map((rec) => {
                const tipo = TIPO_CONFIG[rec.tipo] || TIPO_CONFIG.sistema;
                const estado = ESTADO_CONFIG[rec.estado] || ESTADO_CONFIG.pendiente;
                const TipoIcon = tipo.icono;

                return (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 ${tipo.bg} rounded-lg flex items-center justify-center`}>
                          <TipoIcon size={14} className={tipo.color} />
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-slate-800">{rec.titulo}</div>
                          <div className="text-[9px] text-slate-400 truncate max-w-[180px]">{rec.descripcion || "Sin descripción"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${tipo.bg} ${tipo.color}`}>{tipo.label}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[11px] text-slate-600">{rec.leadNombre || "Global"}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] text-slate-500">{FRECUENCIA_CONFIG[rec.frecuencia]?.label}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] text-slate-500">{formatearFechaCorta(rec.proximoEnvio)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${estado.bg} ${estado.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
                        {estado.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => toggleActivo(rec.id)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rec.activo ? "bg-emerald-500" : "bg-slate-300"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${rec.activo ? "translate-x-4" : "translate-x-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setDetalle(rec)} className="p-1.5 hover:bg-slate-100 rounded-md" title="Ver"><Eye size={12} className="text-slate-400" /></button>
                        <button onClick={() => abrirEditar(rec)} className="p-1.5 hover:bg-slate-100 rounded-md" title="Editar"><Edit size={12} className="text-slate-400" /></button>
                        <button onClick={() => setEliminarId(rec.id)} className="p-1.5 hover:bg-red-50 rounded-md" title="Eliminar"><Trash2 size={12} className="text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear / Editar */}
      <Dialog open={crearOpen} onOpenChange={(open) => { setCrearOpen(open); if (!open) { setEditarRecordatorio(null); setForm(formularioVacio); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editarRecordatorio ? <Edit size={16} className="text-blue-500" /> : <Plus size={16} className="text-blue-500" />}
              {editarRecordatorio ? "Editar Recordatorio" : "Nuevo Recordatorio"}
            </DialogTitle>
            <DialogDescription>
              {editarRecordatorio ? "Modifica los datos del recordatorio" : "Crea un recordatorio para hacer seguimiento"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700">Título *</label>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej: Seguimiento documentos pendientes"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Detalles del recordatorio..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Canal</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["email", "whatsapp", "llamada", "sistema"] as const).map((t) => {
                    const cfg = TIPO_CONFIG[t];
                    const Icon = cfg.icono;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, tipo: t })}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-[10px] font-semibold transition-all ${
                          form.tipo === t
                            ? `${cfg.bg} ${cfg.color} ${cfg.border} border-2`
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <Icon size={12} /> {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Frecuencia</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["una_vez", "diario", "semanal", "mensual"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setForm({ ...form, frecuencia: f })}
                      className={`px-2.5 py-2 rounded-lg border text-[10px] font-semibold transition-all ${
                        form.frecuencia === f
                          ? "bg-blue-50 text-blue-600 border-blue-200 border-2"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {FRECUENCIA_CONFIG[f]?.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700">Cliente (opcional)</label>
              <select
                value={form.leadId}
                onChange={(e) => {
                  const lead = leadsFiltrados.find((l) => l.id === e.target.value);
                  setForm({ ...form, leadId: e.target.value, leadNombre: lead ? `${lead.nombre} ${lead.apellido}` : "" });
                }}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              >
                <option value="">Global (todos los clientes)</option>
                {leadsFiltrados.map((lead) => (
                  <option key={lead.id} value={lead.id}>{lead.nombre} {lead.apellido}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Fecha</label>
                <input
                  type="date"
                  value={form.fechaEnvio}
                  onChange={(e) => setForm({ ...form, fechaEnvio: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Hora</label>
                <input
                  type="time"
                  value={form.horaEnvio}
                  onChange={(e) => setForm({ ...form, horaEnvio: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => { setCrearOpen(false); setEditarRecordatorio(null); setForm(formularioVacio); }}
              className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={guardarRecordatorio}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
            >
              {editarRecordatorio ? "Guardar Cambios" : "Crear Recordatorio"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle */}
      <Dialog open={!!detalle} onOpenChange={() => setDetalle(null)}>
        <DialogContent className="sm:max-w-md">
          {detalle && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye size={16} className="text-blue-500" />
                  Detalle del Recordatorio
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase">Título</span>
                  <p className="text-[13px] font-bold text-slate-800">{detalle.titulo}</p>
                </div>
                {detalle.descripcion && (
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">Descripción</span>
                    <p className="text-[12px] text-slate-600">{detalle.descripcion}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">Canal</span>
                    <p className={`text-[11px] font-semibold ${TIPO_CONFIG[detalle.tipo]?.color}`}>
                      {TIPO_CONFIG[detalle.tipo]?.label}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">Frecuencia</span>
                    <p className="text-[11px] font-semibold text-slate-700">{FRECUENCIA_CONFIG[detalle.frecuencia]?.label}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">Cliente</span>
                    <p className="text-[11px] font-semibold text-slate-700">{detalle.leadNombre || "Global"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">Estado</span>
                    <p className={`text-[11px] font-semibold ${ESTADO_CONFIG[detalle.estado]?.color}`}>
                      {ESTADO_CONFIG[detalle.estado]?.label}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">Próximo envío</span>
                    <p className="text-[11px] font-semibold text-slate-700">{formatearFechaCorta(detalle.proximoEnvio)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">Intentos</span>
                    <p className="text-[11px] font-semibold text-slate-700">{detalle.intentos} / {detalle.maxIntentos}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button onClick={() => setDetalle(null)} className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Cerrar
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar Eliminar */}
      <ConfirmDialog
        open={!!eliminarId}
        onOpenChange={() => setEliminarId(null)}
        title="Eliminar Recordatorio"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={eliminarRecordatorio}
      />
    </div>
  );
}
