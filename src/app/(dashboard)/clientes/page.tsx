"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Download,
  Eye,
  Phone,
  Mail,
  MessageSquare,
  Building2,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Home,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  LayoutGrid,
  List,
  UserCheck,
  FileText,
  Activity,
  Target,
  ArrowUpRight,
  Star,
} from "lucide-react";
import { ETAPAS_CONFIG, ORIGEN_LABELS } from "@/tipos";
import { formatoMoneda, formatoMonedaAbreviado, formatoUF } from "@/lib/utils";
import { useLeads } from "@/lib/contexts/LeadContext";
import { FormularioLead } from "@/componentes/leads/FormularioLead";
import { toast } from "sonner";
import type { Lead } from "@/tipos";

const prioridadConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  BAJA: { label: "Baja", color: "text-slate-600", bg: "bg-slate-100", dot: "bg-slate-400" },
  MEDIA: { label: "Media", color: "text-blue-600", bg: "bg-blue-50 border border-blue-100", dot: "bg-blue-500" },
  ALTA: { label: "Alta", color: "text-orange-600", bg: "bg-orange-50 border border-orange-100", dot: "bg-orange-500" },
  URGENTE: { label: "Urgente", color: "text-red-600", bg: "bg-red-50 border border-red-100", dot: "bg-red-500" },
};

const ETAPAS_FILTRO = [
  { value: "todos", label: "Todos", color: "#64748B" },
  { value: "NUEVO_LEAD", label: "Nuevos", color: "#3B82F6" },
  { value: "CONTACTADO", label: "Contactados", color: "#8B5CF6" },
  { value: "CALIFICACION_COMERCIAL", label: "Calificación", color: "#D946EF" },
  { value: "EVALUACION_BANCARIA", label: "Evaluación", color: "#06B6D4" },
  { value: "APROBADO", label: "Aprobados", color: "#10B981" },
  { value: "CREDITO_PAGADO", label: "Finalizados", color: "#22C55E" },
];

