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
  Users,
  DollarSign,
  Home,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  LayoutGrid,
  List,
  UserCheck,
  Edit,
  CreditCard,
  Check,
  User,
} from "lucide-react";
import { ETAPAS_CONFIG, ORIGEN_LABELS, SITUACION_LABORAL_CONFIG, RENTAS_MENSUALES } from "@/tipos";
import { formatoMoneda, formatoMonedaAbreviado, formatoUF } from "@/lib/utils";
import { useLeads } from "@/modulos/leads";
import { useUser } from "@/modulos/usuarios";
import { FormularioLead } from "@/componentes/leads/FormularioLead";
import { toast } from "sonner";
import type { Lead, SituacionLaboral } from "@/tipos";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const { leads, agregarLead, actualizarLead } = useLeads();
  const { usuarioActual, esSuperAdmin } = useUser();
  const [busqueda, setBusqueda] = useState("");
  const [formularioOpen, setFormularioOpen] = useState(false);
  const [filtroEtapa, setFiltroEtapa] = useState("todos");
  const [vistaActiva, setVistaActiva] = useState<"grid" | "lista">("grid");
  const [ordenarPor, setOrdenarPor] = useState("recientes");
  const [editarOpen, setEditarOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Lead | null>(null);

  // Leads visibles según rol (consistente con Pipeline y Leads)
  const clientesVisibles = useMemo(() => {
    if (esSuperAdmin) return leads;
    const nombreCompleto = `${usuarioActual.nombre} ${usuarioActual.apellido}`;
    return leads.filter((lead) => {
      if (lead.etapa === "NUEVO_LEAD") return true;
      return lead.nombreEjecutivo === nombreCompleto;
    });
  }, [leads, esSuperAdmin, usuarioActual]);

  const clientesFiltrados = useMemo(() => {
    return clientesVisibles
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
  }, [clientesVisibles, busqueda, filtroEtapa, ordenarPor]);

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
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                      <span className="text-[11px] font-semibold" style={{ color: config.color }}>{config.label}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setClienteSeleccionado(cliente);
                        setEditarOpen(true);
                      }}
                      className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar cliente"
                    >
                      <Edit size={13} className="text-slate-400 hover:text-blue-500" />
                    </button>
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setClienteSeleccionado(cliente);
                            setEditarOpen(true);
                          }}
                          className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar cliente"
                        >
                          <Edit size={13} className="text-slate-400 hover:text-blue-500" />
                        </button>
                        <ChevronRight size={14} className="text-blue-500" />
                      </div>
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

      {/* Modal Editar Cliente */}
      <Dialog open={editarOpen} onOpenChange={setEditarOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Editar Cliente</DialogTitle>
            <DialogDescription>
              {clienteSeleccionado ? `Modifica la información de ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}` : "Modificar información del cliente"}
            </DialogDescription>
          </DialogHeader>
          {clienteSeleccionado && (
            <EditarClienteFormInline
              lead={clienteSeleccionado}
              onClose={() => {
                setEditarOpen(false);
                setClienteSeleccionado(null);
              }}
              actualizarLead={actualizarLead}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditarClienteFormInline({
  lead,
  onClose,
  actualizarLead,
}: {
  lead: Lead;
  onClose: () => void;
  actualizarLead: (id: string, data: Partial<Lead>) => Promise<void>;
}) {
  const [nombre, setNombre] = useState(lead.nombre);
  const [apellido, setApellido] = useState(lead.apellido);
  const [rut, setRut] = useState(lead.rut);
  const [email, setEmail] = useState(lead.email || "");
  const [telefono, setTelefono] = useState(lead.telefono || "");
  const [situacionLaboral, setSituacionLaboral] = useState<SituacionLaboral>(lead.situacionLaboral);
  const [enDicom, setEnDicom] = useState(lead.enDicom);
  const [dicomDetalle, setDicomDetalle] = useState(lead.dicomDetalle || "");
  const [rentaMensual, setRentaMensual] = useState(lead.rentaMensual || "");
  const [complementarRenta, setComplementarRenta] = useState(lead.complementarRenta || false);
  const [tipoCredito, setTipoCredito] = useState(lead.tipoCredito || "");
  const [cuentaPie, setCuentaPie] = useState(lead.cuentaPie || false);
  const [comentarios, setComentarios] = useState(lead.comentarios || "");
  const [montoSolicitado, setMontoSolicitado] = useState(lead.montoSolicitado?.toString() || "");
  const [valorPropiedad, setValorPropiedad] = useState(lead.valorPropiedad?.toString() || "");
  const [pieDisponible, setPieDisponible] = useState(lead.pieDisponible?.toString() || "");
  const [banco, setBanco] = useState(lead.banco || "");
  const [etiqueta, setEtiqueta] = useState(lead.etiquetas || "");
  const [cargasLegales, setCargasLegales] = useState(lead.cargasLegales || "");
  const [estadoCivil, setEstadoCivil] = useState(lead.estadoCivil || "");
  const [regimenMatrimonial, setRegimenMatrimonial] = useState(lead.regimenMatrimonial || "");
  const [fechaNacimiento, setFechaNacimiento] = useState(lead.fechaNacimiento || "");
  const [estudios, setEstudios] = useState(lead.estudios || "");
  const [profesion, setProfesion] = useState(lead.profesion || "");
  const [domicilioParticular, setDomicilioParticular] = useState(lead.domicilioParticular || "");
  const [comunaCiudad, setComunaCiudad] = useState(lead.comunaCiudad || "");
  const [valorArriendo, setValorArriendo] = useState(lead.valorArriendo?.toString() || "");
  const [afp, setAfp] = useState(lead.afp || "");
  const [nombreEmpleador, setNombreEmpleador] = useState(lead.nombreEmpleador || "");
  const [rutEmpresa, setRutEmpresa] = useState(lead.rutEmpresa || "");
  const [fechaIngreso, setFechaIngreso] = useState(lead.fechaIngreso || "");
  const [cargo, setCargo] = useState(lead.cargo || "");
  const [rentaLiquida, setRentaLiquida] = useState(lead.rentaLiquida?.toString() || "");
  const [bancoAbonoRenta, setBancoAbonoRenta] = useState(lead.bancoAbonoRenta || "");
  const [fechaPago, setFechaPago] = useState(lead.fechaPago || "");
  const [direccionLaboral, setDireccionLaboral] = useState(lead.direccionLaboral || "");
  const [comunaCiudadLaboral, setComunaCiudadLaboral] = useState(lead.comunaCiudadLaboral || "");
  const [telefonoLaboralFijo, setTelefonoLaboralFijo] = useState(lead.telefonoLaboralFijo || "");
  const [emailLaboral, setEmailLaboral] = useState(lead.emailLaboral || "");
  const [otrosIngresos, setOtrosIngresos] = useState(lead.otrosIngresos || "");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const bancos = [
    "Banco Estado", "Santander", "Banco de Chile", "Banco BCI",
    "Banco Scotiabank", "Banco Itaú", "Banco Security", "Banco Falabella",
    "Banco Ripley", "Banco Paris", "CorpGroup", "Otros"
  ];

  const tiposCredito = [
    "Créditos Hipotecarios", "Créditos de Consumos", "Fines Generales", "Capital para Empresas"
  ];

  const estadosCiviles = ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Unión Civil"];
  const regimenesMatrimoniales = ["Separación de Bienes", "Sociedad Conyugal", "No aplica"];
  const afps = ["Capital", "Cuprum", "Habitat", "Planvital", "Provida", "Rencoret", "Santa María", "Otros"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      await actualizarLead(lead.id, {
        nombre,
        apellido,
        rut,
        email: email || undefined,
        telefono: telefono || undefined,
        banco: banco || undefined,
        tipoCredito: tipoCredito || undefined,
        montoSolicitado: montoSolicitado ? parseFloat(montoSolicitado) : undefined,
        valorPropiedad: valorPropiedad ? parseFloat(valorPropiedad) : undefined,
        pieDisponible: pieDisponible ? parseFloat(pieDisponible) : undefined,
        etiquetas: etiqueta || undefined,
        notas: comentarios || undefined,
        situacionLaboral,
        enDicom,
        dicomDetalle: dicomDetalle || undefined,
        rentaMensual: rentaMensual || undefined,
        complementarRenta,
        cuentaPie,
        cargasLegales: cargasLegales || undefined,
        estadoCivil: estadoCivil || undefined,
        regimenMatrimonial: regimenMatrimonial || undefined,
        fechaNacimiento: fechaNacimiento || undefined,
        estudios: estudios || undefined,
        profesion: profesion || undefined,
        domicilioParticular: domicilioParticular || undefined,
        comunaCiudad: comunaCiudad || undefined,
        valorArriendo: valorArriendo ? parseFloat(valorArriendo) : undefined,
        afp: afp || undefined,
        nombreEmpleador: nombreEmpleador || undefined,
        rutEmpresa: rutEmpresa || undefined,
        fechaIngreso: fechaIngreso || undefined,
        cargo: cargo || undefined,
        rentaLiquida: rentaLiquida ? parseFloat(rentaLiquida) : undefined,
        bancoAbonoRenta: bancoAbonoRenta || undefined,
        fechaPago: fechaPago || undefined,
        direccionLaboral: direccionLaboral || undefined,
        comunaCiudadLaboral: comunaCiudadLaboral || undefined,
        telefonoLaboralFijo: telefonoLaboralFijo || undefined,
        emailLaboral: emailLaboral || undefined,
        otrosIngresos: otrosIngresos || undefined,
      });

      setGuardando(false);
      setGuardado(true);
      toast.success("Cliente actualizado", {
        description: `${nombre} ${apellido} fue actualizado correctamente`,
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      setGuardando(false);
      toast.error("Error al guardar los datos. Intenta nuevamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
      {/* Sección: Datos Personales */}
      <div>
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <User size={13} className="text-blue-500" />
          Datos Personales
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Nombre *</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Apellido *</label>
            <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">RUT *</label>
            <input type="text" value={rut} onChange={(e) => setRut(e.target.value)} placeholder="12.345.678-9"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Fecha Nacimiento</label>
            <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Estado Civil</label>
            <select value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all">
              <option value="">Seleccionar</option>
              {estadosCiviles.map((ec) => <option key={ec} value={ec}>{ec}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Régimen Matrimonial</label>
            <select value={regimenMatrimonial} onChange={(e) => setRegimenMatrimonial(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all">
              <option value="">Seleccionar</option>
              {regimenesMatrimoniales.map((rm) => <option key={rm} value={rm}>{rm}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Cargas Legales</label>
            <input type="text" value={cargasLegales} onChange={(e) => setCargasLegales(e.target.value)} placeholder="Ej: Caja Compensación"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Estudios</label>
            <input type="text" value={estudios} onChange={(e) => setEstudios(e.target.value)} placeholder="Ej: Universitario"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Profesión</label>
            <input type="text" value={profesion} onChange={(e) => setProfesion(e.target.value)} placeholder="Ej: Ingeniero"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Situación Laboral *</label>
            <select value={situacionLaboral} onChange={(e) => setSituacionLaboral(e.target.value as SituacionLaboral)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all">
              <option value="DEPENDIENTE">Trabajador Dependiente</option>
              <option value="INDEPENDIENTE">Trabajador Independiente</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">AFP</label>
            <select value={afp} onChange={(e) => setAfp(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all">
              <option value="">Seleccionar</option>
              {afps.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Sección: Contacto y Domicilio */}
      <div>
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Phone size={13} className="text-emerald-500" />
          Contacto y Domicilio
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Teléfono</label>
            <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+56 9 1234 5678"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Domicilio Particular</label>
            <input type="text" value={domicilioParticular} onChange={(e) => setDomicilioParticular(e.target.value)} placeholder="Dirección completa"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Comuna / Ciudad</label>
            <input type="text" value={comunaCiudad} onChange={(e) => setComunaCiudad(e.target.value)} placeholder="Ej: Las Condes"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Valor Arriendo (si aplica)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">$</span>
              <input type="number" value={valorArriendo} onChange={(e) => setValorArriendo(e.target.value)} placeholder="0"
                className="w-full h-10 pl-7 pr-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* Sección: Datos del Empleador */}
      <div>
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Building2 size={13} className="text-emerald-500" />
          Datos del Empleador
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Nombre Empleador</label>
            <input type="text" value={nombreEmpleador} onChange={(e) => setNombreEmpleador(e.target.value)} placeholder="Nombre de la empresa"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">RUT Empresa</label>
            <input type="text" value={rutEmpresa} onChange={(e) => setRutEmpresa(e.target.value)} placeholder="12.345.678-9"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Fecha de Ingreso</label>
            <input type="date" value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Cargo</label>
            <input type="text" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ej: Gerente"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Renta Líquida</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">$</span>
              <input type="number" value={rentaLiquida} onChange={(e) => setRentaLiquida(e.target.value)} placeholder="0"
                className="w-full h-10 pl-7 pr-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Banco Abono Renta</label>
            <select value={bancoAbonoRenta} onChange={(e) => setBancoAbonoRenta(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all">
              <option value="">Seleccionar</option>
              {bancos.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Fecha de Pago</label>
            <select value={fechaPago} onChange={(e) => setFechaPago(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all">
              <option value="">Seleccionar</option>
              <option value="1">Dia 1</option>
              <option value="5">Dia 5</option>
              <option value="10">Dia 10</option>
              <option value="15">Dia 15</option>
              <option value="20">Dia 20</option>
              <option value="25">Dia 25</option>
              <option value="30">Dia 30</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Teléfono Laboral</label>
            <input type="tel" value={telefonoLaboralFijo} onChange={(e) => setTelefonoLaboralFijo(e.target.value)} placeholder="Fijo"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Dirección Laboral</label>
            <input type="text" value={direccionLaboral} onChange={(e) => setDireccionLaboral(e.target.value)} placeholder="Dirección del trabajo"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Comuna / Ciudad</label>
            <input type="text" value={comunaCiudadLaboral} onChange={(e) => setComunaCiudadLaboral(e.target.value)} placeholder="Ej: Santiago"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Email Laboral</label>
            <input type="email" value={emailLaboral} onChange={(e) => setEmailLaboral(e.target.value)} placeholder="correo@empresa.cl"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Otros Ingresos</label>
            <input type="text" value={otrosIngresos} onChange={(e) => setOtrosIngresos(e.target.value)} placeholder="Detallar otros ingresos"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
        </div>
      </div>

      {/* Sección: Situación Financiera */}
      <div>
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <DollarSign size={13} className="text-purple-500" />
          Situación Financiera
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Renta Mensual</label>
            <select value={rentaMensual} onChange={(e) => setRentaMensual(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all">
              <option value="">Seleccionar</option>
              {RENTAS_MENSUALES.map((renta) => <option key={renta} value={renta}>{renta}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">En DICOM</label>
            <div className="flex gap-3 h-10 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="dicom" checked={enDicom === false} onChange={() => setEnDicom(false)} className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] text-slate-600">No</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="dicom" checked={enDicom === true} onChange={() => setEnDicom(true)} className="w-4 h-4 text-red-600" />
                <span className="text-[11px] text-slate-600">Si</span>
              </label>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Complementar Renta</label>
            <div className="flex gap-3 h-10 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="complementar" checked={complementarRenta === false} onChange={() => setComplementarRenta(false)} className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] text-slate-600">No</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="complementar" checked={complementarRenta === true} onChange={() => setComplementarRenta(true)} className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] text-slate-600">Si</span>
              </label>
            </div>
          </div>
        </div>
        {enDicom && (
          <div className="mt-3 space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Detalle DICOM</label>
            <input type="text" value={dicomDetalle} onChange={(e) => setDicomDetalle(e.target.value)} placeholder="Describe la situacion en DICOM"
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all" />
          </div>
        )}
      </div>

      {/* Sección: Crédito Solicitado */}
      <div>
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <CreditCard size={13} className="text-amber-500" />
          Crédito Solicitado
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Monto Solicitado</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">$</span>
              <input
                type="number"
                value={montoSolicitado}
                onChange={(e) => setMontoSolicitado(e.target.value)}
                placeholder="0"
                className="w-full h-10 pl-7 pr-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Valor Propiedad</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">$</span>
              <input
                type="number"
                value={valorPropiedad}
                onChange={(e) => setValorPropiedad(e.target.value)}
                placeholder="0"
                className="w-full h-10 pl-7 pr-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Pie Disponible</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">$</span>
              <input
                type="number"
                value={pieDisponible}
                onChange={(e) => setPieDisponible(e.target.value)}
                placeholder="0"
                className="w-full h-10 pl-7 pr-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Banco</label>
            <select
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
            >
              <option value="">Seleccionar banco</option>
              {bancos.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Tipo de Crédito</label>
            <select
              value={tipoCredito}
              onChange={(e) => setTipoCredito(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
            >
              <option value="">Seleccionar tipo</option>
              {tiposCredito.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-700">Cuenta de Ahorro (Cuenta Pie)</label>
          <div className="flex gap-3 h-10 items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="cuentaPie"
                checked={cuentaPie === false}
                onChange={() => setCuentaPie(false)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-[11px] text-slate-600">No tiene</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="cuentaPie"
                checked={cuentaPie === true}
                onChange={() => setCuentaPie(true)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-[11px] text-slate-600">Tiene cuenta pie</span>
            </label>
          </div>
        </div>
      </div>

      {/* Sección: Notas */}
      <div>
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <MessageSquare size={13} className="text-slate-500" />
          Notas y Etiquetas
        </h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Etiquetas</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "urgente", label: "Urgente", color: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" },
                { id: "vip", label: "VIP", color: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200" },
                { id: "referido", label: "Referido", color: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200" },
                { id: "frecuente", label: "Frecuente", color: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200" },
                { id: "nuevo", label: "Nuevo", color: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200" },
                { id: "potencial", label: "Potencial", color: "bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200" },
                { id: "seguimiento", label: "Seguimiento", color: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200" },
                { id: "completado", label: "Completado", color: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" },
              ].map((tag) => {
                const seleccionada = etiqueta.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      const etiquetasActuales = etiqueta ? etiqueta.split(",").filter(Boolean) : [];
                      if (seleccionada) {
                        setEtiqueta(etiquetasActuales.filter((t: string) => t !== tag.id).join(","));
                      } else {
                        setEtiqueta(etiquetasActuales.length > 0 ? `${etiqueta},${tag.id}` : tag.id);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                      seleccionada
                        ? `${tag.color} border-current`
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {seleccionada && "✓ "}{tag.label}
                  </button>
                );
              })}
            </div>
            {etiqueta && (
              <p className="text-[9px] text-slate-400 mt-1">
                Seleccionadas: {etiqueta.split(",").filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Comentarios</label>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Notas adicionales sobre el cliente..."
              rows={3}
              className="w-full px-3 py-2.5 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando || guardado}
          className={`flex items-center gap-2 px-6 py-2.5 text-[11px] font-semibold rounded-xl transition-all shadow-md ${
            guardado
              ? "bg-emerald-500 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20"
          }`}
        >
          {guardando ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </>
          ) : guardado ? (
            <>
              <Check size={14} />
              Guardado
            </>
          ) : (
            "Guardar Cambios"
          )}
        </button>
      </div>
    </form>
  );
}
