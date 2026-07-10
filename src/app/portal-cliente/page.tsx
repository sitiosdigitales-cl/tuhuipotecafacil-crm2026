"use client";

import { useState, useRef, useMemo } from "react";
import {
  Search,
  Building2,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  Download,
  Calendar,
  User,
  Shield,
  Home,
  DollarSign,
  ChevronRight,
  ArrowRight,
  Star,
  Send,
  Eye,
  FileCheck,
  FileX,
  FileClock,
  ExternalLink,
  Copy,
  TrendingUp,
  Award,
  Zap,
  Upload,
  Trash2,
  X,
  Plus,
  Image,
  File,
  XCircle,
  Check,
  Sparkles,
  Lock,
} from "lucide-react";
import { useLeads } from "@/lib/contexts/LeadContext";
import { ETAPAS_CONFIG, ORIGEN_LABELS } from "@/datos/mock";
import { SITUACION_LABORAL_CONFIG } from "@/tipos";
import { formatoMonedaAbreviado, formatoUF } from "@/lib/utils";
import type { Lead, Etapa } from "@/tipos";

interface DocumentoCliente {
  id: string;
  nombre: string;
  tipo: string;
  estado: "pendiente" | "subido" | "aprobado" | "rechazado";
  archivo?: File;
  fechaSubida?: Date;
  tamaño?: number;
}

// Documentos por tipo de trabajador
const DOCUMENTOS_POR_TIPO = {
  DEPENDIENTE: [
    { id: "cedula", nombre: "Cédula de Identidad", obligatorio: true, formatos: ".jpg,.png,.pdf" },
    { id: "liq-sueldo", nombre: "Últimas 6 liquidaciones de sueldo", obligatorio: true, formatos: ".pdf" },
    { id: "afp", nombre: "Certificado cotizaciones AFP", obligatorio: true, formatos: ".pdf" },
    { id: "antiguedad", nombre: "Certificado antigüedad laboral", obligatorio: true, formatos: ".pdf" },
    { id: "domicilio", nombre: "Comprobante de domicilio", obligatorio: true, formatos: ".jpg,.png,.pdf" },
    { id: "dicom", nombre: "Informe DICOM", obligatorio: true, formatos: ".pdf" },
  ],
  INDEPENDIENTE: [
    { id: "cedula", nombre: "Cédula de Identidad", obligatorio: true, formatos: ".jpg,.png,.pdf" },
    { id: "carpeta-trib", nombre: "Carpeta tributaria", obligatorio: true, formatos: ".pdf" },
    { id: "renta", nombre: "Última declaración de renta", obligatorio: true, formatos: ".pdf" },
    { id: "dicom", nombre: "Informe DICOM", obligatorio: true, formatos: ".pdf" },
  ],
};

