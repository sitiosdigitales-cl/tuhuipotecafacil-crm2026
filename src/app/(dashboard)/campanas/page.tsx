"use client";

import { useState, useMemo, useRef } from "react";
import {
  Mail,
  MessageSquare,
  Phone,
  Send,
  Users,
  User,
  Eye,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Pause,
  Play,
  Plus,
  Search,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Copy,
  RefreshCw,
  Settings,
  Trash2,
  Edit,
  EyeOff,
  Percent,
  FileText,
  Image,
  Video,
  Globe,
  Smartphone,
  Bell,
  Star,
  Award,
  Trophy,
  Medal,
  Crown,
} from "lucide-react";
import { formatoMoneda, formatoMonedaAbreviado } from "@/lib/utils";

// Datos mock de campañas (fechas fijas para evitar hidratación)
const CAMPANAS_MOCK = [
  {
    id: "c1",
    nombre: "Black Friday Hipotecario 2024",
    tipo: "EMAIL",
    estado: "ACTIVA",
    descripcion: "Campaña de ofertas especiales para crédito hipotecario durante el Black Friday",
    fechaInicio: new Date(2026, 5, 24),
    fechaFin: new Date(2026, 6, 24),
    presupuesto: 2500000,
    gastado: 1800000,
    audiencia: 5000,
    enviados: 4200,
    abiertos: 1680,
    clics: 420,
    conversiones: 42,
    ingresos: 6300000000,
    roi: 250,
    segmento: "Leads fríos + Clientes existentes",
    plantilla: "Oferta Especial Black Friday",
    creador: "Andrés Pérez",
    creadoEn: new Date(2026, 5, 19),
  },
  {
    id: "c2",
    nombre: "Reactivación Leads Q4",
    tipo: "WHATSAPP",
    estado: "ACTIVA",
    descripcion: "Reactivar leads que no han respondido en los últimos 90 días",
    fechaInicio: new Date(2026, 5, 29),
    fechaFin: new Date(2026, 6, 29),
    presupuesto: 1500000,
    gastado: 800000,
    audiencia: 3200,
    enviados: 2800,
    abiertos: 2240,
    clics: 560,
    conversiones: 84,
    ingresos: 4200000000,
    roi: 280,
    segmento: "Leads sin contacto 90+ días",
    plantilla: "Reactivación Especial",
    creador: "Carolina Muñoz",
    creadoEn: new Date(2026, 5, 26),
  },
  {
    id: "c3",
    nombre: "Programa de Referidos Premium",
    tipo: "REFERIDO",
    estado: "ACTIVA",
    descripcion: "Incentivar a clientes actuales para referir nuevos prospectos",
    fechaInicio: new Date(2026, 5, 4),
    fechaFin: new Date(2026, 7, 3),
    presupuesto: 5000000,
    gastado: 3200000,
    audiencia: 1200,
    enviados: 1200,
    abiertos: 960,
    clics: 480,
    conversiones: 96,
    ingresos: 7200000000,
    roi: 225,
    segmento: "Clientes satisfechos",
    plantilla: "Invitación Referidos",
    creador: "Diego Silva",
    creadoEn: new Date(2026, 4, 30),
  },
  {
    id: "c4",
    nombre: "Navidad Hipotecaria 2024",
    tipo: "EMAIL",
    estado: "PROGRAMADA",
    descripcion: "Campaña navideña con tasas preferenciales y beneficios exclusivos",
    fechaInicio: new Date(2026, 6, 19),
    fechaFin: new Date(2026, 7, 18),
    presupuesto: 3000000,
    gastado: 0,
    audiencia: 8000,
    enviados: 0,
    abiertos: 0,
    clics: 0,
    conversiones: 0,
    ingresos: 0,
    roi: 0,
    segmento: "Base completa de leads",
    plantilla: "Oferta Navideña",
    creador: "Valentina Torres",
    creadoEn: new Date(2026, 6, 2),
  },
  {
    id: "c5",
    nombre: "Seguimiento Post Aprobación",
    tipo: "EMAIL",
    estado: "PAUSADA",
    descripcion: "Nurturing para leads que están en evaluación bancaria",
    fechaInicio: new Date(2026, 5, 14),
    fechaFin: new Date(2026, 5, 29),
    presupuesto: 800000,
    gastado: 650000,
    audiencia: 1500,
    enviados: 1200,
    abiertos: 840,
    clics: 252,
    conversiones: 38,
    ingresos: 2850000000,
    roi: 340,
    segmento: "Leads en evaluación bancaria",
    plantilla: "Seguimiento Crediticio",
    creador: "Javier Morales",
    creadoEn: new Date(2026, 5, 9),
  },
  {
    id: "c6",
    nombre: "Lanzamiento App Móvil",
    tipo: "SMS",
    estado: "FINALIZADA",
    descripcion: "Promoción de descarga de la nueva aplicación móvil",
    fechaInicio: new Date(2026, 4, 20),
    fechaFin: new Date(2026, 5, 19),
    presupuesto: 500000,
    gastado: 480000,
    audiencia: 10000,
    enviados: 9500,
    abiertos: 5700,
    clics: 1900,
    conversiones: 190,
    ingresos: 950000000,
    roi: 98,
    segmento: "Todos los leads activos",
    plantilla: "Descarga App",
    creador: "Andrés Pérez",
    creadoEn: new Date(2026, 4, 15),
  },
];

