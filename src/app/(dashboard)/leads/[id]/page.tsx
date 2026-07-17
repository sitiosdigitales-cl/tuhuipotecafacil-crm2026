"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  FileText,
  Building2,
  Home,
  Edit,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  User,
  Upload,
  Download,
  Send,
  Copy,
  Briefcase,
  UserCheck,
  Building,
  FileCheck,
  FileX,
  FileClock,
  Eye,
  Trash2,
  Activity,
  MessageSquare as MessageSquareIcon,
} from "lucide-react";
import { ETAPAS_CONFIG, ORIGEN_LABELS } from "@/tipos";
import { FormularioLead } from "@/componentes/leads/FormularioLead";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SubirDocumento } from "@/componentes/documentos/SubirDocumento";
import { VistaPreviaDocumento } from "@/componentes/documentos/VistaPreviaDocumento";
import { GestionarEstado } from "@/componentes/documentos/GestionarEstado";
import { formatoMonedaAbreviado, formatoUF } from "@/lib/utils";
import type { Lead, DocumentoLead } from "@/tipos";

// Tipos de trabajador
type TipoTrabajador = "DEPENDIENTE" | "INDEPENDIENTE" | "EMPRESA";

// Documentos por tipo de trabajador
const DOCUMENTOS_POR_TIPO: Record<TipoTrabajador, { id: string; nombre: string; obligatorio: boolean; descripcion: string }[]> = {
  DEPENDIENTE: [
    { id: "liq-sueldo", nombre: "Últimas 6 liquidaciones de sueldo", obligatorio: true, descripcion: "Documentos que acrediten ingresos mensuales" },
    { id: "afp", nombre: "Certificado cotizaciones AFP", obligatorio: true, descripcion: "Últimos 24 meses de cotizaciones" },
    { id: "cedula", nombre: "Cédula de identidad", obligatorio: true, descripcion: "Por ambos lados" },
    { id: "antiguedad", nombre: "Certificado antigüedad laboral", obligatorio: true, descripcion: "O anexo de permanencia" },
    { id: "domicilio", nombre: "Comprobante de domicilio", obligatorio: true, descripcion: "Agua, luz, gas, internet o cartola AFP" },
    { id: "titulo", nombre: "Certificado título profesional", obligatorio: false, descripcion: "Solo si aplica" },
    { id: "dicom", nombre: "Informe DICOM", obligatorio: true, descripcion: "Desde www.conocetudeuda.cl" },
  ],
  INDEPENDIENTE: [
    { id: "carpeta-trib", nombre: "Carpeta tributaria", obligatorio: true, descripcion: "Para créditos" },
    { id: "iva", nombre: "Últimas 12 declaraciones IVA", obligatorio: false, descripcion: "Si aplica" },
    { id: "renta", nombre: "Última declaración de renta", obligatorio: true, descripcion: "Declaración del año anterior" },
    { id: "cedula", nombre: "Cédula de identidad", obligatorio: true, descripcion: "Por ambos lados" },
    { id: "dicom", nombre: "Informe DICOM", obligatorio: true, descripcion: "Desde www.conocetudeuda.cl" },
  ],
  EMPRESA: [
    { id: "carpeta-trib", nombre: "Carpeta tributaria", obligatorio: true, descripcion: "Para créditos" },
    { id: "iva", nombre: "Últimas 12 declaraciones IVA", obligatorio: true, descripcion: "Documentación fiscal" },
    { id: "balance", nombre: "Balance o estados financieros", obligatorio: true, descripcion: "Último ejercicio cerrado" },
    { id: "constitucion", nombre: "Constitución de sociedad", obligatorio: false, descripcion: "Si aplica" },
    { id: "socios", nombre: "Antecedentes comerciales socios", obligatorio: true, descripcion: "De todos los socios" },
  ],
};

const estadoConfig: Record<string, { label: string; icono: React.ReactNode; color: string; bg: string }> = {
  APROBADO: { label: "Aprobado", icono: <CheckCircle size={14} />, color: "text-emerald-600", bg: "bg-emerald-50 border border-emerald-100" },
  EN_REVISION: { label: "En Revisión", icono: <FileClock size={14} />, color: "text-amber-600", bg: "bg-amber-50 border border-amber-100" },
  RECIBIDO: { label: "Recibido", icono: <FileCheck size={14} />, color: "text-blue-600", bg: "bg-blue-50 border border-blue-100" },
  RECHAZADO: { label: "Rechazado", icono: <FileX size={14} />, color: "text-red-600", bg: "bg-red-50 border border-red-100" },
  PENDIENTE: { label: "Pendiente", icono: <AlertCircle size={14} />, color: "text-slate-400", bg: "bg-slate-50 border border-slate-100" },
};