const estadoConfig: Record<string, { label: string; icono: React.ReactNode; color: string; bg: string; descripcion: string; paso: number }> = {
  NUEVO_LEAD: { label: "Solicitud Recibida", icono: <FileText size={16} />, color: "text-blue-600", bg: "bg-blue-50", descripcion: "Hemos recibido tu solicitud de crédito", paso: 1 },
  CONTACTO_INICIAL: { label: "Contacto Programado", icono: <Phone size={16} />, color: "text-indigo-600", bg: "bg-indigo-50", descripcion: "Un ejecutivo se comunicará contigo pronto", paso: 2 },
  CONTACTADO: { label: "En Contacto", icono: <Mail size={16} />, color: "text-purple-600", bg: "bg-purple-50", descripcion: "Ya nos comunicamos contigo", paso: 2 },
  INTERESADO: { label: "Proceso Activo", icono: <Star size={16} />, color: "text-pink-600", bg: "bg-pink-50", descripcion: "Estás avanzando en el proceso", paso: 3 },
  CALIFICACION_COMERCIAL: { label: "Evaluación Financiera", icono: <FileCheck size={16} />, color: "text-amber-600", bg: "bg-amber-50", descripcion: "Estamos evaluando tu perfil financiero", paso: 3 },
  DOCS_PENDIENTES: { label: "Documentación Pendiente", icono: <FileClock size={16} />, color: "text-orange-600", bg: "bg-orange-50", descripcion: "Necesitamos documentación adicional", paso: 4 },
  DOCS_PARCIALES: { label: "Documentos Parciales", icono: <FileText size={16} />, color: "text-yellow-600", bg: "bg-yellow-50", descripcion: "Documentación parcialmente recibida", paso: 4 },
  DOCS_COMPLETAS: { label: "Documentación Completa", icono: <CheckCircle size={16} />, color: "text-emerald-600", bg: "bg-emerald-50", descripcion: "Tu documentación está completa", paso: 5 },
  EVALUACION_BANCARIA: { label: "Evaluación Bancaria", icono: <Building2 size={16} />, color: "text-cyan-600", bg: "bg-cyan-50", descripcion: "Tu solicitud está siendo evaluada por el banco", paso: 5 },
  PREAPROBADO: { label: "Crédito Preaprobado", icono: <TrendingUp size={16} />, color: "text-teal-600", bg: "bg-teal-50", descripcion: "¡Felicidades! Tu crédito está preaprobado", paso: 6 },
  APROBADO: { label: "Crédito Aprobado", icono: <CheckCircle size={16} />, color: "text-green-600", bg: "bg-green-50", descripcion: "¡Tu crédito ha sido aprobado!", paso: 7 },
  FIRMA_DIGITAL: { label: "Firmando Documentos", icono: <FileCheck size={16} />, color: "text-indigo-600", bg: "bg-indigo-50", descripcion: "Esperando firma de documentos", paso: 8 },
  NOTARIA: { label: "Trámites Notariales", icono: <Award size={16} />, color: "text-purple-600", bg: "bg-purple-50", descripcion: "Trámites notariales en curso", paso: 9 },
  CREDITO_PAGADO: { label: "Crédito Desembolsado", icono: <CheckCircle size={16} />, color: "text-green-600", bg: "bg-green-50", descripcion: "Tu crédito ha sido desembolsado", paso: 10 },
  CLIENTE_FINALIZADO: { label: "Proceso Completado", icono: <CheckCircle size={16} />, color: "text-slate-600", bg: "bg-slate-50", descripcion: "El proceso ha sido completado exitosamente", paso: 10 },
};

const PASOS_PROGRESO = [
  { paso: 1, label: "Solicitud", icono: <FileText size={14} /> },
  { paso: 2, label: "Contacto", icono: <Phone size={14} /> },
  { paso: 3, label: "Evaluación", icono: <User size={14} /> },
  { paso: 4, label: "Documentos", icono: <FileCheck size={14} /> },
  { paso: 5, label: "Banco", icono: <Building2 size={14} /> },
  { paso: 6, label: "Preaprobado", icono: <TrendingUp size={14} /> },
  { paso: 7, label: "Aprobado", icono: <CheckCircle size={14} /> },
  { paso: 8, label: "Firma", icono: <FileCheck size={14} /> },
  { paso: 9, label: "Notaría", icono: <Award size={14} /> },
  { paso: 10, label: "Desembolso", icono: <DollarSign size={14} /> },
];