// Estadísticas generales
const STATS_GLOBALES = {
  totalCampanas: 6,
  activas: 2,
  programadas: 1,
  pausadas: 1,
  finalizadas: 2,
  presupuestoTotal: 13300000,
  gastadoTotal: 6930000,
  ingresosTotales: 21500000000,
  roiGeneral: 208,
  totalEnviados: 18900,
  totalAbiertos: 11420,
  totalClics: 3612,
  totalConversiones: 360,
};

// Datos para gráficos
const RENDIMIENTO_MENSUAL = [
  { mes: "Jul", enviados: 12000, abiertos: 7200, clics: 2400 },
  { mes: "Ago", enviados: 15000, abiertos: 9000, clics: 3000 },
  { mes: "Sep", enviados: 18000, abiertos: 10800, clics: 3600 },
  { mes: "Oct", enviados: 22000, abiertos: 13200, clics: 4400 },
  { mes: "Nov", enviados: 25000, abiertos: 15000, clics: 5000 },
  { mes: "Dic", enviados: 18900, abiertos: 11420, clics: 3612 },
];

const TOP_SEGMENTOS = [
  { nombre: "Leads fríos", leads: 4500, conversion: 8.5, color: "#3B82F6" },
  { nombre: "Clientes existentes", leads: 2800, conversion: 12.3, color: "#10B981" },
  { nombre: "Referidos", leads: 1200, conversion: 15.8, color: "#8B5CF6" },
  { nombre: "Sin contacto 90+ días", leads: 3200, conversion: 6.2, color: "#F59E0B" },
];

type TabCampana = "todas" | "activas" | "programadas" | "finalizadas";

