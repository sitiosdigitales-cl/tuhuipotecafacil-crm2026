"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  Edit,
  Building2,
  Home,
  DollarSign,
  User,
  Send,
  Eye,
  Trash2,
  FileCheck,
  FileX,
  FileClock,
  Briefcase,
  UserCheck,
  CreditCard,
  Hash,
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
  MapPin,
  BriefcaseBusiness,
  Check,
} from "lucide-react";
import { ETAPAS_CONFIG, ORIGEN_LABELS } from "@/tipos";
import { SITUACION_LABORAL_CONFIG, RENTAS_MENSUALES } from "@/tipos";
import { formatoMoneda, formatoUF } from "@/lib/utils";
import { useLeads } from "@/lib/contexts/LeadContext";
import { useUser } from "@/lib/contexts/UserContext";
import { type Actividad } from "@/lib/contexts/ActivityContext";
import { toast } from "sonner";
import { SubirDocumento } from "@/componentes/documentos/SubirDocumento";
import { VistaPreviaDocumento } from "@/componentes/documentos/VistaPreviaDocumento";
import { GestionarEstado } from "@/componentes/documentos/GestionarEstado";
import { SolicitarDocumentos } from "@/componentes/documentos/SolicitarDocumentos";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Lead, DocumentoLead, SituacionLaboral, Etapa } from "@/tipos";

// Documentos por tipo de trabajador
const DOCUMENTOS_POR_TIPO: Record<SituacionLaboral, { id: string; nombre: string; obligatorio: boolean; tipo: string }[]> = {
  DEPENDIENTE: [
    { id: "liq-sueldo", nombre: "Últimas 6 liquidaciones de sueldo", obligatorio: true, tipo: "COMPROBANTE_INGRESOS" },
    { id: "afp", nombre: "Certificado cotizaciones AFP", obligatorio: true, tipo: "CERTIFICADO_AFP" },
    { id: "cedula", nombre: "Cédula de identidad", obligatorio: true, tipo: "CEDULA_IDENTIDAD" },
    { id: "antiguedad", nombre: "Certificado antigüedad laboral", obligatorio: true, tipo: "CONTRATO_TRABAJO" },
    { id: "domicilio", nombre: "Comprobante de domicilio", obligatorio: true, tipo: "OTRO" },
    { id: "titulo", nombre: "Certificado título profesional", obligatorio: false, tipo: "OTRO" },
    { id: "dicom", nombre: "Informe DICOM", obligatorio: true, tipo: "OTRO" },
  ],
  INDEPENDIENTE: [
    { id: "carpeta-trib", nombre: "Carpeta tributaria", obligatorio: true, tipo: "DECLARACION_RENTA" },
    { id: "iva", nombre: "Últimas 12 declaraciones IVA", obligatorio: false, tipo: "DECLARACION_RENTA" },
    { id: "renta", nombre: "Última declaración de renta", obligatorio: true, tipo: "DECLARACION_RENTA" },
    { id: "cedula", nombre: "Cédula de identidad", obligatorio: true, tipo: "CEDULA_IDENTIDAD" },
    { id: "dicom", nombre: "Informe DICOM", obligatorio: true, tipo: "OTRO" },
  ],
};

// Generar documentos basados en el lead (todos pendientes por defecto)
function generarDocumentosLead(lead: Lead): DocumentoLead[] {
  const docsConfig = DOCUMENTOS_POR_TIPO[lead.situacionLaboral] || DOCUMENTOS_POR_TIPO.DEPENDIENTE;
  const leadNombre = `${lead.nombre} ${lead.apellido}`;

  return docsConfig.map((doc, i) => ({
    id: `${lead.id}-doc-${i}`,
    leadId: lead.id,
    leadNombre,
    nombre: doc.nombre,
    tipo: doc.tipo as DocumentoLead["tipo"],
    estado: "PENDIENTE" as DocumentoLead["estado"],
    creadoEn: new Date(),
  }));
}

