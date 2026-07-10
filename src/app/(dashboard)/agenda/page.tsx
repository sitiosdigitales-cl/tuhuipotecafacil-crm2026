"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  Video,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Bell,
  Target,
  Users,
  FileText,
  X,
  ChevronDown,
  ExternalLink,
  Copy,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ETAPAS_CONFIG } from "@/datos/mock";
import { useLeads } from "@/lib/contexts/LeadContext";
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
  notas?: string;
  googleEventId?: string;
  meetLink?: string;
  calendarLink?: string;
  sincronizadoGoogle?: boolean;
}

// Generar eventos mock con datos reales
function generarEventos(): Evento[] {
  const hoy = new Date();
  const eventos: Evento[] = [
    {
      id: "e1",
      titulo: "Reunión de seguimiento",
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 10, 0),
      horaInicio: "10:00",
      horaFin: "11:00",
      tipo: "reunion",
      leadId: "lead-1",
      leadNombre: "María González",
      ubicacion: "Oficina Central - Sala 1",
      descripcion: "Revisión de documentos pendientes y avanzar con evaluación bancaria",
      recordatorio: true,
      completado: false,
    },
    {
      id: "e2",
      titulo: "Llamada de seguimiento",
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 14, 0),
      horaInicio: "14:00",
      horaFin: "14:30",
      tipo: "llamada",
      leadId: "lead-2",
      leadNombre: "Carlos Rojas",
      descripcion: "Consultar estado de documentos enviados",
      recordatorio: true,
      completado: false,
    },
    {
      id: "e3",
      titulo: "Videoconferencia condicioness",
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 16, 0),
      horaInicio: "16:00",
      horaFin: "17:00",
      tipo: "videoconferencia",
      leadId: "lead-4",
      leadNombre: "Ana Torres",
      descripcion: "Revisar condiciones del crédito hipotecario",
      recordatorio: false,
      completado: false,
    },
    {
      id: "e4",
      titulo: "Seguimiento post aprobación",
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 9, 0),
      horaInicio: "09:00",
      horaFin: "09:30",
      tipo: "seguimiento",
      leadId: "lead-3",
      leadNombre: "Juan Pérez",
      descripcion: "Confirmar firma de documentos",
      recordatorio: true,
      completado: false,
    },
    {
      id: "e5",
      titulo: "Revisión de documentos",
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 11, 0),
      horaInicio: "11:00",
      horaFin: "12:00",
      tipo: "tarea",
      leadId: "lead-5",
      leadNombre: "Diego Díaz",
      descripcion: "Revisar certificado de AFP y declaración de renta",
      recordatorio: false,
      completado: false,
    },
    {
      id: "e6",
      titulo: "Presentación propuesta",
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 15, 0),
      horaInicio: "15:00",
      horaFin: "16:30",
      tipo: "reunion",
      leadId: "lead-6",
      leadNombre: "Sofía Martínez",
      ubicacion: "Oficina Central - Sala de Reuniones",
      descripcion: "Presentar propuesta de crédito hipotecario con alternativas bancarias",
      recordatorio: true,
      completado: false,
    },
    {
      id: "e7",
      titulo: "Llamada de bienvenida",
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 2, 10, 0),
      horaInicio: "10:00",
      horaFin: "10:30",
      tipo: "llamada",
      leadId: "lead-7",
      leadNombre: "Roberto Silva",
      descripcion: "Primer contacto y envío de información",
      recordatorio: true,
      completado: false,
    },
    {
      id: "e8",
      titulo: "Reunión presencial",
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 3, 14, 0),
      horaInicio: "14:00",
      horaFin: "15:30",
      tipo: "reunion",
      leadId: "lead-8",
      leadNombre: "Fernanda Rojas",
      ubicacion: "Sucursal Las Condes",
      descripcion: "Firma de documentos y cierre de operación",
      recordatorio: true,
      completado: false,
    },
    {
      id: "e9",
      titulo: "Videoconferencia seguimiento",
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 4, 11, 0),
      horaInicio: "11:00",
      horaFin: "11:45",
      tipo: "videoconferencia",
      leadId: "lead-9",
      leadNombre: "Valentina Torres",
      descripcion: "Seguimiento de avance en evaluación bancaria",
      recordatorio: false,
      completado: false,
    },
  ];
  return eventos;
}