const prioridadConfig = {
  BAJA: { label: "Baja", class: "bg-slate-100 text-slate-600" },
  MEDIA: { label: "Media", class: "bg-blue-50 text-blue-600 border border-blue-100" },
  ALTA: { label: "Alta", class: "bg-orange-50 text-orange-600 border border-orange-100" },
  URGENTE: { label: "Urgente", class: "bg-red-50 text-red-600 border border-red-100" },
};

const iconoActividad: Record<string, React.ReactNode> = {
  Llamada: <Phone size={14} />,
  Email: <Mail size={14} />,
  WhatsApp: <MessageSquare size={14} />,
  "Reunión": <Calendar size={14} />,
  "Cambio de Etapa": <ChevronRight size={14} />,
};

// Plantilla de WhatsApp
const PLANTILLA_WHATSAPP = `Hola [Nombre], 👋

Gracias por confiar en Tu Hipoteca Fácil.

Para comenzar con tu evaluación financiera y analizar las mejores alternativas de financiamiento disponibles para tu perfil, necesitamos que nos envíes la siguiente documentación según tu situación laboral.

📄 Documentación Requerida
[Documentos según tipo]

⏳ Plazo Estimado de Evaluación
Una vez recibida la totalidad de la documentación solicitada, el proceso de evaluación tiene un plazo aproximado de 24 a 72 horas hábiles.

💳 Arancel de Gestión
La preevaluación financiera y revisión inicial son completamente gratuitas.

En caso de existir alternativas viables de financiamiento y decidas avanzar con nuestra gestión comercial y bancaria, el servicio contempla un arancel equivalente al 7% del monto efectivamente financiado.

Este arancel no se cobra por adelantado ni durante el proceso de evaluación. Su pago se realiza únicamente una vez que el crédito haya sido aprobado por la institución financiera y el cliente haya aceptado continuar con la operación.

📲 Envío de Documentos
Puedes responder este mensaje adjuntando la documentación solicitada o enviarla directamente a través de WhatsApp para comenzar tu evaluación.

Quedamos atentos a tus antecedentes.

Saludos cordiales,

Equipo Tu Hipoteca Fácil
🏦 Gestión y Asesoría Financiera`;