const estadoDocConfig: Record<string, { label: string; icono: React.ReactNode; color: string; bg: string; dot: string }> = {
  APROBADO: { label: "Aprobado", icono: <CheckCircle size={12} />, color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  EN_REVISION: { label: "En Revisión", icono: <FileClock size={12} />, color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
  RECIBIDO: { label: "Recibido", icono: <FileCheck size={12} />, color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500" },
  RECHAZADO: { label: "Rechazado", icono: <FileX size={12} />, color: "text-red-600", bg: "bg-red-50", dot: "bg-red-500" },
  PENDIENTE: { label: "Pendiente", icono: <AlertCircle size={12} />, color: "text-slate-400", bg: "bg-slate-50", dot: "bg-slate-400" },
};

const prioridadConfig = {
  BAJA: { label: "Baja", class: "bg-slate-100 text-slate-600" },
  MEDIA: { label: "Media", class: "bg-blue-50 text-blue-600 border border-blue-100" },
  ALTA: { label: "Alta", class: "bg-orange-50 text-orange-600 border border-orange-100" },
  URGENTE: { label: "Urgente", class: "bg-red-50 text-red-600 border border-red-100" },
};

const TABS = [
  { id: "resumen", label: "Resumen", icono: User },
  { id: "asesor", label: "Asesor", icono: UserCheck },
  { id: "documentos", label: "Documentos", icono: FileText },
  { id: "actividad", label: "Actividad", icono: Activity },
  { id: "financiero", label: "Financiero", icono: DollarSign },
  { id: "progreso", label: "Progreso", icono: TrendingUp },
];

const PASOS_PROGRESO = [
  { paso: 1, label: "Registro", etapa: "NUEVO_LEAD" as Etapa },
  { paso: 2, label: "Contacto", etapa: "CONTACTADO" as Etapa },
  { paso: 3, label: "Calificación", etapa: "CALIFICACION_COMERCIAL" as Etapa },
  { paso: 4, label: "Documentación", etapa: "DOCS_COMPLETAS" as Etapa },
  { paso: 5, label: "Evaluación", etapa: "EVALUACION_BANCARIA" as Etapa },
  { paso: 6, label: "Aprobado", etapa: "APROBADO" as Etapa },
];

export default function ClientePerfilPage() {
  const router = useRouter();
  const routeParams = useParams();
  const id = routeParams.id as string;
  const { actualizarLead } = useLeads();
  const { usuarioActual } = useUser();
  const [lead, setLead] = useState<Lead | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelado = false;
    async function cargarLead() {
      try {
        const res = await fetch(`/api/leads/${id}`, { credentials: "include" });
        if (cancelado) return;
        if (!res.ok) {
          setLead(null);
          setCargando(false);
          return;
        }
        const json = await res.json();
        if (cancelado) return;
        if (json.success && json.data) {
          setLead({
            ...json.data,
            creadoEn: json.data.creadoEn ? new Date(json.data.creadoEn) : new Date(),
          });
        } else {
          setLead(null);
        }
      } catch {
        if (!cancelado) setLead(null);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargarLead();
    return () => { cancelado = true; };
  }, [id]);

  // Cargar datos del asesor asignado
  useEffect(() => {
    if (!lead?.asignadoA) {
      setAsesorAsignado(null);
      return;
    }
    let cancelado = false;
    async function cargarAsesor() {
      setCargandoAsesor(true);
      try {
        const res = await fetch(`/api/usuarios?id=${lead!.asignadoA}`, { credentials: "include" });
        if (cancelado) return;
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setAsesorAsignado(json.data[0]);
        } else {
          setAsesorAsignado(null);
        }
      } catch {
        if (!cancelado) setAsesorAsignado(null);
      } finally {
        if (!cancelado) setCargandoAsesor(false);
      }
    }
    cargarAsesor();
    return () => { cancelado = true; };
  }, [lead?.asignadoA]);

  const [tabActiva, setTabActiva] = useState("resumen");
  const [documentos, setDocumentos] = useState<DocumentoLead[]>(() => lead ? generarDocumentosLead(lead) : []);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [gestionarOpen, setGestionarOpen] = useState(false);
  const [docSeleccionado, setDocSeleccionado] = useState<DocumentoLead | null>(null);
  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [agendarOpen, setAgendarOpen] = useState(false);
  const [fechaReunion, setFechaReunion] = useState("");
  const [horaReunion, setHoraReunion] = useState("10:00");
  const [notasReunion, setNotasReunion] = useState("");
  const [editarOpen, setEditarOpen] = useState(false);
  const [solicitarOpen, setSolicitarOpen] = useState(false);
  const [guardandoProgreso, setGuardandoProgreso] = useState(false);
  const [asesorAsignado, setAsesorAsignado] = useState<{ id: string; nombre: string; apellido: string; email: string; telefono?: string; cargo?: string; rol?: string; avatar?: string } | null>(null);
  const [cargandoAsesor, setCargandoAsesor] = useState(false);

  const etapaActual = lead ? PASOS_PROGRESO.find((p) => p.etapa === lead.etapa)?.paso || 1 : 0;
  const totalPasos = PASOS_PROGRESO.length;
  const progreso = (etapaActual / totalPasos) * 100;

  const moverEtapa = async (nuevaEtapa: Etapa) => {
    if (!lead) return;
    setGuardandoProgreso(true);
    try {
      await actualizarLead(lead.id, { etapa: nuevaEtapa, diasEnEtapa: 0 });
      setLead({ ...lead, etapa: nuevaEtapa, diasEnEtapa: 0 });
      toast.success("Etapa actualizada", { description: `Movido a ${PASOS_PROGRESO.find(p => p.etapa === nuevaEtapa)?.label}` });
    } catch {
      toast.error("Error al actualizar etapa");
    } finally {
      setGuardandoProgreso(false);
    }
  };

  // Actividades vacías por ahora (sin dependencia de ActivityContext)
  const actividades: Actividad[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const agregarActividad = async (_data: any) => {};
  const getIconoActividad = (_tipo: string) => ({ icono: Clock, color: "text-slate-500", bg: "bg-slate-50" });
  const formatearTiempoRelativo = (fecha: Date) => fecha.toLocaleDateString("es-CL");

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-slate-500">Cargando cliente...</span>
      </div>
    );
  }

  if (!lead) return null;

  const config = ETAPAS_CONFIG[lead.etapa];
  const docsAprobados = documentos.filter((d) => d.estado === "APROBADO").length;
  const docsTotal = documentos.length;
  const porcentajeDocs = docsTotal > 0 ? Math.round((docsAprobados / docsTotal) * 100) : 0;

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

  const handleConfirmarEliminar = () => {
    if (docSeleccionado) {
      setDocumentos((prev) => prev.filter((d) => d.id !== docSeleccionado.id));
      setDocSeleccionado(null);
    }
  };

  const handleUpload = (nuevoDoc: Omit<DocumentoLead, "id" | "creadoEn">) => {
    const doc: DocumentoLead = {
      ...nuevoDoc,
      id: `doc-${Date.now()}`,
      creadoEn: new Date(),
    };
    setDocumentos((prev) => [doc, ...prev]);
  };

  const handleCambiarEstado = (docId: string, nuevoEstado: DocumentoLead["estado"]) => {
    setDocumentos((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, estado: nuevoEstado } : d))
    );
  };

  const abrirWhatsApp = () => {
    const telefono = lead.telefono?.replace(/\s/g, "").replace("+", "");
    window.open(`https://wa.me/56${telefono?.replace(/^56/, "")}`, "_blank");
    agregarActividad({
      leadId: lead.id,
      tipo: "whatsapp",
      titulo: "Mensaje de WhatsApp",
      descripcion: `Se abrió WhatsApp para contactar a ${lead.nombre}`,
      usuario: usuarioActual?.nombre || "Sistema",
      usuarioId: usuarioActual?.id,
    });
  };

  const abrirEmail = () => {
    window.open(`mailto:${lead.email}`, "_blank");
    agregarActividad({
      leadId: lead.id,
      tipo: "email",
      titulo: "Email enviado",
      descripcion: `Se abrió cliente de correo para ${lead.email}`,
      usuario: usuarioActual?.nombre || "Sistema",
      usuarioId: usuarioActual?.id,
    });
  };

  const llamar = () => {
    window.open(`tel:${lead.telefono}`, "_blank");
    agregarActividad({
      leadId: lead.id,
      tipo: "llamada",
      titulo: "Llamada telefónica",
      descripcion: `Llamada a ${lead.telefono}`,
      usuario: usuarioActual?.nombre || "Sistema",
      usuarioId: usuarioActual?.id,
    });
  };

  const situacionConfig = SITUACION_LABORAL_CONFIG[lead.situacionLaboral];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-lg shadow-slate-200/50">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm border border-white/20"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <button
            onClick={() => setEditarOpen(true)}
            className="absolute top-4 right-4 p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm border border-white/20"
            title="Editar cliente"
          >
            <Edit size={18} className="text-white" />
          </button>
        </div>

        {/* Perfil */}
        <div className="px-6 pb-6 -mt-14 relative">
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-5">
              {/* Avatar */}
              <div className="relative">
                <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-xl border-4 border-white">
                  {lead.nombre[0]}{lead.apellido[0]}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-3 border-white flex items-center justify-center shadow-md ${
                  lead.prioridad === "URGENTE" ? "bg-red-500" :
                  lead.prioridad === "ALTA" ? "bg-orange-500" :
                  lead.prioridad === "MEDIA" ? "bg-blue-500" : "bg-slate-400"
                }`}>
                  {lead.prioridad === "URGENTE" && <AlertTriangle size={11} className="text-white" />}
                  {lead.prioridad === "ALTA" && <TrendingUp size={11} className="text-white" />}
                </div>
              </div>

              {/* Info del cliente */}
              <div className="pb-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {lead.nombre} {lead.apellido}
                </h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-sm text-slate-400 font-medium flex items-center gap-1.5">
                    <Hash size={13} /> {lead.rut}
                  </span>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                    <span className="text-sm font-semibold" style={{ color: config.color }}>{config.label}</span>
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${prioridadConfig[lead.prioridad].class}`}>
                    {prioridadConfig[lead.prioridad].label}
                  </span>
                  <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1.5">
                    {situacionConfig?.icono} {situacionConfig?.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Phone size={11} /> {lead.telefono || "Sin teléfono"}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Mail size={11} /> {lead.email || "Sin email"}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Building2 size={11} /> {ORIGEN_LABELS[lead.origen]}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 pb-2">
              <button
                onClick={llamar}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-[11px] font-semibold hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"
              >
                <Phone size={14} /> Llamar
              </button>
              <button
                onClick={abrirEmail}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20"
              >
                <Mail size={14} /> Email
              </button>
              <button
                onClick={abrirWhatsApp}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500 text-white rounded-xl text-[11px] font-semibold hover:bg-green-600 transition-all shadow-md shadow-green-500/20"
              >
                <MessageSquare size={14} /> WhatsApp
              </button>
              <button
                onClick={() => setAgendarOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-500 text-white rounded-xl text-[11px] font-semibold hover:bg-purple-600 transition-all shadow-md shadow-purple-500/20"
              >
                <Calendar size={14} /> Agendar Reunión
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg shadow-blue-500/20">
              <div className="text-[9px] text-blue-100 font-bold uppercase tracking-wider mb-1">Monto Crédito</div>
              <div className="text-lg font-bold">{formatoMoneda(lead.montoSolicitado || 0)}</div>
              <div className="text-[10px] text-blue-200 font-medium">{formatoUF(lead.montoSolicitado || 0)}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg shadow-purple-500/20">
              <div className="text-[9px] text-purple-100 font-bold uppercase tracking-wider mb-1">Valor Propiedad</div>
              <div className="text-lg font-bold">{formatoMoneda(lead.valorPropiedad || 0)}</div>
              <div className="text-[10px] text-purple-200 font-medium">{formatoUF(lead.valorPropiedad || 0)}</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-500/20">
              <div className="text-[9px] text-emerald-100 font-bold uppercase tracking-wider mb-1">Pie Disponible</div>
              <div className="text-lg font-bold">{formatoMoneda(lead.pieDisponible || 0)}</div>
              <div className="text-[10px] text-emerald-200 font-medium">{formatoUF(lead.pieDisponible || 0)}</div>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg shadow-amber-500/20">
              <div className="text-[9px] text-amber-100 font-bold uppercase tracking-wider mb-1">Banco</div>
              <div className="text-lg font-bold flex items-center gap-2">
                <Building2 size={18} />
                {lead.banco || "Sin asignar"}
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg shadow-indigo-500/20">
              <div className="text-[9px] text-indigo-100 font-bold uppercase tracking-wider mb-1">Tipo Crédito</div>
              <div className="text-lg font-bold flex items-center gap-2">
                <Home size={18} />
                {lead.tipoCredito || "Sin asignar"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-1.5 shadow-soft">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const IconoTab = tab.icono;
            return (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                  tabActiva === tab.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <IconoTab size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido de Tabs */}
      {tabActiva === "resumen" && (
        <div className="space-y-5">
          {/* Fila 1: Info Personal + Actividad Reciente */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Info Personal */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User size={16} className="text-blue-500" />
                Información Personal
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={<User size={13} />} label="Nombre completo" value={`${lead.nombre} ${lead.apellido}`} />
                <InfoRow icon={<Hash size={13} />} label="RUT" value={lead.rut} />
                <InfoRow icon={<Phone size={13} />} label="Teléfono" value={lead.telefono || "No registrado"} />
                <InfoRow icon={<Mail size={13} />} label="Email" value={lead.email || "No registrado"} />
                <InfoRow icon={<BriefcaseBusiness size={13} />} label="Situación laboral" value={situacionConfig?.label || "No definida"} />
                <InfoRow icon={<Building2 size={13} />} label="Origen" value={ORIGEN_LABELS[lead.origen]} />
                <InfoRow icon={<CreditCard size={13} />} label="En DICOM" value={lead.enDicom ? "Sí" : "No"} />
                <InfoRow icon={<DollarSign size={13} />} label="Renta mensual" value={lead.rentaMensual || "No especificada"} />
                <InfoRow icon={<Shield size={13} />} label="Cargas legales" value={lead.cargasLegales || "No especificado"} />
                <InfoRow icon={<User size={13} />} label="Estado civil" value={lead.estadoCivil || "No especificado"} />
                <InfoRow icon={<User size={13} />} label="Régimen matrimonial" value={lead.regimenMatrimonial || "No especificado"} />
                <InfoRow icon={<Calendar size={13} />} label="Fecha nacimiento" value={lead.fechaNacimiento || "No especificado"} />
                <InfoRow icon={<FileText size={13} />} label="Estudios" value={lead.estudios || "No especificado"} />
                <InfoRow icon={<Briefcase size={13} />} label="Profesión" value={lead.profesion || "No especificado"} />
                <InfoRow icon={<Home size={13} />} label="Domicilio" value={lead.domicilioParticular || "No especificado"} />
                <InfoRow icon={<MapPin size={13} />} label="Comuna/Ciudad" value={lead.comunaCiudad || "No especificado"} />
                <InfoRow icon={<DollarSign size={13} />} label="Valor arriendo" value={lead.valorArriendo ? formatoMoneda(lead.valorArriendo) : "No aplica"} />
                <InfoRow icon={<Shield size={13} />} label="AFP" value={lead.afp || "No especificado"} />
              </div>
            </div>

            {/* Actividad Reciente */}
            <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Activity size={16} className="text-purple-500" />
                Actividad Reciente
              </h3>
              <div className="space-y-3">
                {actividades.slice(0, 5).map((actividad) => {
                  const configIcono = getIconoActividad(actividad.tipo);
                  const IconoAct = configIcono.icono;
                  return (
                    <div key={actividad.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 ${configIcono.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <IconoAct size={14} className={configIcono.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-slate-700">{actividad.titulo}</div>
                        <div className="text-[10px] text-slate-400 truncate">{actividad.descripcion}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-slate-300">{formatearTiempoRelativo(actividad.fecha)}</span>
                          <span className="text-[9px] text-slate-400">• {actividad.usuario}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {actividades.length === 0 && (
                  <div className="text-center py-6">
                    <Activity size={24} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-[11px] text-slate-400">Sin actividad registrada</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fila 2: Datos del Empleador */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-emerald-500" />
              Datos del Empleador
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoRow icon={<Building2 size={13} />} label="Nombre empleador" value={lead.nombreEmpleador || "No especificado"} />
              <InfoRow icon={<Hash size={13} />} label="RUT Empresa" value={lead.rutEmpresa || "No especificado"} />
              <InfoRow icon={<Calendar size={13} />} label="Fecha ingreso" value={lead.fechaIngreso || "No especificado"} />
              <InfoRow icon={<Briefcase size={13} />} label="Cargo" value={lead.cargo || "No especificado"} />
              <InfoRow icon={<DollarSign size={13} />} label="Renta líquida" value={lead.rentaLiquida ? formatoMoneda(lead.rentaLiquida) : "No especificado"} />
              <InfoRow icon={<Building2 size={13} />} label="Banco abono renta" value={lead.bancoAbonoRenta || "No especificado"} />
              <InfoRow icon={<Calendar size={13} />} label="Fecha pago" value={lead.fechaPago || "No especificado"} />
              <InfoRow icon={<Home size={13} />} label="Dirección laboral" value={lead.direccionLaboral || "No especificado"} />
              <InfoRow icon={<MapPin size={13} />} label="Comuna/Ciudad" value={lead.comunaCiudadLaboral || "No especificado"} />
              <InfoRow icon={<Phone size={13} />} label="Teléfono fijo" value={lead.telefonoLaboralFijo || "No especificado"} />
              <InfoRow icon={<Mail size={13} />} label="Email laboral" value={lead.emailLaboral || "No especificado"} />
              <InfoRow icon={<DollarSign size={13} />} label="Otros ingresos" value={lead.otrosIngresos || "No especificado"} />
            </div>
          </div>
        </div>
      )}

      {tabActiva === "documentos" && (
        <div className="bg-white rounded-2xl border border-slate-100/80 shadow-soft overflow-hidden">
          {/* Header documentos */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Documentos del Cliente</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {docsTotal} documentos - {situacionConfig?.label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSolicitarOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-[11px] font-semibold hover:bg-amber-600 transition-colors shadow-sm"
                >
                  <Send size={13} /> Solicitar Documentos
                </button>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Upload size={13} /> Subir Documento
                </button>
              </div>
            </div>
            {/* Barra de progreso */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-500">Progreso total</span>
                <span className="text-[11px] font-bold text-slate-700">{docsAprobados}/{docsTotal} aprobados ({porcentajeDocs}%)</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeDocs}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tabla documentos */}
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documento</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {documentos.map((doc) => {
                const docConfig = estadoDocConfig[doc.estado];
                return (
                  <tr key={doc.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                          <FileText size={16} className="text-slate-500" />
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-slate-800">{doc.nombre}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-semibold text-slate-500">{doc.tipo.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative">
                        <select
                          value={doc.estado}
                          onChange={(e) => handleCambiarEstado(doc.id, e.target.value as DocumentoLead["estado"])}
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer appearance-none pr-6 bg-no-repeat bg-[right_6px_center] bg-[length:10px] ${docConfig.bg} ${docConfig.color} hover:opacity-80 transition-opacity`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`
                          }}
                        >
                          <option value="PENDIENTE">Pendiente</option>
                          <option value="EN_REVISION">En Revisión</option>
                          <option value="APROBADO">Aprobado</option>
                          <option value="RECHAZADO">Rechazado</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {doc.creadoEn.toLocaleDateString("es-CL")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handlePreview(doc)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Ver">
                          <Eye size={14} className="text-slate-400" />
                        </button>
                        <button className="p-2 hover:bg-emerald-50 rounded-lg transition-colors" title="Descargar">
                          <Download size={14} className="text-emerald-500" />
                        </button>
                        <button onClick={() => handleEliminar(doc)} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tabActiva === "actividad" && (
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-purple-500" />
            Historial de Actividad Completo
          </h3>
          <div className="space-y-4">
            {actividades.map((actividad, idx) => {
              const configIcono = getIconoActividad(actividad.tipo);
              const IconoAct = configIcono.icono;
              return (
                <div key={actividad.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 ${configIcono.bg} rounded-xl flex items-center justify-center`}>
                      <IconoAct size={16} className={configIcono.color} />
                    </div>
                    {idx < actividades.length - 1 && (
                      <div className="w-0.5 flex-1 bg-slate-100 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[12px] font-semibold text-slate-800">{actividad.titulo}</h4>
                      <span className="text-[10px] text-slate-400">{formatearTiempoRelativo(actividad.fecha)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{actividad.descripcion}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400">Por: {actividad.usuario}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400">{actividad.fecha.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {actividades.length === 0 && (
              <div className="text-center py-8">
                <Activity size={32} className="text-slate-200 mx-auto mb-3" />
                <p className="text-[12px] text-slate-400 font-medium">Sin actividad registrada</p>
                <p className="text-[10px] text-slate-300 mt-1">Las acciones se registrarán automáticamente</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tabActiva === "financiero" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-500" />
              Resumen Financiero
            </h3>
            <div className="space-y-4">
              <FinRowMoneda label="Monto Solicitado" valorCLP={lead.montoSolicitado || 0} color="blue" />
              <FinRowMoneda label="Valor Propiedad" valorCLP={lead.valorPropiedad || 0} color="purple" />
              <FinRowMoneda label="Pie Disponible" valorCLP={lead.pieDisponible || 0} color="emerald" />
              <div className="pt-3 border-t border-slate-100">
                <FinRow label="Banco" value={lead.banco || "Sin asignar"} color="amber" />
                <FinRow label="Tipo Crédito" value={lead.tipoCredito || "Sin asignar"} color="indigo" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" />
              Detalles del Crédito
            </h3>
            <div className="space-y-4">
              <FinRow label="Renta Mensual" value={lead.rentaMensual || "No especificada"} color="slate" />
              <FinRow label="Situación Laboral" value={situacionConfig?.label || "No definida"} color="slate" />
              <FinRow label="Cuenta de Ahorro" value={lead.cuentaPie ? "Sí" : "No"} color="slate" />
              <FinRow label="Complementar Renta" value={lead.complementarRenta ? "Sí" : "No"} color="slate" />
              {lead.notas && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Notas</span>
                  <p className="text-[11px] text-slate-600 mt-1">{lead.notas}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Progreso */}
      {tabActiva === "progreso" && (
        <div className="space-y-5">
          {/* Header Progreso */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-500" />
                  Progreso de tu Crédito
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{progreso.toFixed(0)}% completado</p>
              </div>
              {guardandoProgreso && (
                <span className="text-[10px] text-blue-500 flex items-center gap-1">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              )}
            </div>

            {/* Barra de Progreso */}
            <div className="mb-6">
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>

            {/* Pasos Horizontales */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-5 left-[5%] right-[5%] h-0.5 bg-slate-200" />
                <div
                  className="absolute top-5 left-[5%] h-0.5 bg-emerald-500 transition-all duration-700"
                  style={{ width: `${Math.max(0, (progreso / 100) * 90)}%` }}
                />

                {PASOS_PROGRESO.map((paso) => {
                  const esCompletado = etapaActual > paso.paso;
                  const esActual = etapaActual === paso.paso;

                  return (
                    <div
                      key={paso.paso}
                      className="relative z-10 flex flex-col items-center gap-2 cursor-pointer"
                      onClick={() => moverEtapa(paso.etapa)}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                          esActual
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100"
                            : esCompletado
                            ? "bg-emerald-500 text-white"
                            : "bg-white text-slate-400 border-2 border-slate-200 hover:border-blue-400"
                        }`}
                      >
                        {esCompletado ? <Check size={16} /> : <span className="text-[10px] font-bold">{paso.paso}</span>}
                      </div>
                      <span className={`text-[9px] font-semibold text-center max-w-[60px] leading-tight ${
                        esActual ? "text-blue-700" : esCompletado ? "text-emerald-700" : "text-slate-400"
                      }`}>
                        {paso.label}
                      </span>
                      {esActual && (
                        <span className="text-[7px] font-bold px-1.5 py-0.5 bg-blue-500 text-white rounded-full">
                          ACTUAL
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Estado actual */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <TrendingUp size={18} style={{ color: config?.color || "#64748B" }} />
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: config?.color || "#64748B" }}>
                  {config?.label || "Estado desconocido"}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Haz clic en cualquier paso para cambiar la etapa del crédito
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tabActiva === "asesor" && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <UserCheck size={16} className="text-blue-500" />
              Ejecutivo Asignado
            </h3>

            {cargandoAsesor ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : asesorAsignado ? (
              <div className="space-y-4">
                {/* Card principal del asesor */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100/60">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/20 flex-shrink-0">
                    {asesorAsignado.nombre?.[0]}{asesorAsignado.apellido?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate">
                      {asesorAsignado.nombre} {asesorAsignado.apellido}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {asesorAsignado.cargo || asesorAsignado.rol || "Ejecutivo Comercial"}
                    </div>
                  </div>
                </div>

                {/* Información de contacto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow icon={<Mail size={14} />} label="Email" value={asesorAsignado.email || "No registrado"} />
                  <InfoRow icon={<Phone size={14} />} label="Teléfono" value={asesorAsignado.telefono || "No registrado"} />
                </div>

                {/* Acciones rápidas */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {asesorAsignado.telefono && (
                    <a
                      href={`tel:${asesorAsignado.telefono}`}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-[11px] font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
                    >
                      <Phone size={13} /> Llamar
                    </a>
                  )}
                  {asesorAsignado.email && (
                    <a
                      href={`mailto:${asesorAsignado.email}`}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-[11px] font-semibold rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      <Mail size={13} /> Email
                    </a>
                  )}
                  {asesorAsignado.telefono && (
                    <a
                      href={`https://wa.me/${asesorAsignado.telefono.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-[11px] font-semibold rounded-xl hover:bg-green-600 transition-colors"
                    >
                      <MessageSquare size={13} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ) : (
              /* Sin asesor asignado */
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <UserCheck size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-600">Sin ejecutivo asignado</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Este lead aún no tiene un ejecutivo asignado.<br />
                  Puedes asignarlo desde el Pipeline.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Agendar Reunión */}
      <Dialog open={agendarOpen} onOpenChange={setAgendarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar Reunión</DialogTitle>
            <DialogDescription>Programa una reunión con {lead.nombre} {lead.apellido}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">Fecha</label>
              <input
                type="date"
                value={fechaReunion}
                onChange={(e) => setFechaReunion(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">Hora</label>
              <input
                type="time"
                value={horaReunion}
                onChange={(e) => setHoraReunion(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">Notas</label>
              <textarea
                value={notasReunion}
                onChange={(e) => setNotasReunion(e.target.value)}
                placeholder="Detalles de la reunión..."
                rows={3}
                className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAgendarOpen(false)} className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Cancelar
            </button>
            <button onClick={async () => {
              try {
                await fetch("/api/eventos", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    titulo: `Reunión con ${lead.nombre} ${lead.apellido}`,
                    fecha: fechaReunion,
                    horaInicio: horaReunion,
                    horaFin: horaReunion,
                    tipo: "reunion",
                    leadId: lead.id,
                    leadNombre: `${lead.nombre} ${lead.apellido}`,
                    descripcion: notasReunion,
                    recordatorio: true,
                  }),
                });
                toast.success("Reunión agendada", { description: `${fechaReunion} a las ${horaReunion}` });
              } catch {
                toast.error("Error al agendar");
              }
              setAgendarOpen(false);
            }} className="px-4 py-2 bg-purple-500 text-white text-[11px] font-semibold rounded-xl hover:bg-purple-600 transition-colors">
              Agendar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Cliente */}
      <Dialog open={editarOpen} onOpenChange={setEditarOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Editar Cliente</DialogTitle>
            <DialogDescription>Modifica la información de {lead.nombre} {lead.apellido}</DialogDescription>
          </DialogHeader>
          <EditarClienteForm lead={lead} onClose={() => setEditarOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Modales de Documentos */}
      <SubirDocumento open={uploadOpen} onOpenChange={setUploadOpen} leadId={lead.id} onUpload={handleUpload} />
      <VistaPreviaDocumento open={previewOpen} onOpenChange={setPreviewOpen} documento={docSeleccionado} />
      <GestionarEstado open={gestionarOpen} onOpenChange={setGestionarOpen} documento={docSeleccionado} onCambiarEstado={handleCambiarEstado} />
      <SolicitarDocumentos open={solicitarOpen} onOpenChange={setSolicitarOpen} leadId={id} />
      <ConfirmDialog
        open={eliminarOpen}
        onOpenChange={setEliminarOpen}
        title="Eliminar Documento"
        description={`¿Estás seguro de eliminar "${docSeleccionado?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleConfirmarEliminar}
      />
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-xl">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
        <div className="text-[12px] font-semibold text-slate-700 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function FinRow({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  const colorStyles: Record<string, string> = {
    blue: "text-blue-700",
    purple: "text-purple-700",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    indigo: "text-indigo-700",
    slate: "text-slate-700",
  };
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-slate-500 font-medium">{label}</span>
      <div className="text-right">
        <span className={`text-[13px] font-bold ${colorStyles[color]}`}>{value}</span>
        {sub && <span className="text-[10px] text-slate-400 ml-2">{sub}</span>}
      </div>
    </div>
  );
}

function FinRowMoneda({ label, valorCLP, color }: { label: string; valorCLP: number; color: string }) {
  const colorStyles: Record<string, string> = {
    blue: "text-blue-700",
    purple: "text-purple-700",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    indigo: "text-indigo-700",
    slate: "text-slate-700",
  };

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl">
      <span className="text-[11px] text-slate-500 font-medium">{label}</span>
      <div className="text-right">
        <div className={`text-[14px] font-bold ${colorStyles[color]}`}>
          {valorCLP > 0 ? formatoMoneda(valorCLP) : "$ 0"}
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          {valorCLP > 0 ? formatoUF(valorCLP) : "0 UF"}
        </div>
      </div>
    </div>
  );
}

function EditarClienteForm({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { actualizarLead } = useLeads();
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
  // Datos personales extendidos
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
  // Datos del empleador
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
        // Datos personales extendidos
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
        // Datos del empleador
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
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setGuardando(false);
      alert("Error al guardar los datos. Intenta nuevamente.");
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
