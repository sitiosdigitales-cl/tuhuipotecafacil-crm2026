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
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Repeat,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

const tipoConfig: Record<string, { label: string; color: string; bg: string; icono: React.ReactNode }> = {
  email: { label: "Email", color: "text-blue-600", bg: "bg-blue-50", icono: <Mail size={14} /> },
  whatsapp: { label: "WhatsApp", color: "text-green-600", bg: "bg-green-50", icono: <MessageSquare size={14} /> },
  llamada: { label: "Llamada", color: "text-amber-600", bg: "bg-amber-50", icono: <Phone size={14} /> },
  sistema: { label: "Sistema", color: "text-purple-600", bg: "bg-purple-50", icono: <Zap size={14} /> },
};

const estadoConfig: Record<string, { label: string; color: string; bg: string; icono: React.ReactNode }> = {
  pendiente: { label: "Pendiente", color: "text-amber-600", bg: "bg-amber-50", icono: <Clock size={12} /> },
  enviado: { label: "Enviado", color: "text-emerald-600", bg: "bg-emerald-50", icono: <CheckCircle size={12} /> },
  fallido: { label: "Fallido", color: "text-red-600", bg: "bg-red-50", icono: <XCircle size={12} /> },
  programado: { label: "Programado", color: "text-blue-600", bg: "bg-blue-50", icono: <Calendar size={12} /> },
};

const frecuenciaConfig: Record<string, { label: string; icono: React.ReactNode }> = {
  una_vez: { label: "Una vez", icono: <Target size={12} /> },
  diario: { label: "Diario", icono: <Repeat size={12} /> },
  semanal: { label: "Semanal", icono: <Repeat size={12} /> },
  mensual: { label: "Mensual", icono: <Repeat size={12} /> },
};

