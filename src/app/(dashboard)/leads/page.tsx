"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  Download,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Building2,
  DollarSign,
  Users,
  UserPlus,
  TrendingUp,
  RefreshCw,
  Bell,
} from "lucide-react";
import { ETAPAS_CONFIG, ORIGEN_LABELS } from "@/tipos";
import { FormularioLead } from "@/componentes/leads/FormularioLead";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatoMonedaAbreviado, formatoUF } from "@/lib/utils";
import { useLeads } from "@/lib/contexts/LeadContext";
import { useUser } from "@/lib/contexts/UserContext";
import { useActivities } from "@/lib/contexts/ActivityContext";
import { toast } from "sonner";
import type { Lead, Etapa, Prioridad } from "@/tipos";

const prioridadConfig: Record<Prioridad, { label: string; class: string; dot: string }> = {
  BAJA: { label: "Baja", class: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  MEDIA: { label: "Media", class: "bg-blue-50 text-blue-600 border border-blue-100", dot: "bg-blue-500" },
  ALTA: { label: "Alta", class: "bg-orange-50 text-orange-600 border border-orange-100", dot: "bg-orange-500" },
  URGENTE: { label: "Urgente", class: "bg-red-50 text-red-600 border border-red-100", dot: "bg-red-500" },
};

const ORIGENES = [
  { value: "todos", label: "Todos los orígenes" },
  { value: "WEB", label: "Sitio Web" },
  { value: "FACEBOOK", label: "Facebook Ads" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "GOOGLE", label: "Google Ads" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "REFERIDO", label: "Referido" },
];

const ETAPAS_FILTRO = [
  { value: "todos", label: "Todas las etapas" },
  ...Object.entries(ETAPAS_CONFIG).map(([key, val]) => ({ value: key, label: val.label })),
];

export default function LeadsPage() {
  const router = useRouter();
  const { leads, agregarLead, actualizarLead, eliminarLead } = useLeads();
  const { usuarioActual, esSuperAdmin } = useUser();
  const { agregarActividad } = useActivities();
  const [busqueda, setBusqueda] = useState("");
  const [filtroOrigen, setFiltroOrigen] = useState("todos");
  const [filtroEtapa, setFiltroEtapa] = useState("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todos");
  const [vistaActiva, setVistaActiva] = useState<"tabla" | "tarjetas">("tabla");
  const [ordenarPor, setOrdenarPor] = useState<string>("recientes");

  const [formularioOpen, setFormularioOpen] = useState(false);
  const [leadSeleccionado, setLeadSeleccionado] = useState<Lead | null>(null);
  const [eliminarDialogOpen, setEliminarDialogOpen] = useState(false);
  const [leadAEliminar, setLeadAEliminar] = useState<Lead | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const LEADS_POR_PAGINA = 25;

  // Tiempo real
  const [nuevosLeads, setNuevosLeads] = useState(0);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const leadsAnteriores = useRef(leads.length);

  // Detectar nuevos leads
  useEffect(() => {
    if (leads.length > leadsAnteriores.current) {
      const diferencia = leads.length - leadsAnteriores.current;
      setNuevosLeads((prev) => prev + diferencia);
      setUltimaActualizacion(new Date());

      // Notificar solo leads nuevos sin asignar
      const leadNuevo = leads[0];
      if (leadNuevo && !leadNuevo.nombreEjecutivo) {
        toast.info("Nuevo lead recibido", {
          description: `${leadNuevo.nombre} ${leadNuevo.apellido} - ${ORIGEN_LABELS[leadNuevo.origen]}`,
          duration: 5000,
        });
      }
    }
    leadsAnteriores.current = leads.length;
  }, [leads]);

  const mostrarNuevosLeads = () => {
    setNuevosLeads(0);
    setUltimaActualizacion(new Date());
  };

  const leadsFiltrados = leads
    .filter((lead) => {
      const coincideBusqueda =
        !busqueda ||
        lead.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        lead.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
        lead.rut.includes(busqueda) ||
        lead.email?.toLowerCase().includes(busqueda.toLowerCase());
      const coincideOrigen = filtroOrigen === "todos" || lead.origen === filtroOrigen;
      const coincideEtapa = filtroEtapa === "todos" || lead.etapa === filtroEtapa;
      const coincidePrioridad = filtroPrioridad === "todos" || lead.prioridad === filtroPrioridad;
      return coincideBusqueda && coincideOrigen && coincideEtapa && coincidePrioridad;
    })
    .sort((a, b) => {
      if (ordenarPor === "recientes") return b.creadoEn.getTime() - a.creadoEn.getTime();
      if (ordenarPor === "monto") return (b.montoSolicitado || 0) - (a.montoSolicitado || 0);
      if (ordenarPor === "nombre") return a.nombre.localeCompare(b.nombre);
      if (ordenarPor === "dias") return a.diasEnEtapa - b.diasEnEtapa;
      return 0;
    });

  const stats = {
    total: leads.length,
    nuevosHoy: leads.filter((l) => l.etapa === "NUEVO_LEAD").length,
    enPipeline: leads.filter((l) => !["CLIENTE_FINALIZADO", "CREDITO_PAGADO"].includes(l.etapa)).length,
    aprobados: leads.filter((l) => ["APROBADO", "FIRMA_DIGITAL", "NOTARIA"].includes(l.etapa)).length,
    montoTotal: leads.reduce((acc, l) => acc + (l.montoSolicitado || 0), 0),
  };

  const totalPaginas = Math.ceil(leadsFiltrados.length / LEADS_POR_PAGINA);
  const leadsPaginados = leadsFiltrados.slice(
    (paginaActual - 1) * LEADS_POR_PAGINA,
    paginaActual * LEADS_POR_PAGINA
  );

  const exportarCSV = () => {
    const headers = ["Nombre", "Apellido", "RUT", "Email", "Teléfono", "Etapa", "Origen", "Prioridad", "Monto", "Banco", "Ejecutivo", "Días en etapa", "Creado"];
    const rows = leadsFiltrados.map((l) => [
      l.nombre, l.apellido, l.rut, l.email || "", l.telefono || "",
      ETAPAS_CONFIG[l.etapa]?.label || l.etapa, ORIGEN_LABELS[l.origen] || l.origen,
      l.prioridad, l.montoSolicitado || 0, l.banco || "", l.nombreEjecutivo || "",
      l.diasEnEtapa, l.creadoEn.toLocaleDateString("es-CL"),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado", { description: `${leadsFiltrados.length} leads exportados` });
  };

  const handleNuevoLead = () => {
    setLeadSeleccionado(null);
    setFormularioOpen(true);
  };

  const handleEditarLead = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setLeadSeleccionado(lead);
    setFormularioOpen(true);
  };

  const handleEliminarLead = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setLeadAEliminar(lead);
    setEliminarDialogOpen(true);
  };

  const handleVerLead = (lead: Lead) => {
    router.push(`/leads/${lead.id}`);
  };

  const handleConfirmarEliminar = () => {
    if (leadAEliminar) {
      const nombre = `${leadAEliminar.nombre} ${leadAEliminar.apellido}`;
      eliminarLead(leadAEliminar.id);
      setLeadAEliminar(null);
      toast.success("Lead eliminado", {
        description: `${nombre} fue eliminado de la lista`,
      });
    }
  };

  const handleSubmitLead = (data: Partial<Lead>) => {
    if (leadSeleccionado) {
      actualizarLead(leadSeleccionado.id, data);
      agregarActividad({
        leadId: leadSeleccionado.id,
        tipo: "nota",
        titulo: "Lead actualizado",
        descripcion: `${data.nombre} ${data.apellido} fue actualizado`,
        usuario: usuarioActual?.nombre ? `${usuarioActual.nombre} ${usuarioActual.apellido}` : "Sistema",
        usuarioId: usuarioActual?.id || "system",
      });
      toast.success("Lead actualizado", {
        description: `${data.nombre} ${data.apellido} fue actualizado`,
      });
    } else {
      const newLead: Lead = {
        id: `lead-${Date.now()}`,
        nombre: data.nombre || "",
        apellido: data.apellido || "",
        rut: data.rut || "",
        email: data.email,
        telefono: data.telefono,
        situacionLaboral: data.situacionLaboral || "INDEPENDIENTE",
        enDicom: data.enDicom || false,
        dicomDetalle: data.dicomDetalle,
        rentaMensual: data.rentaMensual,
        complementarRenta: data.complementarRenta,
        tipoCredito: data.tipoCredito,
        cuentaPie: data.cuentaPie,
        comentarios: data.comentarios,
        origen: data.origen || "WEB",
        etapa: data.etapa || "NUEVO_LEAD",
        prioridad: data.prioridad || "MEDIA",
        banco: data.banco,
        montoSolicitado: data.montoSolicitado,
        valorPropiedad: data.valorPropiedad,
        pieDisponible: data.pieDisponible,
        notas: data.notas || data.comentarios,
        creadoEn: new Date(),
        diasEnEtapa: 0,
      };
      agregarLead(newLead);
      agregarActividad({
        leadId: newLead.id,
        tipo: "sistema",
        titulo: "Lead creado",
        descripcion: `${newLead.nombre} ${newLead.apellido} fue agregado al sistema`,
        usuario: usuarioActual?.nombre ? `${usuarioActual.nombre} ${usuarioActual.apellido}` : "Sistema",
        usuarioId: usuarioActual?.id || "system",
      });
      toast.success("Lead creado", {
        description: `${newLead.nombre} ${newLead.apellido} fue agregado`,
      });
    }
  };

  const getDiasEstilo = (dias: number) => {
    if (dias <= 3) return "text-emerald-600 bg-emerald-50";
    if (dias <= 7) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Leads</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{leadsFiltrados.length} leads encontrados</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-600">EN VIVO</span>
            </div>
            {nuevosLeads > 0 && (
              <button
                onClick={mostrarNuevosLeads}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                <Bell size={10} />
                <span className="text-[10px] font-semibold">{nuevosLeads} nuevos</span>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">
            Actualizado {ultimaActualizacion.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button onClick={exportarCSV} className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <Download size={14} /> Exportar CSV
          </button>
          <button
            onClick={handleNuevoLead}
            className="flex items-center gap-1.5 px-4 py-2.5 gradient-primary text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15"
          >
            <Plus size={14} /> Nuevo Lead
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users size={14} className="text-blue-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Total</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.total.toLocaleString("es-CL")}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <UserPlus size={14} className="text-emerald-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Nuevos Hoy</span>
          </div>
          <div className="text-xl font-bold text-emerald-600">{stats.nuevosHoy}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock size={14} className="text-amber-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">En Pipeline</span>
          </div>
          <div className="text-xl font-bold text-amber-600">{stats.enPipeline}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100/80 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={14} className="text-purple-600" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Aprobados</span>
          </div>
          <div className="text-xl font-bold text-purple-600">{stats.aprobados}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign size={14} className="text-white" />
            </div>
            <span className="text-[10px] text-blue-200 font-medium">Monto Total</span>
          </div>
          <div className="text-xl font-bold">{formatoMonedaAbreviado(stats.montoTotal)}</div>
          <div className="text-[10px] text-blue-200">{formatoUF(stats.montoTotal)}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 border border-slate-100/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUT o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>
          <select
            value={filtroOrigen}
            onChange={(e) => setFiltroOrigen(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 font-medium"
          >
            {ORIGENES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={filtroEtapa}
            onChange={(e) => setFiltroEtapa(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 font-medium"
          >
            {ETAPAS_FILTRO.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
          <select
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 font-medium"
          >
            <option value="todos">Todas las prioridades</option>
            <option value="URGENTE">Urgente</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </select>
          <select
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 font-medium"
          >
            <option value="recientes">Más recientes</option>
            <option value="monto">Mayor monto</option>
            <option value="nombre">Nombre A-Z</option>
            <option value="dias">Menos días</option>
          </select>
          <div className="flex bg-slate-100 rounded-xl p-0.5">
            <button
              onClick={() => setVistaActiva("tabla")}
              className={`p-2 rounded-lg transition-colors ${vistaActiva === "tabla" ? "bg-white shadow-sm" : ""}`}
            >
              <List size={14} className={vistaActiva === "tabla" ? "text-slate-700" : "text-slate-400"} />
            </button>
            <button
              onClick={() => setVistaActiva("tarjetas")}
              className={`p-2 rounded-lg transition-colors ${vistaActiva === "tarjetas" ? "bg-white shadow-sm" : ""}`}
            >
              <LayoutGrid size={14} className={vistaActiva === "tarjetas" ? "text-slate-700" : "text-slate-400"} />
            </button>
          </div>
        </div>
      </div>

      {/* Vista de Tabla */}
      {vistaActiva === "tabla" && (
        <div className="bg-white rounded-2xl border border-slate-100/80 shadow-soft overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Lead</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Etapa</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Origen</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Banco</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Prioridad</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tiempo</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Ejecutivo</th>
                <th className="text-right px-5 py-3.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leadsPaginados.map((lead) => {
                const config = ETAPAS_CONFIG[lead.etapa];
                return (
                  <tr
                    key={lead.id}
                    onClick={() => handleVerLead(lead)}
                    className="border-b border-slate-50/80 hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                            {lead.nombre[0]}{lead.apellido[0]}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${prioridadConfig[lead.prioridad].dot}`} />
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-slate-800">{lead.nombre} {lead.apellido}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{lead.rut}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                        <Phone size={10} className="text-slate-400" />
                        {lead.telefono}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px] flex items-center gap-1.5 mt-0.5">
                        <Mail size={10} className="text-slate-400" />
                        {lead.email}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                        <span className="text-[10px] font-semibold text-slate-700">{config.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                        {ORIGEN_LABELS[lead.origen]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-[12px] font-bold text-slate-900">
                        {formatoMonedaAbreviado(lead.montoSolicitado || 0)}
                      </div>
                      <div className="text-[11px] text-blue-600 font-medium">{formatoUF(lead.montoSolicitado || 0)}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={10} className="text-slate-400" />
                        <span className="text-[10px] text-slate-600 font-medium">{lead.banco || "-"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${prioridadConfig[lead.prioridad].class}`}>
                        {prioridadConfig[lead.prioridad].label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${getDiasEstilo(lead.diasEnEtapa)}`}>
                        {lead.diasEnEtapa}d
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center text-[7px] font-bold text-white">
                          {lead.nombreEjecutivo?.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-[10px] text-slate-600 font-medium">{lead.nombreEjecutivo?.split(" ")[0]}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => handleEditarLead(lead, e)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil size={13} className="text-blue-500" />
                        </button>
                        <button className="p-2 hover:bg-emerald-100 rounded-lg transition-colors" title="Llamar">
                          <Phone size={13} className="text-emerald-500" />
                        </button>
                        <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors" title="Email">
                          <Mail size={13} className="text-blue-500" />
                        </button>
                        <button className="p-2 hover:bg-green-100 rounded-lg transition-colors" title="WhatsApp">
                          <MessageSquare size={13} className="text-green-500" />
                        </button>
                        <button
                          onClick={(e) => handleEliminarLead(lead, e)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={13} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {leadsFiltrados.length > LEADS_POR_PAGINA && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Mostrando {(paginaActual - 1) * LEADS_POR_PAGINA + 1}-{Math.min(paginaActual * LEADS_POR_PAGINA, leadsFiltrados.length)} de {leadsFiltrados.length} leads
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Anterior
                </button>
                {Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => {
                  const pagina = i + 1;
                  return (
                    <button
                      key={pagina}
                      onClick={() => setPaginaActual(pagina)}
                      className={`w-8 h-8 text-[11px] font-semibold rounded-lg ${
                        paginaActual === pagina
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {pagina}
                    </button>
                  );
                })}
                {totalPaginas > 5 && <span className="text-[11px] text-slate-400">...</span>}
                <button
                  onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista de Tarjetas */}
      {vistaActiva === "tarjetas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {leadsFiltrados.slice(0, 24).map((lead) => {
            const config = ETAPAS_CONFIG[lead.etapa];
            return (
              <div
                key={lead.id}
                onClick={() => handleVerLead(lead)}
                className="bg-white rounded-2xl border border-slate-100/80 p-4 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shadow-sm">
                        {lead.nombre[0]}{lead.apellido[0]}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${prioridadConfig[lead.prioridad].dot}`} />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-slate-800">{lead.nombre} {lead.apellido}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{lead.rut}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleEditarLead(lead, e)}
                      className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Pencil size={12} className="text-blue-500" />
                    </button>
                    <button
                      onClick={(e) => handleEliminarLead(lead, e)}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 size={12} className="text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider">Monto</div>
                      <div className="text-[16px] font-bold text-slate-900">{formatoMonedaAbreviado(lead.montoSolicitado || 0)}</div>
                      <div className="text-[10px] text-blue-600 font-medium">{formatoUF(lead.montoSolicitado || 0)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider">Banco</div>
                      <div className="text-[11px] font-bold text-slate-700">{lead.banco || "-"}</div>
                      <div className="text-[11px] text-slate-400">{lead.tipoCredito || "-"}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                    <span className="text-[10px] font-semibold text-slate-700">{config.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-300">•</span>
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {ORIGEN_LABELS[lead.origen]}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ml-auto ${getDiasEstilo(lead.diasEnEtapa)}`}>
                    {lead.diasEnEtapa}d
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center text-[7px] font-bold text-white">
                      {lead.nombreEjecutivo?.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span className="text-[10px] text-slate-600 font-medium">{lead.nombreEjecutivo}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${prioridadConfig[lead.prioridad].class}`}>
                    {prioridadConfig[lead.prioridad].label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulario */}
      <FormularioLead
        open={formularioOpen}
        onOpenChange={setFormularioOpen}
        lead={leadSeleccionado}
        onSubmit={handleSubmitLead}
      />

      {/* Diálogo Eliminar */}
      <ConfirmDialog
        open={eliminarDialogOpen}
        onOpenChange={setEliminarDialogOpen}
        title="Eliminar Lead"
        description={`¿Estás seguro de eliminar a ${leadAEliminar?.nombre} ${leadAEliminar?.apellido}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleConfirmarEliminar}
      />
    </div>
  );
}