"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Calendar, Clock, MapPin, User, Plus, Search,
  Phone, Video, Trash2, CheckCircle, Bell, Target, Users, FileText, X,
  Zap, ArrowRight,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useLeads } from "@/modulos/leads";
import { GoogleCalendarIntegration, CrearEventoGoogle, MeetLinkDisplay } from "@/componentes/agenda/GoogleCalendarIntegration";
import { createGoogleCalendarEvent, isGoogleAuthenticated } from "@/lib/services/googleCalendar";
import { toast } from "sonner";
import type { Lead } from "@/tipos";

interface Evento {
  id: string;
  titulo: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  tipo: "reunion" | "llamada" | "seguimiento" | "tarea" | "videoconferencia";
  leadId?: string;
  leadNombre?: string;
  descripcion?: string;
  ubicacion?: string;
  recordatorio: boolean;
  completado: boolean;
  meetLink?: string;
  calendarLink?: string;
}

function generarEventos(): Evento[] {
  const hoy = new Date();
  return [
    { id: "e1", titulo: "Reunion seguimiento documentos", fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 10, 0), horaInicio: "10:00", horaFin: "11:00", tipo: "reunion", leadNombre: "Maria Gonzalez", ubicacion: "Oficina Central - Sala 1", descripcion: "Revision de documentos pendientes", recordatorio: true, completado: false },
    { id: "e2", titulo: "Llamada estado documentos", fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 14, 0), horaInicio: "14:00", horaFin: "14:30", tipo: "llamada", leadNombre: "Carlos Rojas", descripcion: "Consultar estado de documentos enviados", recordatorio: true, completado: false },
    { id: "e3", titulo: "Videoconferencia condiciones", fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 16, 0), horaInicio: "16:00", horaFin: "17:00", tipo: "videoconferencia", leadNombre: "Ana Torres", descripcion: "Revisar condiciones del credito", recordatorio: false, completado: false },
    { id: "e4", titulo: "Seguimiento post aprobacion", fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 9, 0), horaInicio: "09:00", horaFin: "09:30", tipo: "seguimiento", leadNombre: "Juan Perez", descripcion: "Confirmar firma de documentos", recordatorio: true, completado: false },
    { id: "e5", titulo: "Revision documentos AFP", fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 11, 0), horaInicio: "11:00", horaFin: "12:00", tipo: "tarea", leadNombre: "Diego Diaz", descripcion: "Revisar certificado de AFP", recordatorio: false, completado: false },
    { id: "e6", titulo: "Presentacion propuesta credito", fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 15, 0), horaInicio: "15:00", horaFin: "16:30", tipo: "reunion", leadNombre: "Sofia Martinez", ubicacion: "Sala de Reuniones", descripcion: "Presentar propuesta de credito", recordatorio: true, completado: false },
    { id: "e7", titulo: "Llamada bienvenida", fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 2, 10, 0), horaInicio: "10:00", horaFin: "10:30", tipo: "llamada", leadNombre: "Roberto Silva", descripcion: "Primer contacto", recordatorio: true, completado: false },
    { id: "e8", titulo: "Firma documentos cierre", fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 3, 14, 0), horaInicio: "14:00", horaFin: "15:30", tipo: "reunion", leadNombre: "Fernanda Rojas", ubicacion: "Sucursal Las Condes", descripcion: "Firma y cierre", recordatorio: true, completado: false },
    { id: "e9", titulo: "Video seguimiento evaluacion", fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 4, 11, 0), horaInicio: "11:00", horaFin: "11:45", tipo: "videoconferencia", leadNombre: "Valentina Torres", descripcion: "Seguimiento evaluacion bancaria", recordatorio: false, completado: false },
  ];
}

