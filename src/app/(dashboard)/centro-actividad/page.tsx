"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CheckSquare,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  Paperclip,
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  CalendarDays,
  Users,
  ChevronRight,
} from "lucide-react";
import { useUser } from "@/modulos/usuarios";
import { useLeads } from "@/modulos/leads";
import { toast } from "sonner";

const ICONOS_TIPO: Record<string, any> = {
  tarea: CheckSquare,
  llamada: Phone,
  correo: Mail,
  whatsapp: MessageSquare,
  reunion: Calendar,
  nota: FileText,
  documento: Paperclip,
  recordatorio: Bell,
};

const COLORES_TIPO: Record<string, string> = {
  tarea: "bg-blue-100 text-blue-600",
  llamada: "bg-emerald-100 text-emerald-600",
  correo: "bg-purple-100 text-purple-600",
  whatsapp: "bg-green-100 text-green-600",
  reunion: "bg-amber-100 text-amber-600",
  nota: "bg-slate-100 text-slate-600",
  documento: "bg-pink-100 text-pink-600",
  recordatorio: "bg-red-100 text-red-600",
};

const ESTADO_CONFIG: Record<string, { label: string; icono: any; color: string }> = {
  pendiente: { label: "Pendiente", icono: Clock, color: "text-amber-500" },
  completada: { label: "Completada", icono: CheckCircle, color: "text-emerald-500" },
  vencida: { label: "Vencida", icono: AlertTriangle, color: "text-red-500" },
};

export default function CentroActividadPage() {
  const { usuarioActual } = useUser();
  const { leads } = useLeads();
  const [actividades, setActividades] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [vistaActiva, setVistaActiva] = useState<"hoy" | "semana" | "todas">("hoy");

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/tareas", { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          const tareas = (data.data || []).map((t: any) => ({
            id: t.id,
            tipo: "tarea",
            titulo: t.titulo,
            descripcion: t.descripcion,
            leadId: t.leadid,
            leadNombre: t.leadnombre,
            fecha: t.fechavencimiento || t.creadoen,
            estado: t.estado === "COMPLETADA" ? "completada" : t.estado === "VENCIDA" ? "vencida" : "pendiente",
            prioridad: t.prioridad?.toLowerCase(),
            created_at: t.creadoen,
          }));
          setActividades(tareas);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const actividadesFiltradas = useMemo(() => {
    const hoy = new Date().toISOString().split("T")[0];
    return actividades.filter((a) => {
      const matchTipo = filtroTipo === "todos" || a.tipo === filtroTipo;
      const matchEstado = filtroEstado === "todos" || a.estado === filtroEstado;
      const matchBusqueda = !busqueda || a.titulo.toLowerCase().includes(busqueda.toLowerCase());
      
      let matchVista = true;
      if (vistaActiva === "hoy") {
        matchVista = a.fecha?.startsWith(hoy);
      } else if (vistaActiva === "semana") {
        const fechaActividad = new Date(a.fecha);
        const hoyDate = new Date();
        const finSemana = new Date(hoyDate);
        finSemana.setDate(hoyDate.getDate() + 7);
        matchVista = fechaActividad >= hoyDate && fechaActividad <= finSemana;
      }
      
      return matchTipo && matchEstado && matchBusqueda && matchVista;
    });
  }, [actividades, filtroTipo, filtroEstado, busqueda, vistaActiva]);

  const estadisticas = useMemo(() => {
    const hoy = new Date().toISOString().split("T")[0];
    return {
      pendientes: actividades.filter(a => a.estado === "pendiente").length,
      completadas: actividades.filter(a => a.estado === "completada").length,
      vencidas: actividades.filter(a => a.estado === "vencida").length,
      hoy: actividades.filter(a => a.fecha?.startsWith(hoy)).length,
    };
  }, [actividades]);

  const handleCompletar = async (id: string) => {
    try {
      await fetch(`/api/tareas/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "COMPLETADA" }),
      });
      setActividades(prev => prev.map(a => a.id === id ? { ...a, estado: "completada" } : a));
      toast.success("Actividad completada");
    } catch {
      toast.error("Error al completar");
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Centro de Actividad</h1>
          <p className="text-sm text-slate-500">Tu día de trabajo en un vistazo</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Nueva Actividad
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock size={14} className="text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{estadisticas.pendientes}</div>
          <div className="text-[11px] text-slate-500">Pendientes</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={14} className="text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{estadisticas.completadas}</div>
          <div className="text-[11px] text-slate-500">Completadas</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={14} className="text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{estadisticas.vencidas}</div>
          <div className="text-[11px] text-slate-500">Vencidas</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarDays size={14} className="text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{estadisticas.hoy}</div>
          <div className="text-[11px] text-slate-500">Para Hoy</div>
        </div>
      </div>

      {/* Vista Tabs */}
      <div className="flex gap-2">
        {[
          { id: "hoy", label: "Hoy", icono: CalendarDays },
          { id: "semana", label: "Esta Semana", icono: Calendar },
          { id: "todas", label: "Todas", icono: FileText },
        ].map(({ id, label, icono: Icono }) => (
          <button
            key={id}
            onClick={() => setVistaActiva(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              vistaActiva === id
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Icono size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar actividad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="todos">Todos los tipos</option>
          <option value="tarea">Tareas</option>
          <option value="llamada">Llamadas</option>
          <option value="correo">Correos</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="reunion">Reuniones</option>
          <option value="nota">Notas</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="completada">Completadas</option>
          <option value="vencida">Vencidas</option>
        </select>
      </div>

      {/* Lista de actividades */}
      {actividadesFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
          <CheckCircle size={48} className="text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Sin actividades</h3>
          <p className="text-sm text-slate-400">No hay actividades para este período</p>
        </div>
      ) : (
        <div className="space-y-2">
          {actividadesFiltradas.map((actividad) => {
            const IconoTipo = ICONOS_TIPO[actividad.tipo] || FileText;
            const estadoConfig = ESTADO_CONFIG[actividad.estado] || ESTADO_CONFIG.pendiente;
            const IconoEstado = estadoConfig.icono;
            
            return (
              <div
                key={actividad.id}
                className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${COLORES_TIPO[actividad.tipo] || "bg-slate-100 text-slate-600"}`}>
                  <IconoTipo size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{actividad.titulo}</div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    {actividad.leadNombre && <span>👤 {actividad.leadNombre}</span>}
                    <span>📅 {actividad.fecha?.split("T")[0]}</span>
                    {actividad.hora && <span>🕐 {actividad.hora}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 text-[10px] font-semibold ${estadoConfig.color}`}>
                    <IconoEstado size={12} /> {estadoConfig.label}
                  </span>
                  {actividad.estado === "pendiente" && (
                    <button
                      onClick={() => handleCompletar(actividad.id)}
                      className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Marcar como completada"
                    >
                      <CheckCircle size={14} className="text-emerald-500" />
                    </button>
                  )}
                  <ChevronRight size={14} className="text-slate-300" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
