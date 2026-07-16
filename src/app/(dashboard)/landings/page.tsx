"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Globe,
  Plus,
  Search,
  Edit,
  Eye,
  Copy,
  ExternalLink,
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  AlertTriangle,
  Layout,
  Link,
  Copy as CopyIcon,
  Calendar,
  Zap,
} from "lucide-react";

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CONVERSION: { label: "Conversión", color: "text-blue-600", bg: "bg-blue-50" },
  REFINANCIAMIENTO: { label: "Refinanciamiento", color: "text-purple-600", bg: "bg-purple-50" },
  PROMOCION: { label: "Promoción", color: "text-red-600", bg: "bg-red-50" },
  REFERIDOS: { label: "Referidos", color: "text-emerald-600", bg: "bg-emerald-50" },
  HERRAMIENTA: { label: "Herramienta", color: "text-cyan-600", bg: "bg-cyan-50" },
};

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVA: { label: "Activa", color: "text-emerald-600", bg: "bg-emerald-50" },
  BORRADOR: { label: "Borrador", color: "text-amber-600", bg: "bg-amber-50" },
  FINALIZADA: { label: "Finalizada", color: "text-slate-600", bg: "bg-slate-100" },
  PAUSADA: { label: "Pausada", color: "text-red-600", bg: "bg-red-50" },
};

type TabLanding = "todas" | "activas" | "borradores" | "finalizadas";