const tipoConfig: Record<string, { label: string; color: string; bg: string; icono: React.ReactNode }> = {
  reunion: { label: "Reunión", color: "text-purple-600", bg: "bg-purple-50", icono: <Users size={14} /> },
  llamada: { label: "Llamada", color: "text-blue-600", bg: "bg-blue-50", icono: <Phone size={14} /> },
  seguimiento: { label: "Seguimiento", color: "text-amber-600", bg: "bg-amber-50", icono: <Clock size={14} /> },
  tarea: { label: "Tarea", color: "text-emerald-600", bg: "bg-emerald-50", icono: <FileText size={14} /> },
  videoconferencia: { label: "Video", color: "text-indigo-600", bg: "bg-indigo-50", icono: <Video size={14} /> },
};

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const HORAS_DIA = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);

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
    titulo: "",
    tipo: "reunion" as Evento["tipo"],
    horaInicio: "10:00",
    horaFin: "11:00",
    leadNombre: "",
    ubicacion: "",
    descripcion: "",
    recordatorio: true,
  });

  useEffect(() => {
    async function cargarEventos() {
      try {
        const res = await fetch("/api/eventos");
        const json = await res.json();
        if (json.success && json.data) {
          setEventos(json.data.map((e: Record<string, any>) => ({
            ...e,
            fecha: e.fecha ? new Date(e.fecha) : new Date(),
          })));
        }
      } catch {
        setEventos([]);
      } finally {
        setCargando(false);
      }
    }
    cargarEventos();
  }, []);

  // Leads para selector
  const leadsFiltrados = useMemo(() => leads.slice(0, 20), [leads]);

  // Cálculos del calendario
  const primerDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
  const ultimoDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
  const diasEnMes = ultimoDiaMes.getDate();
  const diaSemanaInicio = (primerDiaMes.getDay() + 6) % 7;

  // Eventos filtrados
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((e) => {
      const coincideTipo = filtroTipo === "todos" || e.tipo === filtroTipo;
      const coincideBusqueda = !busqueda || e.titulo.toLowerCase().includes(busqueda.toLowerCase()) || e.leadNombre?.toLowerCase().includes(busqueda.toLowerCase());
      return coincideTipo && coincideBusqueda;
    });
  }, [eventos, filtroTipo, busqueda]);

  // Eventos del día seleccionado
  const eventosHoy = useMemo(() => {
    return eventosFiltrados
      .filter((e) => e.fecha.toDateString() === fechaSeleccionada.toDateString())
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }, [eventosFiltrados, fechaSeleccionada]);

  // Eventos de la semana
  const eventosSemana = useMemo(() => {
    const inicioSemana = new Date(fechaSeleccionada);
    inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7));
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 6);

    return eventosFiltrados.filter((e) => {
      const fecha = new Date(e.fecha);
      return fecha >= inicioSemana && fecha <= finSemana;
    });
  }, [eventosFiltrados, fechaSeleccionada]);

  // Estadísticas
  const stats = useMemo(() => {
    const hoy = new Date();
    const eventosHoyCount = eventos.filter((e) => e.fecha.toDateString() === hoy.toDateString()).length;
    const proximos7Dias = eventos.filter((e) => {
      const fecha = new Date(e.fecha);
      const diff = fecha.getTime() - hoy.getTime();
      return diff > 0 && diff < 7 * 86400000;
    }).length;
    const pendientes = eventos.filter((e) => !e.completado).length;
    const completados = eventos.filter((e) => e.completado).length;

    return { eventosHoyCount, proximos7Dias, pendientes, completados };
  }, [eventos]);

  const navegarMes = (direccion: number) => {
    setMesActual((prev) => {
      const nuevaFecha = new Date(prev);
      nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
      return nuevaFecha;
    });
  };

  const seleccionarDia = (dia: number) => {
    setFechaSeleccionada(new Date(mesActual.getFullYear(), mesActual.getMonth(), dia));
  };

  const eventosPorDia = (dia: number) => {
    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
    return eventosFiltrados.filter((e) => e.fecha.toDateString() === fecha.toDateString());
  };

  const toggleCompletado = async (eventoId: string) => {
    const evento = eventos.find((e) => e.id === eventoId);
    if (!evento) return;
    try {
      await fetch(`/api/eventos/${eventoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completado: !evento.completado }),
      });
      setEventos((prev) =>
        prev.map((e) => (e.id === eventoId ? { ...e, completado: !e.completado } : e))
      );
    } catch {
      // Error silencioso
    }
  };

  const eliminarEvento = async (eventoId: string) => {
    try {
      await fetch(`/api/eventos/${eventoId}`, { method: "DELETE" });
      setEventos((prev) => prev.filter((e) => e.id !== eventoId));
      setDetalleEvento(null);
    } catch {
      // Error silencioso
    }
  };

  const handleCrearEvento = async () => {
    try {
      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: nuevoEvento.titulo,
          fecha: fechaSeleccionada.toISOString().split("T")[0],
          horaInicio: nuevoEvento.horaInicio,
          horaFin: nuevoEvento.horaFin,
          tipo: nuevoEvento.tipo,
          leadNombre: nuevoEvento.leadNombre || null,
          ubicacion: nuevoEvento.ubicacion || null,
          descripcion: nuevoEvento.descripcion || null,
          recordatorio: nuevoEvento.recordatorio,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setEventos((prev) => [...prev, { ...json.data, fecha: new Date(json.data.fecha) }]);
      }
    } catch {
      // Error silencioso
    }
    setCrearEventoOpen(false);
    setNuevoEvento({
      titulo: "",
      tipo: "reunion",
      horaInicio: "10:00",
      horaFin: "11:00",
      leadNombre: "",
      ubicacion: "",
      descripcion: "",
      recordatorio: true,
    });
  };

  const handleCrearEventoGoogle = async (eventoData: {
    titulo: string;
    descripcion: string;
    fechaInicio: Date;
    fechaFin: Date;
    crearMeet: boolean;
    emails: string[];
  }) => {
    const horaInicio = `${eventoData.fechaInicio.getHours().toString().padStart(2, "0")}:${eventoData.fechaInicio.getMinutes().toString().padStart(2, "0")}`;
    const horaFin = `${eventoData.fechaFin.getHours().toString().padStart(2, "0")}:${eventoData.fechaFin.getMinutes().toString().padStart(2, "0")}`;

    let googleEventId: string | undefined;
    let meetLink: string | undefined;
    let calendarLink: string | undefined;

    if (isGoogleAuthenticated()) {
      const result = await createGoogleCalendarEvent({
        titulo: eventoData.titulo,
        descripcion: eventoData.descripcion,
        fechaInicio: eventoData.fechaInicio,
        fechaFin: eventoData.fechaFin,
        crearMeet: eventoData.crearMeet,
        emails: eventoData.emails,
      });

      if (result.success) {
        googleEventId = result.eventId;
        meetLink = result.meetLink;
        calendarLink = result.calendarLink;
        toast.success("Evento creado en Google Calendar", {
          description: result.meetLink ? "Se creó el enlace de Google Meet" : "Evento sincronizado",
        });
      }
    } else {
      if (eventoData.crearMeet) {
        meetLink = "https://meet.google.com/new";
        toast.info("Evento creado localmente", {
          description: "Conecta Google Calendar para sincronizar automáticamente",
        });
      }
    }

    try {
      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: eventoData.titulo,
          fecha: eventoData.fechaInicio.toISOString().split("T")[0],
          horaInicio,
          horaFin,
          tipo: eventoData.crearMeet ? "videoconferencia" : "reunion",
          descripcion: eventoData.descripcion || null,
          recordatorio: true,
          googleEventId: googleEventId || null,
          meetLink: meetLink || null,
          calendarLink: calendarLink || null,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setEventos((prev) => [...prev, { ...json.data, fecha: new Date(json.data.fecha) }]);
      }
    } catch {
      // Error silencioso
    }
    setCrearEventoOpen(false);
  };

  const getDiasSemana = () => {
    const inicio = new Date(fechaSeleccionada);
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const dia = new Date(inicio);
      dia.setDate(dia.getDate() + i);
      return dia;
    });
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-slate-500">Cargando agenda...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Agenda</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Gestiona tus reuniones y eventos</p>
        </div>
        <div className="flex items-center gap-3">
          <GoogleCalendarIntegration />
          <button
            onClick={() => setCrearEventoOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 gradient-primary text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15"
          >
            <Plus size={14} /> Nuevo Evento
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar size={14} className="text-blue-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Hoy</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.eventosHoyCount}</div>
          <div className="text-[9px] text-slate-400">eventos programados</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock size={14} className="text-amber-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Próximos 7 días</span>
          </div>
          <div className="text-xl font-bold text-amber-600">{stats.proximos7Dias}</div>
          <div className="text-[9px] text-slate-400">eventos pendientes</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target size={14} className="text-purple-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Pendientes</span>
          </div>
          <div className="text-xl font-bold text-purple-600">{stats.pendientes}</div>
          <div className="text-[9px] text-slate-400">por completar</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={14} className="text-emerald-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Completados</span>
          </div>
          <div className="text-xl font-bold text-emerald-600">{stats.completados}</div>
          <div className="text-[9px] text-slate-400">esta semana</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Calendario */}
        <div className="col-span-2 bg-white rounded-2xl p-5 border border-slate-100/80">
          {/* Header del Calendario */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-slate-900">
                {mesActual.toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                {(["mes", "semana", "dia"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVista(v)}
                    className={`px-3 py-1 rounded-md text-[10px] font-semibold transition-all ${
                      vista === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {v === "mes" ? "Mes" : v === "semana" ? "Semana" : "Día"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navegarMes(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              <button
                onClick={() => { setMesActual(new Date()); setFechaSeleccionada(new Date()); }}
                className="px-3 py-1.5 text-[10px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
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
                  <div key={dia} className="text-center text-[10px] font-semibold text-slate-400 py-2">{dia}</div>
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
                  const tieneReuniones = eventosDia.some((e) => e.tipo === "reunion");
                  const tieneLlamadas = eventosDia.some((e) => e.tipo === "llamada");

                  return (
                    <button
                      key={dia}
                      onClick={() => seleccionarDia(dia)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative ${
                        esSeleccionado ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" :
                        esHoy ? "bg-blue-50 text-blue-600 font-bold border-2 border-blue-200" :
                        "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className={`text-[12px] font-semibold ${esSeleccionado ? "text-white" : ""}`}>{dia}</span>
                      {eventosDia.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {tieneReuniones && <div className={`w-1.5 h-1.5 rounded-full ${esSeleccionado ? "bg-white" : "bg-purple-500"}`} />}
                          {tieneLlamadas && <div className={`w-1.5 h-1.5 rounded-full ${esSeleccionado ? "bg-white" : "bg-blue-500"}`} />}
                          {!tieneReuniones && !tieneLlamadas && <div className={`w-1.5 h-1.5 rounded-full ${esSeleccionado ? "bg-white" : "bg-slate-400"}`} />}
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
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${esHoy ? "bg-blue-50 border border-blue-100" : "bg-slate-50"}`}>
                    <div className={`w-12 text-center ${esHoy ? "text-blue-600" : "text-slate-600"}`}>
                      <div className="text-[10px] font-medium">{DIAS_SEMANA[i]}</div>
                      <div className="text-lg font-bold">{dia.getDate()}</div>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-2">
                      {eventosDia.length === 0 ? (
                        <span className="text-[10px] text-slate-400 py-2">Sin eventos</span>
                      ) : (
                        eventosDia.map((evento) => (
                          <div
                            key={evento.id}
                            onClick={() => setDetalleEvento(evento)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:shadow-sm transition-all ${tipoConfig[evento.tipo].bg}`}
                          >
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

          {/* Vista Día */}
          {vista === "dia" && (
            <div className="space-y-1">
              {HORAS_DIA.map((hora) => {
                const eventosEnHora = eventosFiltrados.filter((e) => {
                  const fechaEvento = e.fecha.toDateString() === fechaSeleccionada.toDateString();
                  const horaEvento = parseInt(e.horaInicio.split(":")[0]);
                  const horaActual = parseInt(hora.split(":")[0]);
                  return fechaEvento && horaEvento === horaActual;
                });

                return (
                  <div key={hora} className="flex items-start gap-3 min-h-[60px]">
                    <div className="w-16 text-right">
                      <span className="text-[10px] text-slate-400 font-medium">{hora}</span>
                    </div>
                    <div className="flex-1 border-l-2 border-slate-100 pl-4 py-1">
                      {eventosEnHora.map((evento) => (
                        <div
                          key={evento.id}
                          onClick={() => setDetalleEvento(evento)}
                          className={`p-3 rounded-xl mb-1 cursor-pointer hover:shadow-sm transition-all ${tipoConfig[evento.tipo].bg} border border-transparent hover:border-slate-200`}
                        >
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
                              {evento.ubicacion && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <MapPin size={10} className="text-slate-400" />
                                  <span className="text-[10px] text-slate-500">{evento.ubicacion}</span>
                                </>
                              )}
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
          {/* Filtros */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100/80">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar evento..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFiltroTipo("todos")}
                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-semibold transition-colors ${
                  filtroTipo === "todos" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Todos
              </button>
              {Object.entries(tipoConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFiltroTipo(key)}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-semibold transition-colors ${
                    filtroTipo === key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Eventos del Día */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100/80">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {fechaSeleccionada.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{eventosHoy.length} evento{eventosHoy.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {eventosHoy.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar size={32} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-[11px] text-slate-400">Sin eventos este día</p>
                  <button
                    onClick={() => setCrearEventoOpen(true)}
                    className="mt-2 text-[10px] text-blue-600 font-semibold hover:text-blue-700"
                  >
                    + Agregar evento
                  </button>
                </div>
              ) : (
                eventosHoy.map((evento) => (
                  <div
                    key={evento.id}
                    onClick={() => setDetalleEvento(evento)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
                      evento.completado ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-100 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCompletado(evento.id); }}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            evento.completado ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-blue-400"
                          }`}
                        >
                          {evento.completado && <CheckCircle size={10} className="text-white" />}
                        </button>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${tipoConfig[evento.tipo].bg} ${tipoConfig[evento.tipo].color}`}>
                          {tipoConfig[evento.tipo].label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{evento.horaInicio}</span>
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

          {/* Próximos Eventos */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-4 text-white">
            <h3 className="text-sm font-bold mb-3">Próximos Eventos</h3>
            <div className="space-y-2">
              {eventosFiltrados
                .filter((e) => new Date(e.fecha) > new Date() && !e.completado)
                .slice(0, 3)
                .map((evento) => (
                  <div key={evento.id} className="flex items-center gap-3 p-2 bg-white/10 rounded-xl">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      {tipoConfig[evento.tipo].icono}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold truncate">{evento.titulo}</div>
                      <div className="text-[9px] text-blue-200">
                        {evento.fecha.toLocaleDateString("es-CL", { weekday: "short", day: "numeric" })} • {evento.horaInicio}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Crear Evento */}
      <Dialog open={crearEventoOpen} onOpenChange={setCrearEventoOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0">
          <DialogHeader className="p-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Plus size={18} className="text-blue-600" />
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
              <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Título</label>
              <input
                type="text"
                placeholder="Ej: Reunión con cliente..."
                value={nuevoEvento.titulo}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, titulo: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Tipo</label>
                <select
                  value={nuevoEvento.tipo}
                  onChange={(e) => setNuevoEvento({ ...nuevoEvento, tipo: e.target.value as Evento["tipo"] })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
                >
                  {Object.entries(tipoConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Cliente</label>
                <select
                  value={nuevoEvento.leadNombre}
                  onChange={(e) => setNuevoEvento({ ...nuevoEvento, leadNombre: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
                >
                  <option value="">Sin cliente</option>
                  {leadsFiltrados.slice(0, 10).map((lead) => (
                    <option key={lead.id} value={`${lead.nombre} ${lead.apellido}`}>{lead.nombre} {lead.apellido}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Hora Inicio</label>
                <input
                  type="time"
                  value={nuevoEvento.horaInicio}
                  onChange={(e) => setNuevoEvento({ ...nuevoEvento, horaInicio: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Hora Fin</label>
                <input
                  type="time"
                  value={nuevoEvento.horaFin}
                  onChange={(e) => setNuevoEvento({ ...nuevoEvento, horaFin: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Ubicación (opcional)</label>
              <input
                type="text"
                placeholder="Ej: Oficina Central, Sala 1"
                value={nuevoEvento.ubicacion}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, ubicacion: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">Descripción (opcional)</label>
              <textarea
                placeholder="Notas sobre el evento..."
                value={nuevoEvento.descripcion}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, descripcion: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recordatorio"
                checked={nuevoEvento.recordatorio}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, recordatorio: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="recordatorio" className="text-[11px] text-slate-600">Enviar recordatorio</label>
            </div>
          </div>

          <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCrearEventoOpen(false)}
              className="px-4 py-2.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCrearEventoOpen(false);
                  setCrearEventoGoogleOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold hover:bg-slate-50 transition-colors"
              >
                <Video size={14} className="text-blue-500" /> Con Google Meet
              </button>
              <button
                onClick={handleCrearEvento}
                disabled={!nuevoEvento.titulo}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
                      <div className="text-[11px] font-semibold text-slate-800">
                        {detalleEvento.fecha.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
                      </div>
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
                      <div className="text-[9px] text-slate-400">Ubicación</div>
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

                {detalleEvento.calendarLink && (
                  <a
                    href={detalleEvento.calendarLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <Calendar size={14} className="text-blue-500" />
                    <span className="text-[11px] font-medium text-blue-600">Ver en Google Calendar</span>
                    <ExternalLink size={10} className="text-blue-400" />
                  </a>
                )}

                {detalleEvento.descripcion && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-[9px] text-slate-400 mb-1">Descripción</div>
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
                  <button
                    onClick={() => toggleCompletado(detalleEvento.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold transition-colors ${
                      detalleEvento.completado ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <CheckCircle size={12} /> {detalleEvento.completado ? "Completado" : "Marcar completo"}
                  </button>
                  <button
                    onClick={() => eliminarEvento(detalleEvento.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-semibold hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={12} /> Eliminar
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {detalleEvento.tipo === "llamada" && (
                    <a href={`tel:`} className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors">
                      <Phone size={14} />
                    </a>
                  )}
                  {detalleEvento.tipo === "videoconferencia" && (
                    <button className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-colors">
                      <Video size={14} />
                    </button>
                  )}
                  <button className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                    <Edit size={14} />
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
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Video size={18} className="text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-slate-900">Crear Reunión con Google Meet</DialogTitle>
                <DialogDescription className="text-slate-500">
                  Crea un evento sincronizado con Google Calendar
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-5">
            <CrearEventoGoogle
              onCrearEvento={handleCrearEventoGoogle}
              onClose={() => setCrearEventoGoogleOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
