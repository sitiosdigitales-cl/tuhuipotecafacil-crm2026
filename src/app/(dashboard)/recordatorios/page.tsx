"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Bell,
  BellRing,
  Clock,
  Calendar,
  User,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  XCircle,
  Mail,
  MessageSquare,
  Phone,
  Trash2,
  Edit,
  Eye,
  ToggleLeft,
  ToggleRight,
  Zap,
  FileText,
  Send,
  Target,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Repeat,
  Settings,
  X,
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

// Recordatorios mock
function generarRecordatorios(): Recordatorio[] {
  const hoy = new Date();
  return [
    {
      id: "r1",
      titulo: "Documentos pendientes",
      descripcion: "Recordar envío de documentos faltantes",
      tipo: "whatsapp",
      frecuencia: "una_vez",
      leadId: "lead-1",
      leadNombre: "María González",
      fechaEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 9, 0),
      proximoEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 9, 0),
      estado: "enviado",
      activo: true,
      intentos: 1,
      maxIntentos: 3,
      creadoEn: new Date(hoy.getTime() - 86400000),
      ultimoEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 9, 5),
    },
    {
      id: "r2",
      titulo: "Seguimiento evaluación bancaria",
      descripcion: "Consultar estado de evaluación",
      tipo: "llamada",
      frecuencia: "una_vez",
      leadId: "lead-2",
      leadNombre: "Carlos Rojas",
      fechaEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 14, 0),
      proximoEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 14, 0),
      estado: "pendiente",
      activo: true,
      intentos: 0,
      maxIntentos: 3,
      creadoEn: new Date(hoy.getTime() - 43200000),
    },
    {
      id: "r3",
      titulo: "Recordatorio reunión",
      descripcion: "Confirmar asistencia a reunión",
      tipo: "email",
      frecuencia: "una_vez",
      leadId: "lead-4",
      leadNombre: "Ana Torres",
      fechaEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 8, 0),
      proximoEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 8, 0),
      estado: "programado",
      activo: true,
      intentos: 0,
      maxIntentos: 2,
      creadoEn: new Date(hoy.getTime() - 86400000),
    },
    {
      id: "r4",
      titulo: "Seguimiento semanal documentos",
      descripcion: "Revisión automática de documentos pendientes",
      tipo: "sistema",
      frecuencia: "semanal",
      fechaEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 10, 0),
      proximoEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 7, 10, 0),
      estado: "programado",
      activo: true,
      intentos: 0,
      maxIntentos: 1,
      creadoEn: new Date(hoy.getTime() - 604800000),
    },
    {
      id: "r5",
      titulo: "Recordatorio pago cuota",
      descripcion: "Alertar sobre próximo vencimiento",
      tipo: "whatsapp",
      frecuencia: "mensual",
      leadId: "lead-5",
      leadNombre: "Diego Díaz",
      fechaEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), 28, 9, 0),
      proximoEnvio: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 28, 9, 0),
      estado: "programado",
      activo: true,
      intentos: 0,
      maxIntentos: 3,
      creadoEn: new Date(hoy.getTime() - 2592000000),
    },
    {
      id: "r6",
      titulo: "Alerta documentos vencidos",
      descripcion: "Notificar documentos con vigencia próxima a vencer",
      tipo: "email",
      frecuencia: "diario",
      fechaEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 8, 0),
      proximoEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 8, 0),
      estado: "enviado",
      activo: true,
      intentos: 1,
      maxIntentos: 1,
      creadoEn: new Date(hoy.getTime() - 604800000),
      ultimoEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 8, 2),
    },
    {
      id: "r7",
      titulo: "Recordatorio firma digital",
      descripcion: "Solicitar firma de documentos pendientes",
      tipo: "whatsapp",
      frecuencia: "una_vez",
      leadId: "lead-6",
      leadNombre: "Sofía Martínez",
      fechaEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 11, 0),
      proximoEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 11, 0),
      estado: "fallido",
      activo: true,
      intentos: 3,
      maxIntentos: 3,
      creadoEn: new Date(hoy.getTime() - 172800000),
      ultimoEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 11, 15),
    },
    {
      id: "r8",
      titulo: "Bienvenida nuevo lead",
      descripcion: "Enviar mensaje de bienvenida automático",
      tipo: "whatsapp",
      frecuencia: "una_vez",
      leadId: "lead-7",
      leadNombre: "Roberto Silva",
      fechaEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1, 10, 0),
      proximoEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1, 10, 0),
      estado: "enviado",
      activo: false,
      intentos: 1,
      maxIntentos: 2,
      creadoEn: new Date(hoy.getTime() - 259200000),
      ultimoEnvio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1, 10, 5),
    },
  ];
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

  // Recordatorios filtrados
  const recordatoriosFiltrados = useMemo(() => {
    return recordatorios.filter((r) => {
      const coincideBusqueda = !busqueda || r.titulo.toLowerCase().includes(busqueda.toLowerCase()) || r.leadNombre?.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEstado = filtroEstado === "todos" || r.estado === filtroEstado;
      const coincideTipo = filtroTipo === "todos" || r.tipo === filtroTipo;
      return coincideBusqueda && coincideEstado && coincideTipo;
    });
  }, [recordatorios, busqueda, filtroEstado, filtroTipo]);

  // Estadísticas
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
    } catch {
      // Error silencioso
    }
  };

  const eliminarRecordatorio = async (id: string) => {
    try {
      await fetch(`/api/recordatorios/${id}`, { method: "DELETE" });
      setRecordatorios((prev) => prev.filter((r) => r.id !== id));
      setDetalle(null);
    } catch {
      // Error silencioso
    }
  };

  const handleCrear = async () => {
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
          fechaEnvio: new Date(`${nuevoRecordatorio.fechaEnvio}T${nuevoRecordatorio.horaEnvio}`).toISOString(),
          proximoEnvio: new Date(`${nuevoRecordatorio.fechaEnvio}T${nuevoRecordatorio.horaEnvio}`).toISOString(),
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setRecordatorios((prev) => [{
          ...json.data,
          fechaEnvio: new Date(json.data.fechaEnvio),
          proximoEnvio: new Date(json.data.proximoEnvio),
          creadoEn: new Date(json.data.creadoEn),
        }, ...prev]);
      }
    } catch {
      // Error silencioso
    }
    setCrearOpen(false);
    setNuevoRecordatorio({
      titulo: "",
      descripcion: "",
      tipo: "whatsapp",
      frecuencia: "una_vez",
      leadNombre: "",
      fechaEnvio: "",
      horaEnvio: "09:00",
    });
  };

  const formatearFecha = (fecha: Date) => {
    const ahora = new Date();
    const diff = fecha.getTime() - ahora.getTime();
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (diff < 0) return "Vencido";
    if (horas < 1) return "En minutos";
    if (horas < 24) return `En ${horas}h`;
    if (dias < 7) return `En ${dias}d`;
    return fecha.toLocaleDateString("es-CL");
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-slate-500">Cargando recordatorios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Recordatorios</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Gestión de recordatorios automáticos y alertas</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <Settings size={14} /> Configurar
          </button>
          <button
            onClick={() => setCrearOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 gradient-primary text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15"
          >
            <Plus size={14} /> Nuevo Recordatorio
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <Bell size={14} className="text-slate-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Total</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock size={14} className="text-amber-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Pendientes</span>
          </div>
          <div className="text-xl font-bold text-amber-600">{stats.pendientes}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={14} className="text-emerald-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Enviados</span>
          </div>
          <div className="text-xl font-bold text-emerald-600">{stats.enviados}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle size={14} className="text-red-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Fallidos</span>
          </div>
          <div className="text-xl font-bold text-red-600">{stats.fallidos}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-blue-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Activos</span>
          </div>
          <div className="text-xl font-bold text-blue-600">{stats.activos}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 border border-slate-100/80">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar recordatorio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="flex gap-1.5">
            {["todos", "pendiente", "enviado", "fallido", "programado"].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-2.5 py-2 rounded-lg text-[9px] font-semibold transition-colors ${
                  filtroEstado === estado ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {estado === "todos" ? "Todos" : estadoConfig[estado]?.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {["todos", "email", "whatsapp", "llamada", "sistema"].map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-2.5 py-2 rounded-lg text-[9px] font-semibold transition-colors ${
                  filtroTipo === tipo ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tipo === "todos" ? "Todos" : tipoConfig[tipo]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Recordatorios */}
      <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase">Recordatorio</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase">Tipo</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase">Cliente</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase">Frecuencia</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase">Próximo Envío</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase">Estado</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase">Activo</th>
              <th className="text-right px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {recordatoriosFiltrados.map((r) => (
              <tr key={r.id} className="border-b border-slate-50/80 hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tipoConfig[r.tipo].bg} ${tipoConfig[r.tipo].color}`}>
                      {tipoConfig[r.tipo].icono}
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-800">{r.titulo}</div>
                      <div className="text-[9px] text-slate-400 truncate max-w-[200px]">{r.descripcion}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full ${tipoConfig[r.tipo].bg} ${tipoConfig[r.tipo].color}`}>
                    {tipoConfig[r.tipo].icono}
                    {tipoConfig[r.tipo].label}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {r.leadNombre ? (
                    <div className="flex items-center gap-1.5">
                      <User size={10} className="text-slate-400" />
                      <span className="text-[10px] text-slate-700 font-medium">{r.leadNombre}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">General</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    {frecuenciaConfig[r.frecuencia].icono}
                    <span className="text-[10px] text-slate-600">{frecuenciaConfig[r.frecuencia].label}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-[10px] font-semibold text-slate-700">{formatearFecha(r.proximoEnvio)}</div>
                  <div className="text-[9px] text-slate-400">{r.proximoEnvio.toLocaleDateString("es-CL")}</div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full ${estadoConfig[r.estado].bg} ${estadoConfig[r.estado].color}`}>
                    {estadoConfig[r.estado].icono}
                    {estadoConfig[r.estado].label}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button onClick={() => toggleActivo(r.id)} className="transition-colors">
                    {r.activo ? (
                      <ToggleRight size={24} className="text-blue-500" />
                    ) : (
                      <ToggleLeft size={24} className="text-slate-300" />
                    )}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setDetalle(r)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                      <Eye size={12} className="text-slate-400" />
                    </button>
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                      <Edit size={12} className="text-slate-400" />
                    </button>
                    <button onClick={() => eliminarRecordatorio(r.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {recordatoriosFiltrados.length === 0 && (
          <div className="p-12 text-center">
            <Bell size={40} className="text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-600">No se encontraron recordatorios</p>
            <p className="text-[11px] text-slate-400 mt-1">Ajusta los filtros o crea un nuevo recordatorio</p>
          </div>
        )}
      </div>

      {/* Modal Crear Recordatorio */}
      <Dialog open={crearOpen} onOpenChange={setCrearOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0">
          <DialogHeader className="p-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <BellRing size={18} className="text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-slate-900">Nuevo Recordatorio</DialogTitle>
                <DialogDescription className="text-slate-500">Configura un nuevo recordatorio automático</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-5 space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Título</label>
              <input
                type="text"
                placeholder="Ej: Recordatorio de documentos..."
                value={nuevoRecordatorio.titulo}
                onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, titulo: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Descripción</label>
              <textarea
                placeholder="Descripción del recordatorio..."
                value={nuevoRecordatorio.descripcion}
                onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, descripcion: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Tipo de Envío</label>
                <select
                  value={nuevoRecordatorio.tipo}
                  onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, tipo: e.target.value as Recordatorio["tipo"] })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
                >
                  {Object.entries(tipoConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Frecuencia</label>
                <select
                  value={nuevoRecordatorio.frecuencia}
                  onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, frecuencia: e.target.value as Recordatorio["frecuencia"] })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
                >
                  {Object.entries(frecuenciaConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Cliente (opcional)</label>
              <select
                value={nuevoRecordatorio.leadNombre}
                onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, leadNombre: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
              >
                <option value="">Recordatorio general</option>
                {leadsFiltrados.slice(0, 10).map((lead) => (
                  <option key={lead.id} value={`${lead.nombre} ${lead.apellido}`}>{lead.nombre} {lead.apellido}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Fecha</label>
                <input
                  type="date"
                  value={nuevoRecordatorio.fechaEnvio}
                  onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, fechaEnvio: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Hora</label>
                <input
                  type="time"
                  value={nuevoRecordatorio.horaEnvio}
                  onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, horaEnvio: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
                />
              </div>
            </div>
          </div>

          <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCrearOpen(false)}
              className="px-4 py-2.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCrear}
              disabled={!nuevoRecordatorio.titulo || !nuevoRecordatorio.fechaEnvio}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Bell size={14} /> Crear Recordatorio
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle */}
      <Dialog open={!!detalle} onOpenChange={() => setDetalle(null)}>
        <DialogContent className="sm:max-w-[450px] p-0 gap-0">
          {detalle && (
            <>
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tipoConfig[detalle.tipo].bg} ${tipoConfig[detalle.tipo].color}`}>
                      {tipoConfig[detalle.tipo].icono}
                    </div>
                    <div>
                      <DialogTitle className="text-slate-900">{detalle.titulo}</DialogTitle>
                      <p className="text-[10px] text-slate-500 mt-0.5">{detalle.descripcion}</p>
                    </div>
                  </div>
                  <button onClick={() => setDetalle(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                    <X size={16} className="text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Calendar size={14} className="text-slate-400" />
                    <div>
                      <div className="text-[9px] text-slate-400">Próximo Envío</div>
                      <div className="text-[11px] font-semibold text-slate-800">{detalle.proximoEnvio.toLocaleDateString("es-CL")}</div>
                      <div className="text-[9px] text-slate-500">{detalle.proximoEnvio.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Repeat size={14} className="text-slate-400" />
                    <div>
                      <div className="text-[9px] text-slate-400">Frecuencia</div>
                      <div className="text-[11px] font-semibold text-slate-800">{frecuenciaConfig[detalle.frecuencia].label}</div>
                    </div>
                  </div>
                </div>

                {detalle.leadNombre && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <User size={14} className="text-blue-500" />
                    <div>
                      <div className="text-[9px] text-blue-500">Cliente</div>
                      <div className="text-[11px] font-semibold text-blue-800">{detalle.leadNombre}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${estadoConfig[detalle.estado].bg} ${estadoConfig[detalle.estado].color}`}>
                      {estadoConfig[detalle.estado].icono}
                      {estadoConfig[detalle.estado].label}
                    </span>
                    {detalle.ultimoEnvio && (
                      <span className="text-[9px] text-slate-400">Último: {detalle.ultimoEnvio.toLocaleString("es-CL")}</span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500">{detalle.intentos}/{detalle.maxIntentos} intentos</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Estado del recordatorio</span>
                  <button onClick={() => toggleActivo(detalle.id)} className="transition-colors">
                    {detalle.activo ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-600">
                        <ToggleRight size={20} /> Activo
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                        <ToggleLeft size={20} /> Inactivo
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => eliminarRecordatorio(detalle.id)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-semibold hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={12} /> Eliminar
                </button>
                <div className="flex items-center gap-2">
                  <button className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                    <Edit size={14} />
                  </button>
                  <button className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