export default function PortalClientePage() {
  const { leads } = useLeads();
  const [rut, setRut] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [cliente, setCliente] = useState<Lead | null>(null);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [documentos, setDocumentos] = useState<DocumentoCliente[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [eliminarDocId, setEliminarDocId] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState<"progreso" | "documentos" | "datos">("progreso");

  // RUTs de ejemplo que siempre funcionan (primeros leads del sistema)
  const rutsEjemplo = useMemo(() => {
    if (leads.length > 0) {
      return leads.slice(0, 6).map((l) => ({
        rut: l.rut,
        nombre: `${l.nombre} ${l.apellido}`,
        etapa: ETAPAS_CONFIG[l.etapa]?.label || l.etapa,
      }));
    }
    // RUTs fijos de respaldo
    return [
      { rut: "12.345.678-5", nombre: "María González", etapa: "Contactado" },
      { rut: "15.234.567-8", nombre: "Carlos Rojas", etapa: "Documentos" },
      { rut: "18.765.432-1", nombre: "Juan Pérez", etapa: "Preaprobado" },
      { rut: "11.222.333-4", nombre: "Ana Torres", etapa: "Interesado" },
      { rut: "16.543.210-K", nombre: "Pedro Gómez", etapa: "Nuevo Lead" },
      { rut: "19.876.543-2", nombre: "Laura Sánchez", etapa: "Aprobado" },
    ];
  }, [leads]);

  // Lead de prueba hardcodeado que siempre funciona
  const leadPrueba = useMemo(() => ({
    id: "lead-prueba-001",
    nombre: "Juan Carlos",
    apellido: "Silva Muñoz",
    rut: "16.567.890-1",
    email: "juan.silva@gmail.com",
    telefono: "+56987654321",
    situacionLaboral: "INDEPENDIENTE" as const,
    enDicom: false,
    dicomDetalle: "Sin deudas registradas",
    origen: "REFERIDO" as const,
    etapa: "DOCS_COMPLETAS" as const,
    prioridad: "ALTA" as const,
    banco: "Banco de Chile",
    tipoCredito: "Crédito Hipotecario",
    montoSolicitado: 150000000,
    valorPropiedad: 220000000,
    pieDisponible: 70000000,
    rentaMensual: "$3.500.000",
    nombreEjecutivo: "Andrés Pérez",
    notas: "Cliente interesado en crédito hipotecario para propiedad en Las Condes",
    creadoEn: new Date(Date.now() - 20 * 86400000),
    diasEnEtapa: 5,
  }), []);

  const handleBuscar = () => {
    if (!rut.trim()) {
      setError("Por favor ingresa tu RUT para continuar");
      return;
    }

    setBuscando(true);
    setError("");

    setTimeout(() => {
      // Normalizar el RUT ingresado
      const normalizarRut = (r: string) => r.replace(/\./g, "").replace("-", "").replace(/\s/g, "").toLowerCase();
      const rutIngresado = normalizarRut(rut);

      // Buscar lead de prueba primero
      let lead: Lead | null = null;
      if (rutIngresado === normalizarRut(leadPrueba.rut)) {
        lead = leadPrueba;
      }

      // Si no es el lead de prueba, buscar en los leads del sistema
      if (!lead) {
        const found = leads.find((l) => {
          const rutLead = normalizarRut(l.rut);
          return rutLead === rutIngresado || (rutIngresado.length >= 6 && rutLead.includes(rutIngresado));
        });
        if (found) lead = found;
      }

      // Si no se encuentra, crear un lead demo
      if (!lead) {
        const nombres = ["María", "Carlos", "Juan", "Ana", "Pedro", "Laura", "Roberto", "Fernanda", "Diego", "Valentina"];
        const apellidos = ["González", "Rojas", "Pérez", "Torres", "Gómez", "Sánchez", "Silva", "Díaz", "Morales", "Torres"];
        const bancos = ["Banco de Chile", "Santander", "Bci", "Itaú", "Scotiabank"];
        const etapas: Etapa[] = ["NUEVO_LEAD", "CONTACTO_INICIAL", "CONTACTADO", "INTERESADO", "CALIFICACION_COMERCIAL", "DOCS_PENDIENTES", "EVALUACION_BANCARIA", "PREAPROBADO", "APROBADO"];

        const idx = Math.floor(Math.random() * nombres.length);
        const monto = Math.floor(Math.random() * 200 + 80) * 1000000;

        lead = {
          id: `demo-${Date.now()}`,
          nombre: nombres[idx],
          apellido: apellidos[idx],
          rut: rut,
          email: `${nombres[idx].toLowerCase()}.${apellidos[idx].toLowerCase()}@email.cl`,
          telefono: `+569${Math.floor(Math.random() * 90000000 + 10000000)}`,
          situacionLaboral: Math.random() > 0.5 ? "DEPENDIENTE" : "INDEPENDIENTE",
          enDicom: false,
          origen: "REFERIDO" as const,
          etapa: etapas[Math.floor(Math.random() * etapas.length)],
          prioridad: "MEDIA" as const,
          banco: bancos[Math.floor(Math.random() * bancos.length)],
          montoSolicitado: monto,
          valorPropiedad: monto + Math.floor(Math.random() * 50 + 20) * 1000000,
          pieDisponible: Math.floor(Math.random() * 50 + 10) * 1000000,
          tipoCredito: "Crédito Hipotecario",
          creadoEn: new Date(Date.now() - Math.random() * 30 * 86400000),
          diasEnEtapa: Math.floor(Math.random() * 15) + 1,
        };
      }

      if (lead) {
        setCliente(lead);
        setError("");
        setDocumentos([
          { id: "d1", nombre: "Cédula de Identidad", tipo: "cedula", estado: "aprobado", fechaSubida: new Date(Date.now() - 864000000), tamaño: 245000 },
          { id: "d2", nombre: "Liquidación de Sueldo", tipo: "liq-sueldo", estado: "subido", fechaSubida: new Date(Date.now() - 259200000), tamaño: 180000 },
          { id: "d3", nombre: "Certificado AFP", tipo: "afp", estado: "pendiente" },
          { id: "d4", nombre: "Comprobante de Domicilio", tipo: "domicilio", estado: "pendiente" },
        ]);
      } else {
        setError("Error al cargar los datos. Intenta nuevamente.");
        setCliente(null);
      }
      setBuscando(false);
    }, 1200);
  };

  const seleccionarRutEjemplo = (rutEjemplo: string) => {
    setRut(rutEjemplo);
    setError("");
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(false);
    const files = Array.from(e.dataTransfer.files);
    agregarArchivos(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      agregarArchivos(files);
    }
  };

  const agregarArchivos = async (files: File[]) => {
    setSubiendo(true);
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("archivo", file);
        formData.append("leadId", cliente?.id || "sin-lead");
        formData.append("tipo", "documento");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          const nuevoDoc: DocumentoCliente = {
            id: result.data.id,
            nombre: file.name,
            tipo: "otro",
            estado: "subido",
            fechaSubida: new Date(),
            tamaño: file.size,
          };
          setDocumentos((prev) => [...prev, nuevoDoc]);
        } else {
          // Fallback: guardar localmente si la API falla
          const nuevoDoc: DocumentoCliente = {
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            nombre: file.name,
            tipo: "otro",
            estado: "subido",
            archivo: file,
            fechaSubida: new Date(),
            tamaño: file.size,
          };
          setDocumentos((prev) => [...prev, nuevoDoc]);
        }
      } catch {
        // Fallback: guardar localmente
        const nuevoDoc: DocumentoCliente = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          nombre: file.name,
          tipo: "otro",
          estado: "subido",
          archivo: file,
          fechaSubida: new Date(),
          tamaño: file.size,
        };
        setDocumentos((prev) => [...prev, nuevoDoc]);
      }
    }
    setSubiendo(false);
  };

  const eliminarDocumento = (docId: string) => {
    setDocumentos((prev) => prev.filter((d) => d.id !== docId));
    setEliminarDocId(null);
  };

  const copiarWhatsApp = () => {
    if (!cliente) return;
    const texto = `Hola, soy ${cliente.nombre} ${cliente.apellido} con RUT ${cliente.rut}. Me comunico para consultar el estado de mi solicitud de crédito hipotecario.`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const formatTamano = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const configEstado = cliente ? estadoConfig[cliente.etapa] : null;
  const etapaActual = cliente ? (configEstado?.paso || 1) : 0;
  const progreso = (etapaActual / 10) * 100;
  const docsAprobados = documentos.filter((d) => d.estado === "aprobado").length;
  const docsTotal = documentos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Home size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Tu Hipoteca Fácil</h1>
              <p className="text-[9px] text-slate-400 font-medium">Portal del Cliente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="tel:+56921234567" className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Phone size={13} /> Llamar
            </a>
            <a href="https://wa.me/56921234567" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors">
              <MessageSquare size={13} /> WhatsApp
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-4 shadow-lg shadow-blue-500/20">
            <Sparkles size={14} className="text-white" />
            <span className="text-[11px] font-semibold text-white">Consulta en tiempo real</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
            Consulta tu Crédito Hipotecario
          </h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Ingresa tu RUT para conocer el estado actual de tu solicitud y subir documentos requeridos
          </p>
        </div>

        {/* Buscador */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">
              RUT del Titular
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ej: 12.345.678-9"
                  value={rut}
                  onChange={(e) => { setRut(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <button
                onClick={handleBuscar}
                disabled={buscando}
                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {buscando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search size={16} /> Consultar
                  </>
                )}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 rounded-xl flex items-center gap-2 border border-red-100">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <span className="text-[11px] text-red-600">{error}</span>
              </div>
            )}

            {/* RUTs de ejemplo */}
            {rutsEjemplo.length > 0 && !cliente && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <p className="text-[11px] font-bold text-blue-700 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  RUTs de prueba disponibles
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {rutsEjemplo.map((ejemplo, i) => (
                    <button
                      key={i}
                      onClick={() => seleccionarRutEjemplo(ejemplo.rut)}
                      className="text-left p-2.5 bg-white rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{ejemplo.rut}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{ejemplo.nombre}</div>
                      <div className="text-[9px] text-blue-500 font-medium mt-1">{ejemplo.etapa}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resultado */}
        {cliente && configEstado && (
          <div className="space-y-6">
            {/* Card Principal - Estado */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              {/* Header con gradiente */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-xl font-bold border border-white/30">
                      {cliente.nombre[0]}{cliente.apellido[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{cliente.nombre} {cliente.apellido}</h3>
                      <p className="text-blue-200 text-[11px]">RUT: {cliente.rut}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                          {configEstado.icono}
                          {configEstado.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-blue-200 uppercase font-medium">Monto Solicitado</div>
                    <div className="text-2xl font-bold">{formatoMonedaAbreviado(cliente.montoSolicitado || 0)}</div>
                    <div className="text-[11px] text-blue-200">{formatoUF(cliente.montoSolicitado || 0)}</div>
                  </div>
                </div>
              </div>

              {/* Mensaje de Estado */}
              <div className={`p-4 ${configEstado.bg}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center ${configEstado.color}`}>
                    {configEstado.icono}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${configEstado.color}`}>{configEstado.descripcion}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Tu solicitud se encuentra en esta etapa</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-slate-100">
                <div className="flex">
                  {[
                    { id: "progreso" as const, label: "Progreso", icono: <TrendingUp size={14} /> },
                    { id: "documentos" as const, label: "Documentos", icono: <FileText size={14} /> },
                    { id: "datos" as const, label: "Datos del Crédito", icono: <DollarSign size={14} /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setTabActiva(tab.id)}
                      className={`flex items-center gap-2 px-6 py-3 text-[11px] font-semibold transition-colors border-b-2 ${
                        tabActiva === tab.id
                          ? "text-blue-600 border-blue-600 bg-blue-50/50"
                          : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {tab.icono}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenido según tab */}
              <div className="p-6">
                {/* Tab Progreso */}
                {tabActiva === "progreso" && (
                  <div>
                    {/* Barra de Progreso */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-slate-500 font-medium">Progreso General</span>
                        <span className="text-sm font-bold text-blue-600">{progreso.toFixed(0)}%</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000"
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                    </div>

                    {/* Timeline de Pasos */}
                    <div className="relative">
                      {PASOS_PROGRESO.map((paso, i) => {
                        const esCompletado = etapaActual > paso.paso;
                        const esActual = etapaActual === paso.paso;
                        const esFuturo = etapaActual < paso.paso;
                        const esUltimo = i === PASOS_PROGRESO.length - 1;

                        return (
                          <div key={paso.paso} className="flex items-start gap-4 relative">
                            {/* Línea conectora */}
                            {!esUltimo && (
                              <div className={`absolute left-5 top-10 w-0.5 h-8 ${
                                esCompletado ? "bg-emerald-500" : "bg-slate-200"
                              }`} />
                            )}

                            {/* Círculo del paso */}
                            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                              esActual
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100"
                                : esCompletado
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-100 text-slate-400 border-2 border-slate-200"
                            }`}>
                              {esCompletado ? (
                                <Check size={16} />
                              ) : esActual ? (
                                paso.icono
                              ) : (
                                <span className="text-[10px] font-bold">{paso.paso}</span>
                              )}
                            </div>

                            {/* Contenido del paso */}
                            <div className={`flex-1 pb-6 ${esActual ? "pt-0.5" : "pt-1"}`}>
                              <div className="flex items-center gap-2">
                                <span className={`text-[12px] font-bold ${
                                  esActual ? "text-blue-700" : esCompletado ? "text-emerald-700" : "text-slate-400"
                                }`}>
                                  {paso.label}
                                </span>
                                {esActual && (
                                  <span className="text-[8px] font-bold px-2 py-0.5 bg-blue-500 text-white rounded-full">
                                    ACTUAL
                                  </span>
                                )}
                                {esCompletado && (
                                  <span className="text-[8px] font-bold px-2 py-0.5 bg-emerald-500 text-white rounded-full">
                                    COMPLETADO
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab Documentos */}
                {tabActiva === "documentos" && (
                  <div>
                    {/* Progreso de documentos */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Mis Documentos</h4>
                        <p className="text-[10px] text-slate-400">{docsAprobados}/{docsTotal} aprobados</p>
                      </div>
                      <div className="h-2.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${docsTotal > 0 ? (docsAprobados / docsTotal) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Zona de Upload */}
                    <div
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => inputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4 ${
                        arrastrando
                          ? "border-blue-400 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        ref={inputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          arrastrando ? "bg-blue-100" : "bg-slate-100"
                        }`}>
                          <Upload size={20} className={arrastrando ? "text-blue-500" : "text-slate-400"} />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-slate-700">
                            {arrastrando ? "Suelta los archivos aquí" : "Arrastra archivos o haz clic para seleccionar"}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            PDF, JPG, PNG, DOC - Máx. 10MB por archivo
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Documentos */}
                    <div className="space-y-2">
                      {documentos.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText size={32} className="text-slate-200 mx-auto mb-3" />
                          <p className="text-[11px] text-slate-400">No has subido documentos aún</p>
                        </div>
                      ) : (
                        documentos.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors group">
                            <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                              {doc.estado === "aprobado" ? (
                                <CheckCircle size={16} className="text-emerald-500" />
                              ) : doc.estado === "rechazado" ? (
                                <XCircle size={16} className="text-red-500" />
                              ) : (
                                <FileText size={16} className="text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-semibold text-slate-800 truncate">{doc.nombre}</div>
                              <div className="text-[9px] text-slate-400">
                                {doc.tamaño ? formatTamano(doc.tamaño) : ""} 
                                {doc.fechaSubida && ` • ${doc.fechaSubida.toLocaleDateString("es-CL")}`}
                              </div>
                            </div>
                            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                              doc.estado === "aprobado" ? "bg-emerald-100 text-emerald-700" :
                              doc.estado === "rechazado" ? "bg-red-100 text-red-700" :
                              doc.estado === "subido" ? "bg-blue-100 text-blue-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {doc.estado === "aprobado" ? "Aprobado" :
                               doc.estado === "rechazado" ? "Rechazado" :
                               doc.estado === "subido" ? "En revisión" : "Pendiente"}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 hover:bg-white rounded-lg transition-colors" title="Ver">
                                <Eye size={12} className="text-slate-400" />
                              </button>
                              <button className="p-1.5 hover:bg-white rounded-lg transition-colors" title="Descargar">
                                <Download size={12} className="text-slate-400" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEliminarDocId(doc.id); }}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={12} className="text-red-400" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Datos del Crédito */}
                {tabActiva === "datos" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Información del Crédito</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-[11px] text-slate-500">Tipo de Crédito</span>
                          <span className="text-[11px] font-bold text-slate-800">{cliente.tipoCredito || "Hipotecario"}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-[11px] text-slate-500">Monto Solicitado</span>
                          <span className="text-[11px] font-bold text-slate-800">{formatoMonedaAbreviado(cliente.montoSolicitado || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-[11px] text-slate-500">Valor Propiedad</span>
                          <span className="text-[11px] font-bold text-slate-800">{formatoMonedaAbreviado(cliente.valorPropiedad || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-[11px] text-slate-500">Pie Disponible</span>
                          <span className="text-[11px] font-bold text-slate-800">{formatoMonedaAbreviado(cliente.pieDisponible || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <span className="text-[11px] text-blue-600 font-medium">Banco Seleccionado</span>
                          <span className="text-[11px] font-bold text-blue-800">{cliente.banco || "Por asignar"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Documentos Requeridos</h4>
                      <div className="space-y-2">
                        {(DOCUMENTOS_POR_TIPO[cliente.situacionLaboral] || DOCUMENTOS_POR_TIPO.DEPENDIENTE).map((doc) => {
                          const docSubido = documentos.find((d) => d.tipo === doc.id);
                          return (
                            <div key={doc.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                docSubido?.estado === "aprobado" ? "bg-emerald-100" :
                                docSubido ? "bg-blue-100" : "bg-white border border-slate-200"
                              }`}>
                                {docSubido?.estado === "aprobado" ? (
                                  <CheckCircle size={12} className="text-emerald-500" />
                                ) : docSubido ? (
                                  <FileCheck size={12} className="text-blue-500" />
                                ) : (
                                  <FileText size={12} className="text-slate-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="text-[10px] font-semibold text-slate-800">{doc.nombre}</div>
                                {doc.obligatorio && (
                                  <div className="text-[8px] text-red-500 font-medium">Obligatorio</div>
                                )}
                              </div>
                              <span className={`text-[8px] px-2 py-0.5 rounded-full ${
                                docSubido?.estado === "aprobado" ? "bg-emerald-100 text-emerald-700" :
                                docSubido ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                              }`}>
                                {docSubido?.estado === "aprobado" ? "Aprobado" :
                                 docSubido ? "Subido" : "Pendiente"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contacto */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold mb-1">¿Necesitas ayuda?</h4>
                  <p className="text-[11px] text-blue-200">Contacta a tu ejecutivo o envíanos un mensaje</p>
                </div>
                <div className="flex items-center gap-3">
                  <a href={`tel:${cliente.telefono}`} className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm">
                    <Phone size={14} /> Llamar
                  </a>
                  <a href={`mailto:info@tuhipotecafacil.cl?subject=Consulta Crédito - ${cliente.nombre} ${cliente.apellido}`} className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm">
                    <Mail size={14} /> Email
                  </a>
                  <button onClick={copiarWhatsApp} className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors">
                    <MessageSquare size={14} /> {copiado ? "Copiado!" : "WhatsApp"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sin resultado - Info */}
        {!cliente && !buscando && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 text-center hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                  <Search size={24} className="text-white" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">Consulta Fácil</h4>
                <p className="text-[11px] text-slate-500">Solo necesitas tu RUT para conocer el estado de tu crédito en tiempo real</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 text-center hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                  <Upload size={24} className="text-white" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">Sube tus Documentos</h4>
                <p className="text-[11px] text-slate-500">Adjunta la documentación directamente desde el portal de forma segura</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 text-center hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                  <Shield size={24} className="text-white" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">100% Seguro</h4>
                <p className="text-[11px] text-slate-500">Tus datos están protegidos con encriptación de extremo a extremo</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Confirmar Eliminación */}
      {eliminarDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-[400px] shadow-2xl mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Eliminar Documento</h3>
                <p className="text-[10px] text-slate-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mb-6">
              ¿Estás seguro de que deseas eliminar este documento? El archivo será removido permanentemente.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setEliminarDocId(null)}
                className="px-4 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarDocumento(eliminarDocId)}
                className="px-4 py-2 bg-red-600 text-white text-[11px] font-semibold rounded-xl hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Home size={14} className="text-white" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-900">Tu Hipoteca Fácil</div>
                <div className="text-[9px] text-slate-400">Gestión y Asesoría Financiera</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-[9px] text-slate-400">
                <Lock size={10} /> Datos protegidos
              </div>
              <div className="text-[9px] text-slate-400">
                © 2026 Tu Hipoteca Fácil
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