export default function ClientesPage() {
  const router = useRouter();
  const { leads, agregarLead } = useLeads();
  const [busqueda, setBusqueda] = useState("");
  const [formularioOpen, setFormularioOpen] = useState(false);
  const [filtroEtapa, setFiltroEtapa] = useState("todos");
  const [vistaActiva, setVistaActiva] = useState<"grid" | "lista">("grid");
  const [ordenarPor, setOrdenarPor] = useState("recientes");

  const clientes = leads;

  const clientesFiltrados = useMemo(() => {
    return clientes
      .filter((lead) => {
        const coincideBusqueda = !busqueda ||
          lead.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          lead.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
          lead.rut.includes(busqueda) ||
          lead.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
          lead.banco?.toLowerCase().includes(busqueda.toLowerCase());
        const coincideEtapa = filtroEtapa === "todos" || lead.etapa === filtroEtapa;
        return coincideBusqueda && coincideEtapa;
      })
      .sort((a, b) => {
        if (ordenarPor === "recientes") return b.creadoEn.getTime() - a.creadoEn.getTime();
        if (ordenarPor === "nombre") return a.nombre.localeCompare(b.nombre);
        if (ordenarPor === "monto") return (b.montoSolicitado || 0) - (a.montoSolicitado || 0);
        if (ordenarPor === "prioridad") {
          const prioridadOrden = { URGENTE: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };
          return (prioridadOrden[a.prioridad as keyof typeof prioridadOrden] || 4) - (prioridadOrden[b.prioridad as keyof typeof prioridadOrden] || 4);
        }
        return 0;
      });
  }, [clientes, busqueda, filtroEtapa, ordenarPor]);

  const stats = useMemo(() => ({
    total: clientesFiltrados.length,
    montoTotal: clientesFiltrados.reduce((acc, l) => acc + (l.montoSolicitado || 0), 0),
    valorPropiedad: clientesFiltrados.reduce((acc, l) => acc + (l.valorPropiedad || 0), 0),
    aprobados: clientesFiltrados.filter((l) => ["APROBADO", "FIRMA_DIGITAL", "NOTARIA"].includes(l.etapa)).length,
    finalizados: clientesFiltrados.filter((l) => ["CREDITO_PAGADO", "CLIENTE_FINALIZADO"].includes(l.etapa)).length,
    nuevosHoy: clientesFiltrados.filter((l) => l.diasEnEtapa === 0).length,
    urgentes: clientesFiltrados.filter((l) => l.prioridad === "URGENTE").length,
  }), [clientesFiltrados]);

  const handleSubmitCliente = (data: Partial<Lead>) => {
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
    setFormularioOpen(false);
    toast.success("Cliente agregado", {
      description: `${newLead.nombre} ${newLead.apellido} fue registrado`,
    });
  };

  return (
    <div className="space-y-5">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Gestión de Clientes
            </h1>
            <p className="text-blue-200 text-[11px] font-medium">
              Administra y da seguimiento a todos tus clientes
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-[10px] text-blue-200">Total</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-300">{stats.aprobados}</div>
              <div className="text-[10px] text-blue-200">Aprobados</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-300">{formatoMonedaAbreviado(stats.montoTotal)}</div>
              <div className="text-[10px] text-blue-200">En créditos</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users size={18} className="text-blue-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Total Clientes</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-1">{stats.nuevosHoy} nuevos hoy</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign size={18} className="text-blue-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Monto Total</span>
          </div>
          <div className="text-xl font-bold text-blue-600">{formatoMonedaAbreviado(stats.montoTotal)}</div>
          <div className="text-[10px] text-slate-400 mt-1">en créditos solicitados</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Aprobados</span>
          </div>
          <div className="text-xl font-bold text-emerald-600">{stats.aprobados}</div>
          <div className="text-[10px] text-slate-400 mt-1">créditos aprobados</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Urgentes</span>
          </div>
          <div className="text-xl font-bold text-red-600">{stats.urgentes}</div>
          <div className="text-[10px] text-slate-400 mt-1">requieren atención</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto overflow-x-auto">
            <div className="relative flex-1 max-w-md min-w-0">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, RUT, email o banco..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
              />
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              {ETAPAS_FILTRO.map((etapa) => (
                <button
                  key={etapa.value}
                  onClick={() => setFiltroEtapa(etapa.value)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-semibold transition-all ${
                    filtroEtapa === etapa.value
                      ? "text-white shadow-md"
                      : "bg-white border border-slate-200/60 text-slate-500 hover:bg-slate-50"
                  }`}
                  style={filtroEtapa === etapa.value ? { backgroundColor: etapa.color } : {}}
                >
                  {etapa.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200/60 rounded-xl text-[10px] text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
            >
              <option value="recientes">Más recientes</option>
              <option value="nombre">Nombre A-Z</option>
              <option value="monto">Mayor monto</option>
              <option value="prioridad">Prioridad</option>
            </select>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setVistaActiva("grid")}
                className={`p-2 rounded-md transition-colors ${vistaActiva === "grid" ? "bg-white shadow-sm" : ""}`}
              >
                <LayoutGrid size={14} className={vistaActiva === "grid" ? "text-slate-700" : "text-slate-400"} />
              </button>
              <button
                onClick={() => setVistaActiva("lista")}
                className={`p-2 rounded-md transition-colors ${vistaActiva === "lista" ? "bg-white shadow-sm" : ""}`}
              >
                <List size={14} className={vistaActiva === "lista" ? "text-slate-700" : "text-slate-400"} />
              </button>
            </div>
            <button
              onClick={() => setFormularioOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
            >
              <Plus size={14} /> Nuevo Cliente
            </button>
          </div>
        </div>
      </div>

      {/* Vista Grid */}
      {vistaActiva === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {clientesFiltrados.map((cliente) => {
            const config = ETAPAS_CONFIG[cliente.etapa];
            const prioridad = prioridadConfig[cliente.prioridad] || prioridadConfig.MEDIA;
            return (
              <div
                key={cliente.id}
                onClick={() => router.push(`/clientes/${cliente.id}`)}
                className="bg-white rounded-2xl border border-slate-100/80 p-4 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shadow-sm">
                        {cliente.nombre[0]}{cliente.apellido[0]}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${prioridad.dot}`} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-slate-800">{cliente.nombre} {cliente.apellido}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{cliente.rut}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                    <span className="text-[11px] font-semibold" style={{ color: config.color }}>{config.label}</span>
                  </div>
                </div>

                {/* Info financiera */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Monto Crédito</div>
                      <div className="text-[15px] font-bold text-slate-900">{formatoMoneda(cliente.montoSolicitado || 0)}</div>
                      <div className="text-[10px] text-blue-600 font-medium">{formatoUF(cliente.montoSolicitado || 0)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Banco</div>
                      <div className="text-[11px] font-bold text-slate-700">{cliente.banco || "-"}</div>
                      <div className="text-[11px] text-slate-400">{cliente.tipoCredito || "-"}</div>
                    </div>
                  </div>
                </div>

                {/* Contacto */}
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Phone size={9} className="text-slate-400" />
                    <span>{cliente.telefono || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <Mail size={9} className="text-slate-400" />
                    <span className="truncate">{cliente.email || "-"}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-md flex items-center justify-center text-[7px] font-bold text-white">
                      {cliente.nombreEjecutivo?.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span className="text-[10px] text-slate-600 font-medium">{cliente.nombreEjecutivo?.split(" ")[0] || "Sin asignar"}</span>
                  </div>
                  <ChevronRight size={14} className="text-blue-500" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista Lista */}
      {vistaActiva === "lista" && (
        <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-soft overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etapa</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monto</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Banco</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ejecutivo</th>
                <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioridad</th>
                <th className="text-right px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clientesFiltrados.map((cliente) => {
                const config = ETAPAS_CONFIG[cliente.etapa];
                const prioridad = prioridadConfig[cliente.prioridad] || prioridadConfig.MEDIA;
                return (
                  <tr
                    key={cliente.id}
                    className="hover:bg-blue-50/20 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/clientes/${cliente.id}`)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white text-[11px] font-bold">
                          {cliente.nombre[0]}{cliente.apellido[0]}
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-slate-800">{cliente.nombre} {cliente.apellido}</div>
                          <div className="text-[10px] text-slate-400">{cliente.rut}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                        <span className="text-[10px] font-semibold" style={{ color: config.color }}>{config.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[12px] font-bold text-slate-700">{formatoMoneda(cliente.montoSolicitado || 0)}</div>
                      <div className="text-[11px] text-blue-500">{formatoUF(cliente.montoSolicitado || 0)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] text-slate-600 font-medium">{cliente.banco || "-"}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-gradient-to-br from-slate-400 to-slate-500 rounded-md flex items-center justify-center text-[7px] font-bold text-white">
                          {cliente.nombreEjecutivo?.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-[10px] text-slate-600">{cliente.nombreEjecutivo?.split(" ")[0] || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${prioridad.bg} ${prioridad.color}`}>
                        {prioridad.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ChevronRight size={14} className="text-blue-500 inline" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulario */}
      <FormularioLead
        open={formularioOpen}
        onOpenChange={setFormularioOpen}
        onSubmit={handleSubmitCliente}
      />
    </div>
  );
}
