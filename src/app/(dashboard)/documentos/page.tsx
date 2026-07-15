"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Upload,
  Trash2,
  MessageSquare,
  Grid,
  List,
  Building2,
  Calendar,
  User,
  Filter,
  FolderOpen,
  FileCheck,
  FileX,
  FileClock,
  ExternalLink,
  ChevronRight,
  Send,
  Plus,
  Edit2,
  X,
  Check,
  Tag,
} from "lucide-react";
import { TIPOS_DOCUMENTO_CONFIG } from "@/tipos";
import { SubirDocumento } from "@/componentes/documentos/SubirDocumento";
import { VistaPreviaDocumento } from "@/componentes/documentos/VistaPreviaDocumento";
import { GestionarEstado } from "@/componentes/documentos/GestionarEstado";
import { SolicitarDocumentos } from "@/componentes/documentos/SolicitarDocumentos";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import type { DocumentoLead, TipoDocumento } from "@/tipos";

type EstadoDoc = "PENDIENTE" | "EN_REVISION" | "APROBADO" | "RECHAZADO";

interface TipoDocumentoCustom {
  id: string;
  nombre: string;
  color: string;
  esPersonalizado: boolean;
}

const estadoConfig: Record<EstadoDoc, { label: string; icono: React.ReactNode; class: string; bg: string; dot: string }> = {
  PENDIENTE: { label: "Pendiente", icono: <Clock size={12} />, class: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
  EN_REVISION: { label: "En Revisión", icono: <AlertCircle size={12} />, class: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500" },
  APROBADO: { label: "Aprobado", icono: <CheckCircle size={12} />, class: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  RECHAZADO: { label: "Rechazado", icono: <XCircle size={12} />, class: "text-red-600", bg: "bg-red-50", dot: "bg-red-500" },
};

const tipoColores: Record<string, string> = {
  CEDULA_IDENTIDAD: "#3B82F6",
  CONTRATO_TRABAJO: "#8B5CF6",
  COMPROBANTE_INGRESOS: "#10B981",
  CERTIFICADO_AFP: "#F59E0B",
  DECLARACION_RENTA: "#EF4444",
  VALORIZACION: "#06B6D4",
  CERTIFICADO_PIE: "#EC4899",
  LIQUIDACION_SUELDO: "#8B5CF6",
  CERTIFICADO_COTIZACIONES_AFP: "#F59E0B",
  ANEXO_LABORAL: "#10B981",
  COMPROBANTE_DOMICILIO: "#06B6D4",
  TITULO_UNIVERSITARIO: "#F59E0B",
  PADRON_VEHICULO: "#F97316",
  DOMINIO_PROPIEDAD: "#14B8A6",
  CERTIFICADO_CMF: "#3B82F6",
  CARTERA_TRIBUTARIA_36: "#8B5CF6",
  BOLETAS_CON_IMPUESTO: "#10B981",
  RESUMEN_MENSUAL_BOLETAS: "#F59E0B",
  RESUMEN_ANUAL_BOLETAS: "#EF4444",
  DECLARACION_RENTA_F22: "#EF4444",
  ACEPTACION_RENTA: "#10B981",
  ROL_EMPRESA: "#3B82F6",
  CERTIFICADO_DEUDA_TGR: "#8B5CF6",
  BALANCE: "#F59E0B",
  OTRO: "#64748B",
};

const COLORES_DISPONIBLES = [
  "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444",
  "#06B6D4", "#EC4899", "#64748B", "#F97316", "#14B8A6",
];

const TIPOS_DOCUMENTO_BASE: TipoDocumentoCustom[] = [
  { id: "CEDULA_IDENTIDAD", nombre: "Cédula de Identidad", color: "#3B82F6", esPersonalizado: false },
  { id: "LIQUIDACION_SUELDO", nombre: "Liquidaciones de Sueldo", color: "#8B5CF6", esPersonalizado: false },
  { id: "CERTIFICADO_COTIZACIONES_AFP", nombre: "Cert. Cotizaciones AFP 24 meses", color: "#F59E0B", esPersonalizado: false },
  { id: "ANEXO_LABORAL", nombre: "Anexo/Permanencia Laboral", color: "#10B981", esPersonalizado: false },
  { id: "COMPROBANTE_DOMICILIO", nombre: "Comprobante de Domicilio", color: "#06B6D4", esPersonalizado: false },
  { id: "CERTIFICADO_CMF", nombre: "Certificado CMF", color: "#3B82F6", esPersonalizado: false },
  { id: "BOLETAS_CON_IMPUESTO", nombre: "Boletas con Impuesto", color: "#10B981", esPersonalizado: false },
  { id: "RESUMEN_MENSUAL_BOLETAS", nombre: "Resumen Mensual Boletas", color: "#F59E0B", esPersonalizado: false },
  { id: "RESUMEN_ANUAL_BOLETAS", nombre: "Resumen Anual Boletas", color: "#EF4444", esPersonalizado: false },
  { id: "DECLARACION_RENTA_F22", nombre: "Declaración Renta F22", color: "#EF4444", esPersonalizado: false },
  { id: "ACEPTACION_RENTA", nombre: "Aceptación de Renta", color: "#10B981", esPersonalizado: false },
  { id: "CARTERA_TRIBUTARIA_36", nombre: "Cartera Tributaria 36 meses", color: "#8B5CF6", esPersonalizado: false },
  { id: "ROL_EMPRESA", nombre: "Rol Empresa", color: "#3B82F6", esPersonalizado: false },
  { id: "CERTIFICADO_DEUDA_TGR", nombre: "Certificado Deuda TGR", color: "#8B5CF6", esPersonalizado: false },
  { id: "BALANCE", nombre: "Balance Firmado", color: "#F59E0B", esPersonalizado: false },
  { id: "TITULO_UNIVERSITARIO", nombre: "Título Universitario", color: "#F59E0B", esPersonalizado: false },
  { id: "PADRON_VEHICULO", nombre: "Padrón de Vehículo", color: "#F97316", esPersonalizado: false },
  { id: "DOMINIO_PROPIEDAD", nombre: "Dominio de Propiedad", color: "#14B8A6", esPersonalizado: false },
];

export default function DocumentosPage() {
  const router = useRouter();
  const [documentos, setDocumentos] = useState<DocumentoLead[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoDoc | "todos">("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroLead, setFiltroLead] = useState<string>("todos");
  const [vistaActiva, setVistaActiva] = useState<"tabla" | "tarjetas">("tabla");

  // Modales
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [gestionarOpen, setGestionarOpen] = useState(false);
  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [solicitarOpen, setSolicitarOpen] = useState(false);
  const [docSeleccionado, setDocSeleccionado] = useState<DocumentoLead | null>(null);

  // Gestión de tipos de documento personalizados
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoCustom[]>(TIPOS_DOCUMENTO_BASE);
  const [mostrarFormularioTipo, setMostrarFormularioTipo] = useState(false);
  const [nuevoTipoNombre, setNuevoTipoNombre] = useState("");
  const [nuevoTipoColor, setNuevoTipoColor] = useState(COLORES_DISPONIBLES[0]);
  const [editandoTipo, setEditandoTipo] = useState<string | null>(null);
  const [nombreEditandoTipo, setNombreEditandoTipo] = useState("");

  useEffect(() => {
    async function cargarDocumentos() {
      try {
        const res = await fetch("/api/documentos");
        const json = await res.json();
        if (json.success && json.data) {
          setDocumentos(json.data.map((d: Record<string, any>) => ({
            ...d,
            creadoEn: d.creadoEn ? new Date(d.creadoEn) : new Date(),
          })));
        }
      } catch {
        setDocumentos([]);
      } finally {
        setCargando(false);
      }
    }
    cargarDocumentos();
  }, []);

  // Obtener leads únicos
  const leadsUnicos = useMemo(() => {
    const leads = new Map<string, string>();
    documentos.forEach((doc) => {
      if (doc.leadId && doc.leadNombre) {
        leads.set(doc.leadId, doc.leadNombre);
      }
    });
    return Array.from(leads.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [documentos]);

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => {
      const coincideBusqueda =
        !busqueda ||
        doc.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        doc.leadNombre?.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEstado = filtroEstado === "todos" || doc.estado === filtroEstado;
      const coincideTipo = filtroTipo === "todos" || doc.tipo === filtroTipo;
      const coincideLead = filtroLead === "todos" || doc.leadId === filtroLead;
      return coincideBusqueda && coincideEstado && coincideTipo && coincideLead;
    });
  }, [documentos, busqueda, filtroEstado, filtroTipo, filtroLead]);

  const estadisticas = useMemo(() => ({
    total: documentos.length,
    pendientes: documentos.filter((d) => d.estado === "PENDIENTE").length,
    enRevision: documentos.filter((d) => d.estado === "EN_REVISION").length,
    aprobados: documentos.filter((d) => d.estado === "APROBADO").length,
    rechazados: documentos.filter((d) => d.estado === "RECHAZADO").length,
    porLead: leadsUnicos.map((lead) => ({
      id: lead.id,
      nombre: lead.nombre,
      total: documentos.filter((d) => d.leadId === lead.id).length,
      aprobados: documentos.filter((d) => d.leadId === lead.id && d.estado === "APROBADO").length,
    })),
  }), [documentos, leadsUnicos]);

  // Funciones para gestionar tipos de documento
  const agregarTipoDocumento = () => {
    if (!nuevoTipoNombre.trim()) {
      toast.error("Ingresa un nombre para el tipo de documento");
      return;
    }

    const existe = tiposDocumento.some(
      (t) => t.nombre.toLowerCase() === nuevoTipoNombre.trim().toLowerCase()
    );
    if (existe) {
      toast.error("Ya existe un tipo de documento con ese nombre");
      return;
    }

    const nuevoTipo: TipoDocumentoCustom = {
      id: `CUSTOM_${Date.now()}`,
      nombre: nuevoTipoNombre.trim(),
      color: nuevoTipoColor,
      esPersonalizado: true,
    };

    setTiposDocumento((prev) => [...prev, nuevoTipo]);
    setNuevoTipoNombre("");
    setNuevoTipoColor(COLORES_DISPONIBLES[0]);
    setMostrarFormularioTipo(false);
    toast.success("Tipo de documento creado", {
      description: `"${nuevoTipo.nombre}" está disponible para usar`,
    });
  };

  const eliminarTipoDocumento = (id: string) => {
    const tipo = tiposDocumento.find((t) => t.id === id);
    if (tipo?.esPersonalizado) {
      setTiposDocumento((prev) => prev.filter((t) => t.id !== id));
      toast.info("Tipo de documento eliminado");
    }
  };

  const iniciarEdicionTipo = (tipo: TipoDocumentoCustom) => {
    setEditandoTipo(tipo.id);
    setNombreEditandoTipo(tipo.nombre);
  };

  const guardarEdicionTipo = (id: string) => {
    if (!nombreEditandoTipo.trim()) return;
    setTiposDocumento((prev) =>
      prev.map((t) => (t.id === id ? { ...t, nombre: nombreEditandoTipo.trim() } : t))
    );
    setEditandoTipo(null);
    setNombreEditandoTipo("");
    toast.success("Tipo de documento actualizado");
  };

  const cancelarEdicionTipo = () => {
    setEditandoTipo(null);
    setNombreEditandoTipo("");
  };

  const handlePreview = (doc: DocumentoLead) => {
    setDocSeleccionado(doc);
    setPreviewOpen(true);
  };

  const handleGestionar = (doc: DocumentoLead) => {
    setDocSeleccionado(doc);
    setGestionarOpen(true);
  };

  const handleEliminar = (doc: DocumentoLead) => {
    setDocSeleccionado(doc);
    setEliminarOpen(true);
  };

  const handleConfirmarEliminar = async () => {
    if (docSeleccionado) {
      try {
        await fetch(`/api/documentos/${docSeleccionado.id}`, { method: "DELETE" });
        setDocumentos((prev) => prev.filter((d) => d.id !== docSeleccionado.id));
      } catch {
        // Error silencioso
      }
      setDocSeleccionado(null);
    }
  };

  const handleUpload = async (nuevoDoc: Omit<DocumentoLead, "id" | "creadoEn">) => {
    try {
      const res = await fetch("/api/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoDoc),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setDocumentos((prev) => [{ ...json.data, creadoEn: new Date(json.data.creadoEn) }, ...prev]);
      }
    } catch {
      // Error silencioso
    }
  };

  const handleCambiarEstado = async (docId: string, nuevoEstado: DocumentoLead["estado"], comentario?: string) => {
    try {
      await fetch(`/api/documentos/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      setDocumentos((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, estado: nuevoEstado } : d))
      );
    } catch {
      // Error silencioso
    }
  };

  const irAlCliente = (leadId: string) => {
    router.push(`/clientes/${leadId}`);
  };

  const getTipoColor = (tipo: string): string => {
    const tipoConfig = tiposDocumento.find((t) => t.id === tipo);
    return tipoConfig?.color || tipoColores[tipo] || "#64748B";
  };

  const getTipoNombre = (tipo: string): string => {
    const tipoConfig = tiposDocumento.find((t) => t.id === tipo);
    return tipoConfig?.nombre || TIPOS_DOCUMENTO_CONFIG[tipo as TipoDocumento]?.label || tipo;
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-sm text-slate-500">Cargando documentos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Gestión de Documentos
            </h1>
            <p className="text-indigo-200 text-[11px] font-medium">
              Administra y da seguimiento a todos los documentos de tus clientes
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{estadisticas.total}</div>
              <div className="text-[10px] text-indigo-200">Total</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-300">{estadisticas.aprobados}</div>
              <div className="text-[10px] text-indigo-200">Aprobados</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-300">{estadisticas.pendientes + estadisticas.enRevision}</div>
              <div className="text-[10px] text-indigo-200">Pendientes</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard
          icon={<FolderOpen size={16} />}
          label="Total"
          value={estadisticas.total}
          color="slate"
        />
        <KPICard
          icon={<Clock size={16} />}
          label="Pendientes"
          value={estadisticas.pendientes}
          color="amber"
        />
        <KPICard
          icon={<AlertCircle size={16} />}
          label="En Revisión"
          value={estadisticas.enRevision}
          color="blue"
        />
        <KPICard
          icon={<CheckCircle size={16} />}
          label="Aprobados"
          value={estadisticas.aprobados}
          color="emerald"
        />
        <KPICard
          icon={<XCircle size={16} />}
          label="Rechazados"
          value={estadisticas.rechazados}
          color="red"
        />
      </div>

      {/* Tipos de Documento */}
      <div className="bg-white rounded-2xl border border-slate-100/80 shadow-soft p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-slate-500" />
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tipos de Documento</span>
          </div>
          <button
            onClick={() => setMostrarFormularioTipo(!mostrarFormularioTipo)}
            className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <Plus size={12} /> Agregar tipo
          </button>
        </div>

        {/* Formulario para agregar tipo */}
        {mostrarFormularioTipo && (
          <div className="mb-3 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nombre del tipo de documento"
                value={nuevoTipoNombre}
                onChange={(e) => setNuevoTipoNombre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && agregarTipoDocumento()}
                className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-400"
                autoFocus
              />
              <div className="flex items-center gap-1">
                {COLORES_DISPONIBLES.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNuevoTipoColor(color)}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      nuevoTipoColor === color ? "ring-2 ring-offset-1 ring-indigo-500 scale-110" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                onClick={agregarTipoDocumento}
                disabled={!nuevoTipoNombre.trim()}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear
              </button>
              <button
                onClick={() => {
                  setMostrarFormularioTipo(false);
                  setNuevoTipoNombre("");
                  setNuevoTipoColor(COLORES_DISPONIBLES[0]);
                }}
                className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg text-[11px] font-semibold hover:bg-slate-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de tipos */}
        <div className="flex flex-wrap gap-2">
          {tiposDocumento.map((tipo) => (
            <div
              key={tipo.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                filtroTipo === tipo.id
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: tipo.color }}
              />
              {editandoTipo === tipo.id ? (
                <input
                  type="text"
                  value={nombreEditandoTipo}
                  onChange={(e) => setNombreEditandoTipo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") guardarEdicionTipo(tipo.id);
                    if (e.key === "Escape") cancelarEdicionTipo();
                  }}
                  className="w-24 px-1 py-0.5 bg-white border border-indigo-300 rounded text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setFiltroTipo(tipo.id === filtroTipo ? "todos" : tipo.id)}
                  className="text-[10px] font-medium text-slate-600"
                >
                  {tipo.nombre}
                </button>
              )}
              {tipo.esPersonalizado && (
                <div className="flex items-center gap-0.5">
                  {editandoTipo === tipo.id ? (
                    <>
                      <button
                        onClick={() => guardarEdicionTipo(tipo.id)}
                        className="p-0.5 hover:bg-emerald-100 rounded transition-colors"
                      >
                        <Check size={8} className="text-emerald-600" />
                      </button>
                      <button
                        onClick={cancelarEdicionTipo}
                        className="p-0.5 hover:bg-slate-100 rounded transition-colors"
                      >
                        <X size={8} className="text-slate-400" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => iniciarEdicionTipo(tipo)}
                        className="p-0.5 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Edit2 size={8} className="text-blue-500" />
                      </button>
                      <button
                        onClick={() => eliminarTipoDocumento(tipo.id)}
                        className="p-0.5 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 size={8} className="text-red-500" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-100/80 shadow-soft p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
            />
          </div>

          <select
            value={filtroLead}
            onChange={(e) => setFiltroLead(e.target.value)}
            className="h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 font-medium"
          >
            <option value="todos">Todos los clientes</option>
            {leadsUnicos.map((lead) => (
              <option key={lead.id} value={lead.id}>{lead.nombre}</option>
            ))}
          </select>

          <div className="flex gap-1.5">
            {(["todos", "PENDIENTE", "EN_REVISION", "APROBADO", "RECHAZADO"] as const).map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-2 rounded-xl text-[10px] font-semibold transition-all ${
                  filtroEstado === estado
                    ? estado === "todos"
                      ? "bg-slate-800 text-white"
                      : `${estadoConfig[estado].bg} ${estadoConfig[estado].class}`
                    : "bg-white border border-slate-200/60 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {estado === "todos" ? "Todos" : estadoConfig[estado].label}
              </button>
            ))}
          </div>

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
              <Grid size={14} className={vistaActiva === "tarjetas" ? "text-slate-700" : "text-slate-400"} />
            </button>
          </div>

          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Upload size={14} /> Subir
          </button>
          <button
            onClick={() => setSolicitarOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[11px] font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Send size={14} /> Solicitar
          </button>
        </div>
      </div>

      {/* Vista de Tabla */}
      {vistaActiva === "tabla" && (
        <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-soft">
          {/* Header con progreso por cliente */}
          <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-4 overflow-x-auto">
              {estadisticas.porLead.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => setFiltroLead(lead.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors whitespace-nowrap ${
                    filtroLead === lead.id
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                  }`}
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-md flex items-center justify-center text-[8px] font-bold text-white">
                    {lead.nombre.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <span>{lead.nombre}</span>
                  <span className="text-[9px] text-slate-400">
                    {lead.aprobados}/{lead.total}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documento</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="text-right px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {documentosFiltrados.map((doc) => {
                const config = estadoConfig[doc.estado as EstadoDoc];
                const tipoColor = getTipoColor(doc.tipo);
                return (
                  <tr key={doc.id} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${tipoColor}15` }}
                        >
                          <FileText size={16} style={{ color: tipoColor }} />
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-slate-800">{doc.nombre}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">ID: {doc.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => irAlCliente(doc.leadId)}
                        className="flex items-center gap-2 hover:bg-indigo-50 px-2 py-1 -mx-2 rounded-lg transition-colors"
                      >
                        <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-lg flex items-center justify-center text-[9px] font-bold text-white">
                          {doc.leadNombre?.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="text-left">
                          <div className="text-[11px] font-semibold text-slate-700">{doc.leadNombre}</div>
                          <div className="text-[9px] text-indigo-500 flex items-center gap-0.5">
                            Ver perfil <ExternalLink size={8} />
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: `${tipoColor}12`, color: tipoColor }}
                      >
                        {getTipoNombre(doc.tipo)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleGestionar(doc)}
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg ${config.bg} ${config.class} hover:opacity-80 transition-opacity cursor-pointer`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} className="text-slate-400" />
                        <span className="text-[11px] text-slate-500 font-medium">
                          {doc.creadoEn.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handlePreview(doc)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Vista previa"
                        >
                          <Eye size={14} className="text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleGestionar(doc)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Gestionar estado"
                        >
                          <MessageSquare size={14} className="text-blue-500" />
                        </button>
                        <button className="p-2 hover:bg-emerald-50 rounded-lg transition-colors" title="Descargar">
                          <Download size={14} className="text-emerald-500" />
                        </button>
                        <button
                          onClick={() => handleEliminar(doc)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {documentosFiltrados.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No se encontraron documentos</p>
              <p className="text-[11px] text-slate-400 mt-1">Intenta ajustar los filtros o sube un nuevo documento</p>
            </div>
          )}
        </div>
      )}

      {/* Vista de Tarjetas */}
      {vistaActiva === "tarjetas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {documentosFiltrados.map((doc) => {
            const config = estadoConfig[doc.estado as EstadoDoc];
            const tipoColor = getTipoColor(doc.tipo);
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-100/80 p-4 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${tipoColor}15` }}
                  >
                    <FileText size={20} style={{ color: tipoColor }} />
                  </div>
                  <button
                    onClick={() => handleGestionar(doc)}
                    className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.class}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                    {config.label}
                  </button>
                </div>

                <h4 className="text-[12px] font-bold text-slate-800 mb-1 truncate">{doc.nombre}</h4>
                <p className="text-[10px] mb-3" style={{ color: tipoColor }}>{getTipoNombre(doc.tipo)}</p>

                <button
                  onClick={() => irAlCliente(doc.leadId)}
                  className="flex items-center gap-2 mb-3 p-2 bg-slate-50 rounded-lg hover:bg-indigo-50 transition-colors w-full"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-lg flex items-center justify-center text-[9px] font-bold text-white">
                    {doc.leadNombre?.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-slate-700 truncate">{doc.leadNombre}</div>
                    <div className="text-[9px] text-indigo-500">Ver perfil</div>
                  </div>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={10} className="text-slate-400" />
                    <span className="text-[9px] text-slate-400">{doc.creadoEn.toLocaleDateString("es-CL")}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handlePreview(doc)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Eye size={12} className="text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleEliminar(doc)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={12} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {documentosFiltrados.length === 0 && (
            <div className="col-span-full p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No se encontraron documentos</p>
              <p className="text-[11px] text-slate-400 mt-1">Intenta ajustar los filtros o sube un nuevo documento</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Upload */}
      <SubirDocumento
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        leadId=""
        onUpload={handleUpload}
      />

      {/* Modal Vista Previa */}
      <VistaPreviaDocumento
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        documento={docSeleccionado}
      />

      {/* Modal Gestionar Estado */}
      <GestionarEstado
        open={gestionarOpen}
        onOpenChange={setGestionarOpen}
        documento={docSeleccionado}
        onCambiarEstado={handleCambiarEstado}
      />

      {/* Dialog Eliminar */}
      <ConfirmDialog
        open={eliminarOpen}
        onOpenChange={setEliminarOpen}
        title="Eliminar Documento"
        description={`¿Estás seguro de eliminar "${docSeleccionado?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleConfirmarEliminar}
      />

      {/* Modal Solicitar Documentos */}
      <SolicitarDocumentos
        open={solicitarOpen}
        onOpenChange={setSolicitarOpen}
      />
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colorStyles: Record<string, { bg: string; text: string; ring: string }> = {
    slate: { bg: "bg-slate-50", text: "text-slate-500", ring: "ring-slate-500/10" },
    amber: { bg: "bg-amber-50", text: "text-amber-500", ring: "ring-amber-500/10" },
    blue: { bg: "bg-blue-50", text: "text-blue-500", ring: "ring-blue-500/10" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-500", ring: "ring-emerald-500/10" },
    red: { bg: "bg-red-50", text: "text-red-500", ring: "ring-red-500/10" },
  };
  const styles = colorStyles[color] || colorStyles.slate;

  return (
    <div className="bg-white rounded-xl border border-slate-100/80 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 ${styles.bg} rounded-lg flex items-center justify-center ring-1 ${styles.ring}`}>
          <div className={styles.text}>{icon}</div>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">{label}</span>
      </div>
      <div className="text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