export default function RecordatoriosPage() {
  const { leads } = useLeads();
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [crearOpen, setCrearOpen] = useState(false);
  const [detalle, setDetalle] = useState<Recordatorio | null>(null);
  const [nuevoRecordatorio, setNuevoRecordatorio] = useState({
    titulo: "",
    descripcion: "",
    tipo: "whatsapp" as Recordatorio["tipo"],
    frecuencia: "una_vez" as Recordatorio["frecuencia"],
    leadNombre: "",
    fechaEnvio: "",
    horaEnvio: "09:00",
  });

  useEffect(() => {
    async function cargarRecordatorios() {
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
      } catch {
        setRecordatorios([]);
      } finally {
        setCargando(false);
      }
    }
    cargarRecordatorios();
  }, []);

  const leadsFiltrados = useMemo(() => leads.slice(0, 15), [leads]);

  const recordatoriosFiltrados = useMemo(() => {
    return recordatorios.filter((r) => {
      const coincideBusqueda = !busqueda || r.titulo.toLowerCase().includes(busqueda.toLowerCase()) || r.leadNombre?.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEstado = filtroEstado === "todos" || r.estado === filtroEstado;
      const coincideTipo = filtroTipo === "todos" || r.tipo === filtroTipo;
      return coincideBusqueda && coincideEstado && coincideTipo;
    });
  }, [recordatorios, busqueda, filtroEstado, filtroTipo]);

  const stats = useMemo(() => {
    const total = recordatorios.length;
    const pendientes = recordatorios.filter((r) => r.estado === "pendiente").length;
    const enviados = recordatorios.filter((r) => r.estado === "enviado").length;
    const fallidos = recordatorios.filter((r) => r.estado === "fallido").length;
    const activos = recordatorios.filter((r) => r.activo).length;
    return { total, pendientes, enviados, fallidos, activos };
  }, [recordatorios]);

  const toggleActivo = async (id: string) => {
    const rec = recordatorios.find((r) => r.id === id);
    if (!rec) return;
    try {
      await fetch(`/api/recordatorios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !rec.activo }),
      });
      setRecordatorios((prev) =>
        prev.map((r) => (r.id === id ? { ...r, activo: !r.activo } : r))
      );
      toast.success(rec.activo ? "Recordatorio desactivado" : "Recordatorio activado");
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const eliminarRecordatorio = async (id: string) => {
    try {
      await fetch(`/api/recordatorios/${id}`, { method: "DELETE" });
      setRecordatorios((prev) => prev.filter((r) => r.id !== id));
      toast.success("Recordatorio eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const crearRecordatorio = async () => {
    if (!nuevoRecordatorio.titulo) {
      toast.error("Ingresa un título");
      return;
    }
    try {
      const res = await fetch("/api/recordatorios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: nuevoRecordatorio.titulo,
          descripcion: nuevoRecordatorio.descripcion,
          tipo: nuevoRecordatorio.tipo,
          frecuencia: nuevoRecordatorio.frecuencia,
          leadNombre: nuevoRecordatorio.leadNombre || null,
          fechaEnvio: nuevoRecordatorio.fechaEnvio
            ? `${nuevoRecordatorio.fechaEnvio}T${nuevoRecordatorio.horaEnvio || "09:00"}:00`
            : new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setRecordatorios((prev) => [{ ...json.data, fechaEnvio: new Date(json.data.fechaEnvio), proximoEnvio: new Date(json.data.proximoEnvio), creadoEn: new Date(json.data.creadoEn) }, ...prev]);
        setCrearOpen(false);
        setNuevoRecordatorio({ titulo: "", descripcion: "", tipo: "whatsapp", frecuencia: "una_vez", leadNombre: "", fechaEnvio: "", horaEnvio: "09:00" });
        toast.success("Recordatorio creado");
      }
    } catch {
      toast.error("Error al crear");
    }
  };

  const formatearFecha = (fecha: Date) => {
    const hoy = new Date();
    const diff = hoy.getTime() - fecha.getTime();
    const horas = Math.floor(diff / 3600000);
    if (horas < 1) return "Hace minutos";
    if (horas < 24) return `Hace ${horas}h`;
    return fecha.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Recordatorios</h1>
          <p className="text-[11px] text-slate-400">Gestión de recordatorios automáticos y alertas</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={14} /> Configurar
          </button>
          <button
            onClick={() => setCrearOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
          >
            <Plus size={14} /> Nuevo Recordatorio
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bell size={18} className="text-blue-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Total</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-amber-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Pendientes</span>
          </div>
          <div className="text-xl font-bold text-amber-600">{stats.pendientes}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Enviados</span>
          </div>
          <div className="text-xl font-bold text-emerald-600">{stats.enviados}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle size={18} className="text-red-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Fallidos</span>
          </div>
          <div className="text-xl font-bold text-red-600">{stats.fallidos}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-blue-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Activos</span>
          </div>
          <div className="text-xl font-bold text-blue-600">{stats.activos}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar recordatorio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {["todos", "pendiente", "enviado", "fallido", "programado"].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-2 rounded-xl text-[10px] font-semibold transition-all ${
                  filtroEstado === estado
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {estado === "todos" ? "Todos" : estado.charAt(0).toUpperCase() + estado.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            {["todos", "email", "whatsapp", "llamada", "sistema"].map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-3 py-2 rounded-xl text-[10px] font-semibold transition-all ${
                  filtroTipo === tipo
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {tipo === "todos" ? "Todos" : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-soft">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recordatorio</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Frecuencia</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Próximo Envío</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activo</th>
              <th className="text-right px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {recordatoriosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                      <Bell size={24} className="text-slate-300" />
                    </div>
                    <p className="text-[12px] font-semibold text-slate-600">No se encontraron recordatorios</p>
                    <p className="text-[10px] text-slate-400 mt-1">Ajusta los filtros o crea un nuevo recordatorio</p>
                  </div>
                </td>
              </tr>
            ) : (
              recordatoriosFiltrados.map((rec) => {
                const tipo = tipoConfig[rec.tipo] || tipoConfig.sistema;
                const estado = estadoConfig[rec.estado] || estadoConfig.pendiente;
                return (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${tipo.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          {tipo.icono}
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-slate-800">{rec.titulo}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{rec.descripcion}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${tipo.bg} ${tipo.color}`}>
                        {tipo.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] text-slate-600 font-medium">{rec.leadNombre || "Global"}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] text-slate-600">{frecuenciaConfig[rec.frecuencia]?.label}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] text-slate-600">{formatearFecha(rec.proximoEnvio)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${estado.bg} ${estado.color}`}>
                        {estado.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleActivo(rec.id)}
                        className={`w-10 h-6 rounded-full transition-colors ${
                          rec.activo ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                          rec.activo ? "translate-x-5" : "translate-x-0.5"
                        }`} />
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetalle(rec)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Edit size={14} className="text-slate-400" />
                        </button>
                        <button
                          onClick={() => eliminarRecordatorio(rec.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear Recordatorio */}
      <Dialog open={crearOpen} onOpenChange={setCrearOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Recordatorio</DialogTitle>
            <DialogDescription>Crea un recordatorio para un cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700">Título *</label>
              <input
                type="text"
                value={nuevoRecordatorio.titulo}
                onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, titulo: e.target.value })}
                placeholder="Ej: Seguimiento documentos"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700">Descripción</label>
              <textarea
                value={nuevoRecordatorio.descripcion}
                onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, descripcion: e.target.value })}
                placeholder="Detalles del recordatorio..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Tipo</label>
                <select
                  value={nuevoRecordatorio.tipo}
                  onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, tipo: e.target.value as Recordatorio["tipo"] })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="llamada">Llamada</option>
                  <option value="sistema">Sistema</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Frecuencia</label>
                <select
                  value={nuevoRecordatorio.frecuencia}
                  onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, frecuencia: e.target.value as Recordatorio["frecuencia"] })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                >
                  <option value="una_vez">Una vez</option>
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700">Cliente (opcional)</label>
              <select
                value={nuevoRecordatorio.leadNombre}
                onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, leadNombre: e.target.value })}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              >
                <option value="">Global (todos los clientes)</option>
                {leadsFiltrados.map((lead) => (
                  <option key={lead.id} value={`${lead.nombre} ${lead.apellido}`}>
                    {lead.nombre} {lead.apellido}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Fecha</label>
                <input
                  type="date"
                  value={nuevoRecordatorio.fechaEnvio}
                  onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, fechaEnvio: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Hora</label>
                <input
                  type="time"
                  value={nuevoRecordatorio.horaEnvio}
                  onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, horaEnvio: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              onClick={() => setCrearOpen(false)}
              className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={crearRecordatorio}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
            >
              Crear Recordatorio
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