export default function CampanasPage() {
  const [tabActiva, setTabActiva] = useState<TabCampana>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalle, setModalDetalle] = useState<string | null>(null);
  const [ordenarPor, setOrdenarPor] = useState("recientes");
  const ahoraRef = useRef(Date.now());
  const ahora = ahoraRef.current;

  const campanasFiltradas = useMemo(() => {
    return CAMPANAS_MOCK.filter((c) => {
      const coincideTab =
        tabActiva === "todas" ||
        (tabActiva === "activas" && c.estado === "ACTIVA") ||
        (tabActiva === "programadas" && c.estado === "PROGRAMADA") ||
        (tabActiva === "finalizadas" && (c.estado === "FINALIZADA" || c.estado === "PAUSADA"));
      const coincideBusqueda =
        !busqueda ||
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      const coincideTipo = filtroTipo === "todos" || c.tipo === filtroTipo;
      return coincideTab && coincideBusqueda && coincideTipo;
    }).sort((a, b) => {
      if (ordenarPor === "recientes") return b.creadoEn.getTime() - a.creadoEn.getTime();
      if (ordenarPor === "presupuesto") return b.presupuesto - a.presupuesto;
      if (ordenarPor === "roi") return b.roi - a.roi;
      if (ordenarPor === "conversiones") return b.conversiones - a.conversiones;
      return 0;
    });
  }, [tabActiva, busqueda, filtroTipo, ordenarPor]);

  const campanaDetalle = CAMPANAS_MOCK.find((c) => c.id === modalDetalle);

  const estadoConfig: Record<string, { label: string; color: string; bg: string; icono: React.ReactNode }> = {
    ACTIVA: { label: "Activa", color: "text-emerald-600", bg: "bg-emerald-50", icono: <Play size={12} /> },
    PROGRAMADA: { label: "Programada", color: "text-blue-600", bg: "bg-blue-50", icono: <Clock size={12} /> },
    PAUSADA: { label: "Pausada", color: "text-amber-600", bg: "bg-amber-50", icono: <Pause size={12} /> },
    FINALIZADA: { label: "Finalizada", color: "text-slate-600", bg: "bg-slate-100", icono: <CheckCircle size={12} /> },
  };

  const tipoConfig: Record<string, { label: string; color: string; bg: string; icono: React.ReactNode }> = {
    EMAIL: { label: "Email", color: "text-blue-600", bg: "bg-blue-50", icono: <Mail size={14} /> },
    WHATSAPP: { label: "WhatsApp", color: "text-green-600", bg: "bg-green-50", icono: <MessageSquare size={14} /> },
    SMS: { label: "SMS", color: "text-purple-600", bg: "bg-purple-50", icono: <Smartphone size={14} /> },
    REFERIDO: { label: "Referido", color: "text-amber-600", bg: "bg-amber-50", icono: <Users size={14} /> },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-red-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Campañas de Marketing
            </h1>
            <p className="text-pink-200 text-[11px] font-medium">
              Gestiona y mide el rendimiento de tus campañas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{STATS_GLOBALES.totalCampanas}</div>
              <div className="text-[10px] text-pink-200">Total</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-300">{STATS_GLOBALES.activas}</div>
              <div className="text-[10px] text-pink-200">Activas</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-300">{STATS_GLOBALES.roiGeneral}%</div>
              <div className="text-[10px] text-pink-200">ROI</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Send size={18} className="text-blue-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Enviados</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{STATS_GLOBALES.totalEnviados.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">mensajes totales</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Eye size={18} className="text-emerald-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Tasa Apertura</span>
          </div>
          <div className="text-xl font-bold text-emerald-600">
            {Math.round((STATS_GLOBALES.totalAbiertos / STATS_GLOBALES.totalEnviados) * 100)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{STATS_GLOBALES.totalAbiertos.toLocaleString()} aperturas</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <MousePointerClick size={18} className="text-purple-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Tasa Clics</span>
          </div>
          <div className="text-xl font-bold text-purple-600">
            {Math.round((STATS_GLOBALES.totalClics / STATS_GLOBALES.totalAbiertos) * 100)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{STATS_GLOBALES.totalClics.toLocaleString()} clics</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Target size={18} className="text-amber-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Conversiones</span>
          </div>
          <div className="text-xl font-bold text-amber-600">{STATS_GLOBALES.totalConversiones}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            {formatoMonedaAbreviado(STATS_GLOBALES.ingresosTotales)} ingresos
          </div>
        </div>
      </div>

      {/* Presupuesto */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-500" />
            Presupuesto General
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">
            {formatoMoneda(STATS_GLOBALES.gastadoTotal)} / {formatoMoneda(STATS_GLOBALES.presupuestoTotal)}
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
            style={{ width: `${(STATS_GLOBALES.gastadoTotal / STATS_GLOBALES.presupuestoTotal) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{Math.round((STATS_GLOBALES.gastadoTotal / STATS_GLOBALES.presupuestoTotal) * 100)}% utilizado</span>
          <span>{formatoMoneda(STATS_GLOBALES.presupuestoTotal - STATS_GLOBALES.gastadoTotal)} restante</span>
        </div>
      </div>

      {/* Filtros y Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {[
              { id: "todas", label: "Todas", count: STATS_GLOBALES.totalCampanas },
              { id: "activas", label: "Activas", count: STATS_GLOBALES.activas },
              { id: "programadas", label: "Programadas", count: STATS_GLOBALES.programadas },
              { id: "finalizadas", label: "Finalizadas", count: STATS_GLOBALES.finalizadas + STATS_GLOBALES.pausadas },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id as TabCampana)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                  tabActiva === tab.id
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
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
                placeholder="Buscar campaña..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-48 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400 transition-all"
              />
            </div>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400"
            >
              <option value="todos">Todos los tipos</option>
              <option value="EMAIL">Email</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="SMS">SMS</option>
              <option value="REFERIDO">Referido</option>
            </select>
            <button
              onClick={() => setModalCrear(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white rounded-xl text-[11px] font-semibold hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20"
            >
              <Plus size={14} /> Nueva Campaña
            </button>
          </div>
        </div>
      </div>

      {/* Lista de campañas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {campanasFiltradas.map((campana) => {
          const configEstado = estadoConfig[campana.estado];
          const configTipo = tipoConfig[campana.tipo];
          const porcentajeAvance =
            campana.fechaInicio && campana.fechaFin
              ? Math.min(
                  100,
                  Math.max(
                    0,
                    ((ahora - campana.fechaInicio.getTime()) /
                      (campana.fechaFin.getTime() - campana.fechaInicio.getTime())) *
                      100
                  )
                )
              : 0;
          const tasaApertura =
            campana.enviados > 0
              ? Math.round((campana.abiertos / campana.enviados) * 100)
              : 0;
          const tasaClics =
            campana.abiertos > 0
              ? Math.round((campana.clics / campana.abiertos) * 100)
              : 0;
          const tasaConversion =
            campana.clics > 0
              ? Math.round((campana.conversiones / campana.clics) * 100)
              : 0;

          return (
            <div
              key={campana.id}
              className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setModalDetalle(campana.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${configTipo.bg}`}
                  >
                    <span className={configTipo.color}>{configTipo.icono}</span>
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-800">{campana.nombre}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${configTipo.bg} ${configTipo.color}`}
                      >
                        {configTipo.label}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${configEstado.bg} ${configEstado.color} flex items-center gap-1`}
                      >
                        {configEstado.icono} {configEstado.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-700">
                    {formatoMonedaAbreviado(campana.presupuesto)}
                  </div>
                  <div className="text-[11px] text-slate-400">presupuesto</div>
                </div>
              </div>

              {/* Descripción */}
              <p className="text-[10px] text-slate-400 mb-4 line-clamp-2">
                {campana.descripcion}
              </p>

              {/* Barra de progreso */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-400">Progreso</span>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {Math.round(porcentajeAvance)}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all"
                    style={{ width: `${porcentajeAvance}%` }}
                  />
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-[13px] font-bold text-slate-800">
                    {campana.enviados.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400">Enviados</div>
                </div>
                <div className="text-center">
                  <div className="text-[13px] font-bold text-emerald-600">{tasaApertura}%</div>
                  <div className="text-[11px] text-slate-400">Apertura</div>
                </div>
                <div className="text-center">
                  <div className="text-[13px] font-bold text-blue-600">{tasaClics}%</div>
                  <div className="text-[11px] text-slate-400">Clics</div>
                </div>
                <div className="text-center">
                  <div className="text-[13px] font-bold text-amber-600">{campana.conversiones}</div>
                  <div className="text-[11px] text-slate-400">Conversiones</div>
                </div>
              </div>

              {/* ROI */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">ROI:</span>
                  <span
                    className={`text-[11px] font-bold ${
                      campana.roi > 0 ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {campana.roi > 0 ? `${campana.roi}%` : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <Eye size={12} className="text-slate-400" />
                  </button>
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <Edit size={12} className="text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Detalle Campaña */}
      {campanaDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-pink-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${tipoConfig[campanaDetalle.tipo]?.bg}`}
                  >
                    <span className={tipoConfig[campanaDetalle.tipo]?.color}>
                      {tipoConfig[campanaDetalle.tipo]?.icono}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{campanaDetalle.nombre}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{campanaDetalle.descripcion}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tipoConfig[campanaDetalle.tipo]?.bg} ${tipoConfig[campanaDetalle.tipo]?.color}`}
                      >
                        {tipoConfig[campanaDetalle.tipo]?.label}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${estadoConfig[campanaDetalle.estado]?.bg} ${estadoConfig[campanaDetalle.estado]?.color}`}
                      >
                        {estadoConfig[campanaDetalle.estado]?.label}
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

            {/* Métricas principales */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-[10px] text-blue-500 font-medium mb-1">Enviados</div>
                  <div className="text-xl font-bold text-blue-700">
                    {campanaDetalle.enviados.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-blue-400">
                    de {campanaDetalle.audiencia.toLocaleString()}
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="text-[10px] text-emerald-500 font-medium mb-1">Aperturas</div>
                  <div className="text-xl font-bold text-emerald-700">
                    {campanaDetalle.abiertos.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    {Math.round((campanaDetalle.abiertos / campanaDetalle.enviados) * 100)}% tasa
                  </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="text-[10px] text-purple-500 font-medium mb-1">Clics</div>
                  <div className="text-xl font-bold text-purple-700">
                    {campanaDetalle.clics.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-purple-400">
                    {Math.round((campanaDetalle.clics / campanaDetalle.abiertos) * 100)}% tasa
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="text-[10px] text-amber-500 font-medium mb-1">Conversiones</div>
                  <div className="text-xl font-bold text-amber-700">
                    {campanaDetalle.conversiones}
                  </div>
                  <div className="text-[10px] text-amber-400">
                    {Math.round((campanaDetalle.conversiones / campanaDetalle.clics) * 100)}% tasa
                  </div>
                </div>
              </div>

              {/* ROI y Presupuesto */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-5 border border-emerald-100/50">
                  <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mb-2">
                    Retorno de Inversión
                  </div>
                  <div className="text-3xl font-bold text-emerald-700">{campanaDetalle.roi}%</div>
                  <div className="text-[11px] text-emerald-600 mt-1">
                    {formatoMoneda(campanaDetalle.ingresos)} generados
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-100/50">
                  <div className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-2">
                    Presupuesto
                  </div>
                  <div className="text-3xl font-bold text-blue-700">
                    {formatoMonedaAbreviado(campanaDetalle.gastado)}
                  </div>
                  <div className="text-[11px] text-blue-600 mt-1">
                    de {formatoMoneda(campanaDetalle.presupuesto)}
                  </div>
                  <div className="h-2 bg-blue-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${(campanaDetalle.gastado / campanaDetalle.presupuesto) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Info adicional */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Calendar size={12} className="text-slate-400" />
                    <span className="text-slate-500">Período:</span>
                    <span className="font-semibold text-slate-700">
                      {campanaDetalle.fechaInicio.toLocaleDateString("es-CL")} -{" "}
                      {campanaDetalle.fechaFin.toLocaleDateString("es-CL")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <Users size={12} className="text-slate-400" />
                    <span className="text-slate-500">Segmento:</span>
                    <span className="font-semibold text-slate-700">{campanaDetalle.segmento}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <User size={12} className="text-slate-400" />
                    <span className="text-slate-500">Creado por:</span>
                    <span className="font-semibold text-slate-700">{campanaDetalle.creador}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px]">
                    <FileText size={12} className="text-slate-400" />
                    <span className="text-slate-500">Plantilla:</span>
                    <span className="font-semibold text-slate-700">{campanaDetalle.plantilla}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <Target size={12} className="text-slate-400" />
                    <span className="text-slate-500">Audiencia:</span>
                    <span className="font-semibold text-slate-700">
                      {campanaDetalle.audiencia.toLocaleString()} contactos
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-slate-500">Creado:</span>
                    <span className="font-semibold text-slate-700">
                      {campanaDetalle.creadoEn.toLocaleDateString("es-CL")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setModalDetalle(null)}
                className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cerrar
              </button>
              {campanaDetalle.estado === "PROGRAMADA" && (
                <button className="px-4 py-2 bg-emerald-500 text-white text-[11px] font-semibold rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-1.5">
                  <Play size={14} /> Iniciar Campaña
                </button>
              )}
              {campanaDetalle.estado === "ACTIVA" && (
                <button className="px-4 py-2 bg-amber-500 text-white text-[11px] font-semibold rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-1.5">
                  <Pause size={14} /> Pausar
                </button>
              )}
              <button className="px-4 py-2 bg-rose-500 text-white text-[11px] font-semibold rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-1.5">
                <Download size={14} /> Exportar Reporte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Campaña */}
      {modalCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Nueva Campaña</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Configura los detalles de tu campaña de marketing
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
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Nombre de la Campaña *</label>
                <input
                  type="text"
                  placeholder="Ej: Oferta Especial Verano 2025"
                  className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Descripción</label>
                <textarea
                  placeholder="Describe el objetivo de la campaña..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400 resize-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Tipo de Campaña</label>
                  <select className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400">
                    <option value="EMAIL">Email Marketing</option>
                    <option value="WHATSAPP">WhatsApp Business</option>
                    <option value="SMS">SMS</option>
                    <option value="REFERIDO">Programa de Referidos</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Presupuesto</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Fecha Inicio</label>
                  <input
                    type="date"
                    className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Fecha Fin</label>
                  <input
                    type="date"
                    className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Segmento Objetivo</label>
                <input
                  type="text"
                  placeholder="Ej: Leads fríos, Clientes existentes..."
                  className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400 transition-all"
                />
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
                className="px-5 py-2 bg-rose-500 text-white text-[11px] font-semibold rounded-xl hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20"
              >
                Crear Campaña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icono X faltante
function X({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