export default function LandingsPage() {
  const [landings, setLandings] = useState<any[]>([]);
  const [tabActiva, setTabActiva] = useState<TabLanding>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState<string | null>(null);
  const [modalDetalle, setModalDetalle] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/landings");
        const json = await res.json();
        if (json.success && json.data) setLandings(json.data);
      } catch { setLandings([]); }
      finally { /* loaded */ }
    }
    cargar();
  }, []);

  const landingsFiltradas = useMemo(() => {
    return landings.filter((lp) => {
      const coincideTab =
        tabActiva === "todas" ||
        (tabActiva === "activas" && lp.estado === "ACTIVA") ||
        (tabActiva === "borradores" && lp.estado === "BORRADOR") ||
        (tabActiva === "finalizadas" && lp.estado === "FINALIZADA");
      const coincideBusqueda =
        !busqueda ||
        lp.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        lp.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      return coincideTab && coincideBusqueda;
    });
  }, [tabActiva, busqueda, landings]);

  const landingEditar = landings.find((lp) => lp.id === modalEditar);
  const landingDetalle = landings.find((lp) => lp.id === modalDetalle);

  const stats = useMemo(() => ({
    total: landings.length,
    activas: landings.filter((lp) => lp.estado === "ACTIVA").length,
    borradores: landings.filter((lp) => lp.estado === "BORRADOR").length,
    finalizadas: landings.filter((lp) => lp.estado === "FINALIZADA").length,
    visitas: landings.reduce((sum: number, lp: any) => sum + (lp.visits || 0), 0),
    leads: landings.reduce((sum: number, lp: any) => sum + (lp.leads || 0), 0),
    conversion: landings.filter((lp: any) => (lp.visits || 0) > 0).length > 0
      ? Math.round((landings.reduce((sum: number, lp: any) => sum + (lp.leads || 0), 0) / landings.reduce((sum: number, lp: any) => sum + (lp.visits || 0), 0)) * 100 * 10) / 10
      : 0,
  }), [landings]);

  const landingTop = landings.length > 0 ? landings.reduce((prev: any, curr: any) =>
    (curr.leads || 0) > (prev.leads || 0) ? curr : prev
  ) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Landing Pages
            </h1>
            <p className="text-cyan-200 text-[11px] font-medium">
              Creación y gestión de landing pages para captación de leads
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-[10px] text-cyan-200">Total</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-300">{stats.activas}</div>
              <div className="text-[10px] text-cyan-200">Activas</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-300">{stats.leads.toLocaleString()}</div>
              <div className="text-[10px] text-cyan-200">Leads</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <Globe size={18} className="text-cyan-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Visitas</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.visitas.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-blue-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Leads</span>
          </div>
          <div className="text-xl font-bold text-blue-600">{stats.leads.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Target size={18} className="text-emerald-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Conversión</span>
          </div>
          <div className="text-xl font-bold text-emerald-600">{stats.conversion}%</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={18} className="text-purple-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Mejor Landing</span>
          </div>
          <div className="text-[13px] font-bold text-purple-600 truncate">{landingTop?.nombre || "-"}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-amber-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Activas</span>
          </div>
          <div className="text-xl font-bold text-amber-600">{stats.activas}</div>
        </div>
      </div>

      {/* Filtros y Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {[
              { id: "todas", label: "Todas", count: stats.total },
              { id: "activas", label: "Activas", count: stats.activas },
              { id: "borradores", label: "Borradores", count: stats.borradores },
              { id: "finalizadas", label: "Finalizadas", count: stats.finalizadas },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id as TabLanding)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                  tabActiva === tab.id
                    ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
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
                placeholder="Buscar landing..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-48 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-400 transition-all"
              />
            </div>
            <button
              onClick={() => setModalCrear(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 text-white rounded-xl text-[11px] font-semibold hover:bg-cyan-600 transition-colors shadow-md shadow-cyan-500/20"
            >
              <Plus size={14} /> Nueva Landing
            </button>
          </div>
        </div>
      </div>

      {/* Lista de landings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {landingsFiltradas.map((landing) => {
          const configTipo = TIPO_CONFIG[landing.tipo];
          const configEstado = ESTADO_CONFIG[landing.estado];

          return (
            <div
              key={landing.id}
              className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft hover:shadow-md transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${landing.color}15` }}
                  >
                    <Globe size={20} style={{ color: landing.color }} />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-800">{landing.nombre}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${configTipo?.bg} ${configTipo?.color}`}>
                        {configTipo?.label}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${configEstado?.bg} ${configEstado?.color}`}>
                        {configEstado?.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* URL */}
              <div className="flex items-center gap-2 mb-3 p-2 bg-slate-50 rounded-lg">
                <Link size={10} className="text-slate-400" />
                <span className="text-[11px] text-slate-500 truncate flex-1">{landing.url}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(landing.url)}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                  title="Copiar URL"
                >
                  <CopyIcon size={10} className="text-slate-400" />
                </button>
                <a href={landing.url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-slate-200 rounded transition-colors">
                  <ExternalLink size={10} className="text-slate-400" />
                </a>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-cyan-50 rounded-lg p-2 text-center">
                  <div className="text-[13px] font-bold text-cyan-700">{landing.visits.toLocaleString()}</div>
                  <div className="text-[11px] text-cyan-500">Visitas</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <div className="text-[13px] font-bold text-blue-700">{landing.leads.toLocaleString()}</div>
                  <div className="text-[11px] text-blue-500">Leads</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2 text-center">
                  <div className="text-[13px] font-bold text-emerald-700">{landing.conversion}%</div>
                  <div className="text-[11px] text-emerald-500">Conversión</div>
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {landing.formulario && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-600">
                    📝 Formulario
                  </span>
                )}
                {landing.whatsapp && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-green-100 text-green-600">
                    💬 WhatsApp
                  </span>
                )}
                {landing.chatbot && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-600">
                    🤖 Chatbot
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-400">
                  {landing.ultimoInicio
                    ? `Último: ${landing.ultimoInicio.toLocaleDateString("es-CL")}`
                    : "Sin visitas"}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setModalDetalle(landing.id)}
                    className="p-1.5 hover:bg-cyan-50 rounded-lg transition-colors"
                    title="Ver detalles"
                  >
                    <Eye size={12} className="text-cyan-500" />
                  </button>
                  <button
                    onClick={() => setModalEditar(landing.id)}
                    className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit size={12} className="text-emerald-500" />
                  </button>
                  <button
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Duplicar"
                  >
                    <Copy size={12} className="text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Detalle */}
      {landingDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${landingDetalle.color}15` }}
                  >
                    <Globe size={20} style={{ color: landingDetalle.color }} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{landingDetalle.nombre}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{landingDetalle.descripcion}</p>
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
              {/* Métricas detalladas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-cyan-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-700">{landingDetalle.visits.toLocaleString()}</div>
                  <div className="text-[10px] text-cyan-500">Visitas Totales</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">{landingDetalle.leads.toLocaleString()}</div>
                  <div className="text-[10px] text-blue-500">Leads Captados</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-700">{landingDetalle.conversion}%</div>
                  <div className="text-[10px] text-emerald-500">Tasa Conversión</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-700">{landingDetalle.montoPromedio > 0 ? `$${(landingDetalle.montoPromedio / 1000000).toFixed(0)}M` : "-"}</div>
                  <div className="text-[10px] text-purple-500">Monto Promedio</div>
                </div>
              </div>

              {/* Información */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800">Información</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px]">
                      <Globe size={12} className="text-slate-400" />
                      <span className="text-slate-500">URL:</span>
                      <span className="font-semibold text-slate-700 truncate">{landingDetalle.url}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <Layout size={12} className="text-slate-400" />
                      <span className="text-slate-500">Template:</span>
                      <span className="font-semibold text-slate-700">{landingDetalle.template}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <Calendar size={12} className="text-slate-400" />
                      <span className="text-slate-500">Creado:</span>
                      <span className="font-semibold text-slate-700">{landingDetalle.fechaCreacion.toLocaleDateString("es-CL")}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800">Características</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px]">
                      {landingDetalle.formulario ? <CheckCircle size={12} className="text-emerald-500" /> : <AlertTriangle size={12} className="text-slate-300" />}
                      <span className={landingDetalle.formulario ? "text-slate-700" : "text-slate-400"}>Formulario de captación</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      {landingDetalle.whatsapp ? <CheckCircle size={12} className="text-emerald-500" /> : <AlertTriangle size={12} className="text-slate-300" />}
                      <span className={landingDetalle.whatsapp ? "text-slate-700" : "text-slate-400"}>Botón WhatsApp</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      {landingDetalle.chatbot ? <CheckCircle size={12} className="text-emerald-500" /> : <AlertTriangle size={12} className="text-slate-300" />}
                      <span className={landingDetalle.chatbot ? "text-slate-700" : "text-slate-400"}>Chatbot IA</span>
                    </div>
                  </div>
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
              <a
                href={landingDetalle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-cyan-500 text-white text-[11px] font-semibold rounded-xl hover:bg-cyan-600 transition-colors flex items-center gap-1.5"
              >
                <ExternalLink size={14} /> Ver Landing
              </a>
              <button
                onClick={() => {
                  setModalDetalle(null);
                  setModalEditar(landingDetalle.id);
                }}
                className="px-4 py-2 bg-emerald-500 text-white text-[11px] font-semibold rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
              >
                <Edit size={14} /> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {landingEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                    <Edit size={18} className="text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Editar Landing Page</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Modifica la configuración de tu landing</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalEditar(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <span className="text-slate-400">✕</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Nombre *</label>
                <input
                  type="text"
                  defaultValue={landingEditar.nombre}
                  className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">URL</label>
                <input
                  type="url"
                  defaultValue={landingEditar.url}
                  className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Descripción</label>
                <textarea
                  defaultValue={landingEditar.descripcion}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-400 resize-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Tipo</label>
                  <select
                    defaultValue={landingEditar.tipo}
                    className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-400"
                  >
                    {Object.entries(TIPO_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Estado</label>
                  <select
                    defaultValue={landingEditar.estado}
                    className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-400"
                  >
                    {Object.entries(ESTADO_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-700">Características</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked={landingEditar.formulario} className="w-4 h-4 text-cyan-600 rounded" />
                    <span className="text-[11px] text-slate-600">Formulario</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked={landingEditar.whatsapp} className="w-4 h-4 text-cyan-600 rounded" />
                    <span className="text-[11px] text-slate-600">WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked={landingEditar.chatbot} className="w-4 h-4 text-cyan-600 rounded" />
                    <span className="text-[11px] text-slate-600">Chatbot</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setModalEditar(null)}
                className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setModalEditar(null)}
                className="px-5 py-2 bg-cyan-500 text-white text-[11px] font-semibold rounded-xl hover:bg-cyan-600 transition-colors shadow-md shadow-cyan-500/20"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear */}
      {modalCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                    <Plus size={18} className="text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Nueva Landing Page</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Crea una nueva landing page para captar leads</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalCrear(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <span className="text-slate-400">✕</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Nombre *</label>
                <input
                  type="text"
                  placeholder="Ej: Crédito Hipotecario Express"
                  className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-400 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Descripción</label>
                <textarea
                  placeholder="Describe el objetivo de esta landing page..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-400 resize-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Tipo</label>
                  <select className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-400">
                    {Object.entries(TIPO_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Template</label>
                  <select className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-400">
                    <option value="Modern">Modern</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Minimal">Minimal</option>
                    <option value="Promo">Promocional</option>
                    <option value="Interactive">Interactivo</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-700">Características</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-cyan-600 rounded" />
                    <span className="text-[11px] text-slate-600">Formulario</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-cyan-600 rounded" />
                    <span className="text-[11px] text-slate-600">WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-cyan-600 rounded" />
                    <span className="text-[11px] text-slate-600">Chatbot</span>
                  </label>
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
                className="px-5 py-2 bg-cyan-500 text-white text-[11px] font-semibold rounded-xl hover:bg-cyan-600 transition-colors shadow-md shadow-cyan-500/20"
              >
                Crear Landing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