const tipoConfig: Record<string, { label: string; color: string; bg: string; icono: React.ReactNode }> = {
  reunion: { label: "Reunion", color: "text-purple-600", bg: "bg-purple-50", icono: <Users size={14} /> },
  llamada: { label: "Llamada", color: "text-blue-600", bg: "bg-blue-50", icono: <Phone size={14} /> },
  seguimiento: { label: "Seguimiento", color: "text-amber-600", bg: "bg-amber-50", icono: <Clock size={14} /> },
  tarea: { label: "Tarea", color: "text-emerald-600", bg: "bg-emerald-50", icono: <FileText size={14} /> },
  videoconferencia: { label: "Video", color: "text-indigo-600", bg: "bg-indigo-50", icono: <Video size={14} /> },
};

const DIAS_SEMANA = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const HORAS_DIA = Array.from({ length: 14 }, (_, i) => `${(i + 7).toString().padStart(2, "0")}:00`);

export default function AgendaPage() {
  const { leads } = useLeads();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mesActual, setMesActual] = useState(new Date());
  const [vista, setVista] = useState<"mes" | "semana" | "dia">("mes");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [crearEventoOpen, setCrearEventoOpen] = useState(false);
  const [crearEventoGoogleOpen, setCrearEventoGoogleOpen] = useState(false);
  const [detalleEvento, setDetalleEvento] = useState<Evento | null>(null);
  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: "", tipo: "reunion" as Evento["tipo"], horaInicio: "10:00", horaFin: "11:00",
    leadNombre: "", ubicacion: "", descripcion: "", recordatorio: true,
  });

  useEffect(() => {
    async function cargarEventos() {
      try {
        const res = await fetch("/api/eventos");
        const json = await res.json();
        if (json.success && json.data) {
          setEventos(json.data.map((e: Record<string, any>) => ({ ...e, fecha: e.fecha ? new Date(e.fecha) : new Date() })));
        }
      } catch { setEventos(generarEventos()); } finally { setCargando(false); }
    }
    cargarEventos();
  }, []);

  const leadsFiltrados = useMemo(() => leads.slice(0, 20), [leads]);
  const primerDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
  const ultimoDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
  const diasEnMes = ultimoDiaMes.getDate();
  const diaSemanaInicio = (primerDiaMes.getDay() + 6) % 7;

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((e) => {
      const coincideTipo = filtroTipo === "todos" || e.tipo === filtroTipo;
      const coincideBusqueda = !busqueda || e.titulo.toLowerCase().includes(busqueda.toLowerCase()) || e.leadNombre?.toLowerCase().includes(busqueda.toLowerCase());
      return coincideTipo && coincideBusqueda;
    });
  }, [eventos, filtroTipo, busqueda]);

  const eventosHoy = useMemo(() => {
    return eventosFiltrados.filter((e) => e.fecha.toDateString() === fechaSeleccionada.toDateString()).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }, [eventosFiltrados, fechaSeleccionada]);

  const stats = useMemo(() => {
    const hoy = new Date();
    const eventosHoyCount = eventos.filter((e) => e.fecha.toDateString() === hoy.toDateString()).length;
    const proximos7Dias = eventos.filter((e) => { const diff = e.fecha.getTime() - hoy.getTime(); return diff > 0 && diff < 7 * 86400000; }).length;
    const pendientes = eventos.filter((e) => !e.completado).length;
    const completados = eventos.filter((e) => e.completado).length;
    return { eventosHoyCount, proximos7Dias, pendientes, completados };
  }, [eventos]);

  const navegarMes = (d: number) => setMesActual((p) => { const n = new Date(p); n.setMonth(n.getMonth() + d); return n; });
  const seleccionarDia = (dia: number) => setFechaSeleccionada(new Date(mesActual.getFullYear(), mesActual.getMonth(), dia));
  const eventosPorDia = (dia: number) => eventosFiltrados.filter((e) => e.fecha.toDateString() === new Date(mesActual.getFullYear(), mesActual.getMonth(), dia).toDateString());

  const toggleCompletado = async (eventoId: string) => {
    const evento = eventos.find((e) => e.id === eventoId);
    if (!evento) return;
    try {
      await fetch(`/api/eventos/${eventoId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completado: !evento.completado }) });
      setEventos((prev) => prev.map((e) => (e.id === eventoId ? { ...e, completado: !e.completado } : e)));
      toast.success(evento.completado ? "Evento reabierto" : "Evento completado");
    } catch { toast.error("Error al actualizar"); }
  };

  const eliminarEvento = async (eventoId: string) => {
    try {
      await fetch(`/api/eventos/${eventoId}`, { method: "DELETE" });
      setEventos((prev) => prev.filter((e) => e.id !== eventoId));
      setDetalleEvento(null);
      toast.success("Evento eliminado");
    } catch { toast.error("Error al eliminar"); }
  };

  const handleCrearEvento = async () => {
    try {
      const res = await fetch("/api/eventos", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: nuevoEvento.titulo, fecha: fechaSeleccionada.toISOString().split("T")[0], horaInicio: nuevoEvento.horaInicio, horaFin: nuevoEvento.horaFin, tipo: nuevoEvento.tipo, leadNombre: nuevoEvento.leadNombre || null, ubicacion: nuevoEvento.ubicacion || null, descripcion: nuevoEvento.descripcion || null, recordatorio: nuevoEvento.recordatorio }),
      });
      const json = await res.json();
      if (json.success && json.data) { setEventos((prev) => [...prev, { ...json.data, fecha: new Date(json.data.fecha) }]); toast.success("Evento creado"); }
    } catch { toast.error("Error al crear evento"); }
    setCrearEventoOpen(false);
    setNuevoEvento({ titulo: "", tipo: "reunion", horaInicio: "10:00", horaFin: "11:00", leadNombre: "", ubicacion: "", descripcion: "", recordatorio: true });
  };

  const handleCrearEventoGoogle = async (eventoData: { titulo: string; descripcion: string; fechaInicio: Date; fechaFin: Date; crearMeet: boolean; emails: string[] }) => {
    const hI = `${eventoData.fechaInicio.getHours().toString().padStart(2, "0")}:${eventoData.fechaInicio.getMinutes().toString().padStart(2, "0")}`;
    const hF = `${eventoData.fechaFin.getHours().toString().padStart(2, "0")}:${eventoData.fechaFin.getMinutes().toString().padStart(2, "0")}`;
    let meetLink: string | undefined;
    if (eventoData.crearMeet) meetLink = "https://meet.google.com/new";
    try {
      const res = await fetch("/api/eventos", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: eventoData.titulo, fecha: eventoData.fechaInicio.toISOString().split("T")[0], horaInicio: hI, horaFin: hF, tipo: "videoconferencia", descripcion: eventoData.descripcion || null, recordatorio: true, meetLink: meetLink || null }),
      });
      const json = await res.json();
      if (json.success && json.data) setEventos((prev) => [...prev, { ...json.data, fecha: new Date(json.data.fecha) }]);
    } catch { toast.error("Error al crear evento"); }
    setCrearEventoOpen(false);
  };

  const getDiasSemana = () => {
    const inicio = new Date(fechaSeleccionada);
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(inicio); d.setDate(d.getDate() + i); return d; });
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-sm text-slate-500">Cargando agenda...</span>
      </div>
    );
  }

  const proximosEventos = eventosFiltrados.filter((e) => new Date(e.fecha) > new Date() && !e.completado).slice(0, 4);

  return (
    <div className="space-y-5">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Calendar size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Agenda</h1>
              <p className="text-blue-100 text-[11px] font-medium">
                {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GoogleCalendarIntegration />
            <button onClick={() => setCrearEventoOpen(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-white text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-50 transition-colors shadow-lg">
              <Plus size={14} /> Nuevo Evento
            </button>
          </div>
        </div>
      </div>

      {/* Stats mejorados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Hoy", value: stats.eventosHoyCount, sub: "eventos programados", icon: <Calendar size={16} />, gradient: "from-blue-500 to-blue-600", textColor: "text-blue-600" },
          { label: "Proximos 7 dias", value: stats.proximos7Dias, sub: "eventos pendientes", icon: <Clock size={16} />, gradient: "from-amber-500 to-orange-500", textColor: "text-amber-600" },
          { label: "Pendientes", value: stats.pendientes, sub: "por completar", icon: <Target size={16} />, gradient: "from-purple-500 to-violet-500", textColor: "text-purple-600" },
          { label: "Completados", value: stats.completados, sub: "esta semana", icon: <CheckCircle size={16} />, gradient: "from-emerald-500 to-teal-500", textColor: "text-emerald-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-slate-100/80 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendario */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-100/80 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-slate-900">
                {mesActual.toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex bg-slate-100 rounded-xl p-0.5">
                {(["mes", "semana", "dia"] as const).map((v) => (
                  <button key={v} onClick={() => setVista(v)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${vista === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                    {v === "mes" ? "Mes" : v === "semana" ? "Semana" : "Dia"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => navegarMes(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              <button onClick={() => { setMesActual(new Date()); setFechaSeleccionada(new Date()); }}
                className="px-3 py-1.5 text-[10px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                Hoy
              </button>
              <button onClick={() => navegarMes(1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>

          {/* Vista Mes */}
          {vista === "mes" && (
            <>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DIAS_SEMANA.map((dia) => (
                  <div key={dia} className="text-center text-[10px] font-semibold text-slate-400 py-2 uppercase tracking-wider">{dia}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: diaSemanaInicio }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: diasEnMes }).map((_, i) => {
                  const dia = i + 1;
                  const esHoy = dia === new Date().getDate() && mesActual.getMonth() === new Date().getMonth() && mesActual.getFullYear() === new Date().getFullYear();
                  const esSeleccionado = dia === fechaSeleccionada.getDate() && mesActual.getMonth() === fechaSeleccionada.getMonth();
                  const eventosDia = eventosPorDia(dia);
                  const tieneEventos = eventosDia.length > 0;

                  return (
                    <button key={dia} onClick={() => seleccionarDia(dia)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative ${
                        esSeleccionado ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105" :
                        esHoy ? "bg-blue-50 text-blue-600 font-bold border-2 border-blue-200" :
                        tieneEventos ? "bg-slate-50 hover:bg-slate-100" : "hover:bg-slate-50"
                      }`}>
                      <span className={`text-[12px] font-semibold ${esSeleccionado ? "text-white" : ""}`}>{dia}</span>
                      {tieneEventos && (
                        <div className="flex gap-0.5 mt-0.5">
                          {eventosDia.slice(0, 3).map((e, idx) => (
                            <div key={idx} className={`w-1.5 h-1.5 rounded-full ${esSeleccionado ? "bg-white" : e.tipo === "reunion" ? "bg-purple-500" : e.tipo === "llamada" ? "bg-blue-500" : e.tipo === "seguimiento" ? "bg-amber-500" : e.tipo === "tarea" ? "bg-emerald-500" : "bg-indigo-500"}`} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Vista Semana */}
          {vista === "semana" && (
            <div className="space-y-2">
              {getDiasSemana().map((dia, i) => {
                const eventosDia = eventosFiltrados.filter((e) => e.fecha.toDateString() === dia.toDateString());
                const esHoy = dia.toDateString() === new Date().toDateString();
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${esHoy ? "bg-blue-50 border border-blue-100 shadow-sm" : "bg-slate-50 hover:bg-slate-100"}`}>
                    <div className={`w-14 text-center flex-shrink-0 ${esHoy ? "text-blue-600" : "text-slate-600"}`}>
                      <div className="text-[10px] font-medium uppercase">{DIAS_SEMANA[i]}</div>
                      <div className={`text-xl font-bold ${esHoy ? "bg-blue-600 text-white w-9 h-9 rounded-full flex items-center justify-center mx-auto" : ""}`}>{dia.getDate()}</div>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2">
                      {eventosDia.length === 0 ? (
                        <span className="text-[10px] text-slate-400 py-2">Sin eventos</span>
                      ) : (
                        eventosDia.map((evento) => (
                          <div key={evento.id} onClick={() => setDetalleEvento(evento)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:shadow-sm transition-all ${tipoConfig[evento.tipo].bg} border border-transparent hover:border-slate-200`}>
                            <span className={tipoConfig[evento.tipo].color}>{tipoConfig[evento.tipo].icono}</span>
                            <div>
                              <div className="text-[10px] font-semibold text-slate-800">{evento.horaInicio} - {evento.titulo}</div>
                              {evento.leadNombre && <div className="text-[9px] text-slate-500">{evento.leadNombre}</div>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Vista Dia */}
          {vista === "dia" && (
            <div className="space-y-1">
              {HORAS_DIA.map((hora) => {
                const eventosEnHora = eventosFiltrados.filter((e) => {
                  const fechaEvento = e.fecha.toDateString() === fechaSeleccionada.toDateString();
                  const horaEvento = parseInt(e.horaInicio.split(":")[0]);
                  const horaActual = parseInt(hora.split(":")[0]);
                  return fechaEvento && horaEvento === horaActual;
                });
                const esHoraActual = new Date().getHours() === parseInt(hora.split(":")[0]) && fechaSeleccionada.toDateString() === new Date().toDateString();
                return (
                  <div key={hora} className={`flex items-start gap-3 min-h-[60px] ${esHoraActual ? "bg-blue-50/50 rounded-lg" : ""}`}>
                    <div className="w-16 text-right flex-shrink-0">
                      <span className={`text-[10px] font-medium ${esHoraActual ? "text-blue-600 font-bold" : "text-slate-400"}`}>{hora}</span>
                    </div>
                    <div className="flex-1 border-l-2 border-slate-100 pl-4 py-1">
                      {eventosEnHora.map((evento) => (
                        <div key={evento.id} onClick={() => setDetalleEvento(evento)}
                          className={`p-3 rounded-xl mb-1 cursor-pointer hover:shadow-sm transition-all ${tipoConfig[evento.tipo].bg} border border-transparent hover:border-slate-200`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={tipoConfig[evento.tipo].color}>{tipoConfig[evento.tipo].icono}</span>
                              <span className="text-[11px] font-semibold text-slate-800">{evento.titulo}</span>
                            </div>
                            <span className="text-[9px] text-slate-500">{evento.horaInicio} - {evento.horaFin}</span>
                          </div>
                          {evento.leadNombre && (
                            <div className="flex items-center gap-1.5 mt-1.5 ml-6">
                              <User size={10} className="text-slate-400" />
                              <span className="text-[10px] text-slate-500">{evento.leadNombre}</span>
                              {evento.ubicacion && (<><span className="text-slate-300">-</span><MapPin size={10} className="text-slate-400" /><span className="text-[10px] text-slate-500">{evento.ubicacion}</span></>)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel Lateral */}
        <div className="space-y-5">
          {/* Busqueda y Filtros */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100/80 shadow-sm">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Buscar evento..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setFiltroTipo("todos")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${filtroTipo === "todos" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                Todos
              </button>
              {Object.entries(tipoConfig).map(([key, config]) => (
                <button key={key} onClick={() => setFiltroTipo(key)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 ${filtroTipo === key ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {config.icono} {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Eventos del Dia */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {fechaSeleccionada.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{eventosHoy.length} evento{eventosHoy.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setCrearEventoOpen(true)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {eventosHoy.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Calendar size={24} className="text-slate-300" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Sin eventos este dia</p>
                  <button onClick={() => setCrearEventoOpen(true)} className="mt-3 text-[10px] text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                    + Agregar evento
                  </button>
                </div>
              ) : (
                eventosHoy.map((evento) => (
                  <div key={evento.id} onClick={() => setDetalleEvento(evento)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                      evento.completado ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-100 hover:border-blue-200"
                    }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); toggleCompletado(evento.id); }}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${evento.completado ? "bg-emerald-500 border-emerald-500 scale-110" : "border-slate-300 hover:border-blue-400 hover:scale-110"}`}>
                          {evento.completado && <CheckCircle size={10} className="text-white" />}
                        </button>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${tipoConfig[evento.tipo].bg} ${tipoConfig[evento.tipo].color}`}>
                          {tipoConfig[evento.tipo].label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{evento.horaInicio}</span>
                    </div>
                    <h4 className={`text-[11px] font-semibold mb-1 ${evento.completado ? "text-slate-400 line-through" : "text-slate-800"}`}>
                      {evento.titulo}
                    </h4>
                    {evento.leadNombre && (
                      <div className="flex items-center gap-1.5">
                        <User size={10} className="text-slate-400" />
                        <span className="text-[10px] text-slate-500">{evento.leadNombre}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Proximos Eventos */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-4 text-white shadow-xl shadow-blue-600/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">Proximos Eventos</h3>
              <Zap size={14} className="text-blue-200" />
            </div>
            <div className="space-y-2">
              {proximosEventos.length === 0 ? (
                <p className="text-[10px] text-blue-200 text-center py-4">No hay eventos proximos</p>
              ) : (
                proximosEventos.map((evento) => (
                  <div key={evento.id} onClick={() => setDetalleEvento(evento)}
                    className="flex items-center gap-3 p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors cursor-pointer backdrop-blur-sm">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      {tipoConfig[evento.tipo].icono}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold truncate">{evento.titulo}</div>
                      <div className="text-[9px] text-blue-200">
                        {evento.fecha.toLocaleDateString("es-CL", { weekday: "short", day: "numeric" })} - {evento.horaInicio}
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-blue-300 flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Crear Evento */}
      <Dialog open={crearEventoOpen} onOpenChange={setCrearEventoOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0">
          <DialogHeader className="p-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Plus size={18} />
              </div>
              <div>
                <DialogTitle className="text-slate-900">Nuevo Evento</DialogTitle>
                <DialogDescription className="text-slate-500">
                  {fechaSeleccionada.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-5 space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Titulo</label>
              <input type="text" placeholder="Ej: Reunion con cliente..." value={nuevoEvento.titulo}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, titulo: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Tipo</label>
                <select value={nuevoEvento.tipo} onChange={(e) => setNuevoEvento({ ...nuevoEvento, tipo: e.target.value as Evento["tipo"] })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400">
                  {Object.entries(tipoConfig).map(([key, config]) => (<option key={key} value={key}>{config.label}</option>))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Cliente</label>
                <select value={nuevoEvento.leadNombre} onChange={(e) => setNuevoEvento({ ...nuevoEvento, leadNombre: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400">
                  <option value="">Sin cliente</option>
                  {leadsFiltrados.slice(0, 10).map((lead) => (<option key={lead.id} value={`${lead.nombre} ${lead.apellido}`}>{lead.nombre} {lead.apellido}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Hora Inicio</label>
                <input type="time" value={nuevoEvento.horaInicio} onChange={(e) => setNuevoEvento({ ...nuevoEvento, horaInicio: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Hora Fin</label>
                <input type="time" value={nuevoEvento.horaFin} onChange={(e) => setNuevoEvento({ ...nuevoEvento, horaFin: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Ubicacion (opcional)</label>
              <input type="text" placeholder="Ej: Oficina Central, Sala 1" value={nuevoEvento.ubicacion}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, ubicacion: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Descripcion (opcional)</label>
              <textarea placeholder="Notas sobre el evento..." value={nuevoEvento.descripcion}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, descripcion: e.target.value })} rows={2}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="recordatorio" checked={nuevoEvento.recordatorio}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, recordatorio: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="recordatorio" className="text-[11px] text-slate-600">Enviar recordatorio</label>
            </div>
          </div>
          <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button onClick={() => setCrearEventoOpen(false)} className="px-4 py-2.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Cancelar
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => { setCrearEventoOpen(false); setCrearEventoGoogleOpen(true); }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold hover:bg-slate-50 transition-colors">
                <Video size={14} className="text-blue-500" /> Con Google Meet
              </button>
              <button onClick={handleCrearEvento} disabled={!nuevoEvento.titulo}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20">
                <Plus size={14} /> Crear Evento
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle Evento */}
      <Dialog open={!!detalleEvento} onOpenChange={() => setDetalleEvento(null)}>
        <DialogContent className="sm:max-w-[450px] p-0 gap-0">
          {detalleEvento && (
            <>
              <div className="p-5 border-b border-slate-100" style={{ borderTop: `4px solid ${detalleEvento.tipo === "reunion" ? "#8B5CF6" : detalleEvento.tipo === "llamada" ? "#3B82F6" : detalleEvento.tipo === "videoconferencia" ? "#6366F1" : "#10B981"}` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tipoConfig[detalleEvento.tipo].bg} ${tipoConfig[detalleEvento.tipo].color}`}>
                      {tipoConfig[detalleEvento.tipo].icono}
                    </div>
                    <div>
                      <DialogTitle className="text-slate-900">{detalleEvento.titulo}</DialogTitle>
                      <p className="text-[10px] text-slate-500 mt-0.5">{tipoConfig[detalleEvento.tipo].label}</p>
                    </div>
                  </div>
                  <button onClick={() => setDetalleEvento(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                    <X size={16} className="text-slate-400" />
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Calendar size={14} className="text-slate-400" />
                    <div>
                      <div className="text-[9px] text-slate-400">Fecha</div>
                      <div className="text-[11px] font-semibold text-slate-800">{detalleEvento.fecha.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Clock size={14} className="text-slate-400" />
                    <div>
                      <div className="text-[9px] text-slate-400">Hora</div>
                      <div className="text-[11px] font-semibold text-slate-800">{detalleEvento.horaInicio} - {detalleEvento.horaFin}</div>
                    </div>
                  </div>
                </div>
                {detalleEvento.leadNombre && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <User size={14} className="text-blue-500" />
                    <div>
                      <div className="text-[9px] text-blue-500">Cliente</div>
                      <div className="text-[11px] font-semibold text-blue-800">{detalleEvento.leadNombre}</div>
                    </div>
                  </div>
                )}
                {detalleEvento.ubicacion && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <MapPin size={14} className="text-slate-400" />
                    <div>
                      <div className="text-[9px] text-slate-400">Ubicacion</div>
                      <div className="text-[11px] font-semibold text-slate-800">{detalleEvento.ubicacion}</div>
                    </div>
                  </div>
                )}
                {detalleEvento.meetLink && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="text-[9px] text-blue-500 mb-2 font-semibold">Google Meet</div>
                    <MeetLinkDisplay meetLink={detalleEvento.meetLink} />
                  </div>
                )}
                {detalleEvento.descripcion && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[9px] text-slate-400 mb-1">Descripcion</div>
                    <p className="text-[11px] text-slate-700">{detalleEvento.descripcion}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <Bell size={12} className={detalleEvento.recordatorio ? "text-amber-500" : "text-slate-300"} />
                  <span>Recordatorio {detalleEvento.recordatorio ? "activado" : "desactivado"}</span>
                </div>
              </div>
              <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleCompletado(detalleEvento.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold transition-colors ${detalleEvento.completado ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    <CheckCircle size={12} /> {detalleEvento.completado ? "Completado" : "Marcar completo"}
                  </button>
                  <button onClick={() => eliminarEvento(detalleEvento.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-semibold hover:bg-red-100 transition-colors">
                    <Trash2 size={12} /> Eliminar
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Crear Evento con Google Calendar */}
      <Dialog open={crearEventoGoogleOpen} onOpenChange={setCrearEventoGoogleOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0">
          <DialogHeader className="p-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Video size={18} />
              </div>
              <div>
                <DialogTitle className="text-slate-900">Crear Reunion con Google Meet</DialogTitle>
                <DialogDescription className="text-slate-500">Crea un evento sincronizado con Google Calendar</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-5">
            <CrearEventoGoogle onCrearEvento={handleCrearEventoGoogle} onClose={() => setCrearEventoGoogleOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