// Actividades del lead (se cargan desde la API)
interface ActividadLead {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: Date;
  usuario: string;
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [lead, setLead] = useState<Lead | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarLead() {
      try {
        const res = await fetch(`/api/leads/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setLead({
            ...json.data,
            creadoEn: json.data.creadoEn ? new Date(json.data.creadoEn) : new Date(),
          });
        }
      } catch {
        setLead(null);
      } finally {
        setCargando(false);
      }
    }
    cargarLead();
  }, [id]);

  const [formularioOpen, setFormularioOpen] = useState(false);
  const [tipoTrabajador, setTipoTrabajador] = useState<TipoTrabajador>("DEPENDIENTE");
  const [documentos, setDocumentos] = useState<Record<string, { estado: "RECIBIDO" | "EN_REVISION" | "APROBADO" | "RECHAZADO" | "PENDIENTE"; fecha?: Date; archivoUrl?: string }>>({});
  const [docsSubidos, setDocsSubidos] = useState<DocumentoLead[]>([]);
  const [actividades, setActividades] = useState<ActividadLead[]>([]);
  const [copiado, setCopiado] = useState(false);
  const [cargandoDocs, setCargandoDocs] = useState(true);

  // Cargar documentos desde Supabase
  useEffect(() => {
    async function cargarDocumentos() {
      if (!lead) return;
      try {
        const res = await fetch(`/api/documentos?leadId=${lead.id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setDocsSubidos(json.data.map((d: Record<string, any>) => ({
            ...d,
            creadoEn: d.creadoEn ? new Date(d.creadoEn) : new Date(),
          })));
        }
      } catch {
        // Silenciar errores
      } finally {
        setCargandoDocs(false);
      }
    }
    cargarDocumentos();
  }, [lead]);

  // Cargar actividades desde Supabase
  useEffect(() => {
    async function cargarActividades() {
      if (!lead) return;
      try {
        const res = await fetch(`/api/actividades?leadId=${lead.id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setActividades(json.data.map((a: Record<string, any>) => ({
            ...a,
            fecha: a.fecha ? new Date(a.fecha) : new Date(),
          })));
        }
      } catch {
        // Silenciar errores
      }
    }
    cargarActividades();
  }, [lead]);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [gestionarOpen, setGestionarOpen] = useState(false);
  const [docSeleccionado, setDocSeleccionado] = useState<DocumentoLead | null>(null);
  const [eliminarDocOpen, setEliminarDocOpen] = useState(false);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-slate-500">Cargando lead...</span>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <User size={24} className="text-slate-300" />
        </div>
        <h2 className="text-sm font-bold text-slate-600 mb-1">Lead no encontrado</h2>
        <p className="text-[11px] text-slate-400 mb-4">El lead que buscas no existe.</p>
        <button onClick={() => router.push("/leads")} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
          Volver a Leads
        </button>
      </div>
    );
  }

  const config = ETAPAS_CONFIG[lead.etapa];

  const documentosFiltrados = DOCUMENTOS_POR_TIPO[tipoTrabajador];
  const docsAprobados = documentosFiltrados.filter(d => documentos[d.id]?.estado === "APROBADO").length;
  const docsTotal = documentosFiltrados.length;
  const porcentaje = Math.round((docsAprobados / docsTotal) * 100);

  const handleBack = () => {
    router.push("/leads");
  };

  const handleSubmitLead = (_data: Partial<Lead>) => {
    setFormularioOpen(false);
  };

  const toggleEstado = (docId: string) => {
    setDocumentos(prev => {
      const actual = prev[docId]?.estado || "PENDIENTE";
      const siguiente = actual === "PENDIENTE" ? "RECIBIDO" :
                        actual === "RECIBIDO" ? "EN_REVISION" :
                        actual === "EN_REVISION" ? "APROBADO" : "PENDIENTE";
      return {
        ...prev,
        [docId]: { estado: siguiente, fecha: siguiente !== "PENDIENTE" ? new Date() : undefined }
      };
    });
  };

  const generarPlantilla = () => {
    const docsLista = documentosFiltrados
      .map(d => `${d.obligatorio ? "✅" : "⚪"} ${d.nombre}${d.descripcion ? ` - ${d.descripcion}` : ""}`)
      .join("\n");

    return PLANTILLA_WHATSAPP
      .replace("[Nombre]", lead.nombre)
      .replace("[Documentos según tipo]", docsLista);
  };

  const copiarPlantilla = () => {
    navigator.clipboard.writeText(generarPlantilla());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const abrirWhatsApp = () => {
    const texto = encodeURIComponent(generarPlantilla());
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  };

  const handleUploadDoc = async (nuevoDoc: Omit<DocumentoLead, "id" | "creadoEn">) => {
    try {
      const res = await fetch("/api/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          leadNombre: `${lead.nombre} ${lead.apellido}`,
          nombre: nuevoDoc.nombre,
          tipo: nuevoDoc.tipo,
          estado: nuevoDoc.estado || "PENDIENTE",
          archivoUrl: nuevoDoc.archivoUrl || null,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setDocsSubidos((prev) => [{
          ...json.data,
          creadoEn: new Date(json.data.creadoEn),
        }, ...prev]);
      }
    } catch {
      // Fallback local
      const doc: DocumentoLead = {
        ...nuevoDoc,
        id: `doc-${Date.now()}`,
        creadoEn: new Date(),
      };
      setDocsSubidos((prev) => [doc, ...prev]);
    }
  };

  const handleDownloadDoc = (doc: DocumentoLead) => {
    if (doc.archivoUrl) {
      window.open(doc.archivoUrl, "_blank");
    }
  };

  const handlePreviewDoc = (doc: DocumentoLead) => {
    setDocSeleccionado(doc);
    setPreviewOpen(true);
  };

  const handleGestionarDoc = (doc: DocumentoLead) => {
    setDocSeleccionado(doc);
    setGestionarOpen(true);
  };

  const handleEliminarDoc = (doc: DocumentoLead) => {
    setDocSeleccionado(doc);
    setEliminarDocOpen(true);
  };

  const handleConfirmarEliminarDoc = async () => {
    if (docSeleccionado) {
      try {
        await fetch(`/api/documentos/${docSeleccionado.id}`, { method: "DELETE" });
      } catch {
        // Continuar con la eliminación local
      }
      setDocsSubidos((prev) => prev.filter((d) => d.id !== docSeleccionado.id));
      setDocSeleccionado(null);
    }
  };

  const handleCambiarEstadoDoc = async (docId: string, nuevoEstado: DocumentoLead["estado"], _comentario?: string) => {
    try {
      await fetch(`/api/documentos/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
    } catch {
      // Continuar con la actualización local
    }
    setDocsSubidos((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, estado: nuevoEstado } : d))
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm">
              {lead.nombre[0]}{lead.apellido[0]}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">{lead.nombre} {lead.apellido}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[11px] text-slate-400 font-medium">{lead.rut}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="text-[11px] font-semibold text-slate-700">{config.label}</span>
                </div>
                <span className={`text-[9px] font-semibold px-2.5 py-1 rounded-lg ${prioridadConfig[lead.prioridad].class}`}>
                  {prioridadConfig[lead.prioridad].label}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFormularioOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <Edit size={14} /> Editar
          </button>
          <a href={`tel:${lead.telefono}`} className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 transition-colors">
            <Phone size={14} /> Llamar
          </a>
          <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 px-4 py-2.5 gradient-primary text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15">
            <Mail size={14} /> Email
          </a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Columna Izquierda */}
        <div className="col-span-2 space-y-5">
          {/* Datos de Contacto */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Datos de Contacto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Phone size={16} className="text-slate-500" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Teléfono</div>
                  <div className="text-[12px] font-semibold text-slate-800">{lead.telefono || "No registrado"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Mail size={16} className="text-slate-500" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Email</div>
                  <div className="text-[12px] font-semibold text-slate-800">{lead.email || "No registrado"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Building2 size={16} className="text-slate-500" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Origen</div>
                  <div className="text-[12px] font-semibold text-slate-800">{ORIGEN_LABELS[lead.origen]}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <User size={16} className="text-slate-500" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Ejecutivo</div>
                  <div className="text-[12px] font-semibold text-slate-800">{lead.nombreEjecutivo || "Sin asignar"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Datos Financieros */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Datos Financieros</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4">
                <div className="text-[9px] text-blue-500 font-medium uppercase tracking-wider mb-1">Monto Solicitado</div>
                <div className="text-xl font-bold text-blue-700">{formatoMonedaAbreviado(lead.montoSolicitado || 0)}</div>
                <div className="text-[10px] text-blue-500 font-medium">{formatoUF(lead.montoSolicitado || 0)}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4">
                <div className="text-[9px] text-purple-500 font-medium uppercase tracking-wider mb-1">Valor Propiedad</div>
                <div className="text-xl font-bold text-purple-700">{formatoMonedaAbreviado(lead.valorPropiedad || 0)}</div>
                <div className="text-[10px] text-purple-500 font-medium">{formatoUF(lead.valorPropiedad || 0)}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4">
                <div className="text-[9px] text-emerald-500 font-medium uppercase tracking-wider mb-1">Pie Disponible</div>
                <div className="text-xl font-bold text-emerald-700">{formatoMonedaAbreviado(lead.pieDisponible || 0)}</div>
                <div className="text-[10px] text-emerald-500 font-medium">{formatoUF(lead.pieDisponible || 0)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Building2 size={16} className="text-slate-400" />
                <div>
                  <div className="text-[9px] text-slate-400 uppercase">Banco</div>
                  <div className="text-[11px] font-semibold text-slate-700">{lead.banco || "No seleccionado"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Home size={16} className="text-slate-400" />
                <div>
                  <div className="text-[9px] text-slate-400 uppercase">Tipo Crédito</div>
                  <div className="text-[11px] font-semibold text-slate-700">{lead.tipoCredito || "No seleccionado"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Documentos Subidos */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Documentos Subidos</h3>
              <button
                onClick={() => setUploadOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-semibold hover:bg-blue-100 transition-colors"
              >
                <Upload size={12} /> Subir
              </button>
            </div>

            {cargandoDocs ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-[11px] text-slate-500">Cargando documentos...</p>
              </div>
            ) : docsSubidos.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText size={20} className="text-slate-300" />
                </div>
                <p className="text-[11px] text-slate-500">No hay documentos subidos aún</p>
                <p className="text-[9px] text-slate-400 mt-1">Haz clic en "Subir" para agregar documentos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {docsSubidos.map((doc) => {
                  const configDoc = estadoConfig[doc.estado];
                  return (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors group">
                      <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                        <FileText size={16} className="text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-slate-800 truncate">{doc.nombre}</div>
                        <div className="text-[9px] text-slate-400">{doc.creadoEn.toLocaleDateString("es-CL")}</div>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full ${configDoc.bg} ${configDoc.color}`}>
                        {configDoc.icono}
                        {configDoc.label}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {doc.archivoUrl && (
                          <button
                            onClick={() => handleDownloadDoc(doc)}
                            className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Descargar"
                          >
                            <Download size={12} className="text-blue-500" />
                          </button>
                        )}
                        <button
                          onClick={() => handlePreviewDoc(doc)}
                          className="p-1.5 hover:bg-white rounded-lg transition-colors"
                          title="Vista previa"
                        >
                          <Eye size={12} className="text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleGestionarDoc(doc)}
                          className="p-1.5 hover:bg-white rounded-lg transition-colors"
                          title="Gestionar"
                        >
                          <MessageSquareIcon size={12} className="text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleEliminarDoc(doc)}
                          className="p-1.5 hover:bg-white rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={12} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historial de Actividades */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Historial de Actividades</h3>
            {actividades.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Activity size={16} className="text-slate-300" />
                </div>
                <p className="text-[10px] text-slate-400">Sin actividades registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actividades.map((actividad, i) => (
                  <div key={actividad.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                        {iconoActividad[actividad.tipo] || <Activity size={14} />}
                      </div>
                      {i < actividades.length - 1 && <div className="w-px h-full bg-slate-200 mt-2" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-semibold text-slate-800">{actividad.tipo}</div>
                        <div className="text-[9px] text-slate-400 flex items-center gap-1">
                          <Clock size={9} /> {actividad.fecha.toLocaleDateString("es-CL")}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{actividad.descripcion}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">por {actividad.usuario}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="space-y-5">
          {/* Checklist de Documentos */}
          <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Documentos Requeridos</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {docsAprobados}/{docsTotal}
                </span>
              </div>

              {/* Selector de tipo de trabajador */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => setTipoTrabajador("DEPENDIENTE")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold transition-colors ${
                    tipoTrabajador === "DEPENDIENTE"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <UserCheck size={12} />
                  Dependiente
                </button>
                <button
                  onClick={() => setTipoTrabajador("INDEPENDIENTE")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold transition-colors ${
                    tipoTrabajador === "INDEPENDIENTE"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Briefcase size={12} />
                  Independiente
                </button>
                <button
                  onClick={() => setTipoTrabajador("EMPRESA")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold transition-colors ${
                    tipoTrabajador === "EMPRESA"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Building size={12} />
                  Empresa
                </button>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="px-4 py-3 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] text-slate-400 font-medium">Progreso de documentación</span>
                <span className="text-[10px] font-bold text-slate-700">{porcentaje}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>

            {/* Lista de documentos */}
            <div className="p-3 space-y-1.5 max-h-[400px] overflow-y-auto">
              {documentosFiltrados.map((doc) => {
                const estado = documentos[doc.id]?.estado || "PENDIENTE";
                const configEstado = estadoConfig[estado];
                const docSubido = docsSubidos.find(d => d.tipo === doc.id || d.nombre === doc.nombre);
                const tieneArchivo = docSubido?.archivoUrl || documentos[doc.id]?.archivoUrl;

                return (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all hover:shadow-sm ${configEstado.bg}`}
                  >
                    <div className={`${configEstado.color}`}>
                      {configEstado.icono}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-slate-800 flex items-center gap-1">
                        {doc.nombre}
                        {doc.obligatorio && <span className="text-red-400">*</span>}
                      </div>
                      <div className="text-[8px] text-slate-400 truncate">{doc.descripcion}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded ${configEstado.color} bg-white/50`}>
                        {configEstado.label}
                      </span>
                      {/* Botones de acción */}
                      <div className="flex items-center gap-0.5">
                        <label
                          className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Subir"
                        >
                          <Upload size={10} className="text-blue-500" />
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setDocSeleccionado({ id: doc.id, nombre: doc.nombre, tipo: doc.id, leadId: "", estado: "PENDIENTE", creadoEn: new Date() } as any);
                                setUploadOpen(true);
                              }
                            }}
                          />
                        </label>
                        {tieneArchivo && (
                          <>
                            <button
                              onClick={() => setDocSeleccionado({ id: doc.id, nombre: doc.nombre, tipo: doc.id as any, archivoUrl: tieneArchivo, leadId: lead.id, leadNombre: lead.nombre, estado: estado as any, creadoEn: new Date() })}
                              className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors"
                              title="Ver"
                            >
                              <Eye size={10} className="text-emerald-500" />
                            </button>
                            <a
                              href={tieneArchivo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors"
                              title="Descargar"
                            >
                              <Download size={10} className="text-purple-500" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Acciones de documentos */}
            <div className="p-3 border-t border-slate-100 space-y-2">
              <button
                onClick={() => setUploadOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-slate-300 rounded-xl text-[10px] text-slate-500 font-medium hover:bg-slate-50 transition-colors"
              >
                <Upload size={12} /> Subir Documento
              </button>
            </div>
          </div>

          {/* Plantilla WhatsApp */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Send size={14} className="text-white" />
              </div>
              <div>
                <h4 className="text-[12px] font-bold">Solicitar Documentos</h4>
                <p className="text-[9px] text-emerald-100">Enviar plantilla por WhatsApp</p>
              </div>
            </div>
            <p className="text-[10px] text-emerald-100 mb-3 leading-relaxed">
              Envía la lista completa de documentos requeridos según el tipo de trabajador seleccionado.
            </p>
            <div className="flex gap-2">
              <button
                onClick={abrirWhatsApp}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white text-emerald-600 rounded-xl text-[10px] font-bold hover:bg-emerald-50 transition-colors"
              >
                <MessageSquare size={12} /> WhatsApp
              </button>
              <button
                onClick={copiarPlantilla}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/20 rounded-xl text-[10px] font-semibold hover:bg-white/30 transition-colors"
              >
                {copiado ? <CheckCircle size={12} /> : <Copy size={12} />}
                {copiado ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>

          {/* Próximas Acciones */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100/80">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Próximas Acciones</h3>
            <div className="space-y-2">
              <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100/50">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={11} className="text-blue-500" />
                  <span className="text-[9px] font-semibold text-blue-700">Reunión Pendiente</span>
                </div>
                <div className="text-[10px] text-slate-700">Revisión de condiciones bancarias</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Mañana, 10:00 AM</div>
              </div>
              {porcentaje < 100 && (
                <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={11} className="text-amber-500" />
                    <span className="text-[9px] font-semibold text-amber-700">Documentos Pendientes</span>
                  </div>
                  <div className="text-[10px] text-slate-700">Faltan {docsTotal - docsAprobados} documentos</div>
                </div>
              )}
            </div>
          </div>

          {/* Notas */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100/80">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Notas</h3>
            <div className="text-[10px] text-slate-600 leading-relaxed">
              {lead.notas || "Sin notas registradas para este lead."}
            </div>
            <button className="w-full mt-3 py-2 bg-slate-100 rounded-xl text-[10px] text-slate-600 font-medium hover:bg-slate-200 transition-colors">
              + Agregar Nota
            </button>
          </div>
        </div>
      </div>

      {/* Formulario de Edición */}
      <FormularioLead
        open={formularioOpen}
        onOpenChange={setFormularioOpen}
        lead={lead}
        onSubmit={handleSubmitLead}
      />

      {/* Modal Upload */}
      <SubirDocumento
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        leadId={lead.id}
        leadNombre={`${lead.nombre} ${lead.apellido}`}
        onUpload={handleUploadDoc}
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
        onCambiarEstado={handleCambiarEstadoDoc}
      />

      {/* Dialog Eliminar */}
      <ConfirmDialog
        open={eliminarDocOpen}
        onOpenChange={setEliminarDocOpen}
        title="Eliminar Documento"
        description={`¿Estás seguro de eliminar "${docSeleccionado?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleConfirmarEliminarDoc}
      />
    </div>
  );
}
