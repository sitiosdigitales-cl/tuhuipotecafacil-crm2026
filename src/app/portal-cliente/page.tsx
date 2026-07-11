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
  Edit,
  Save,
  CreditCard,
} from "lucide-react";
import { useLeads } from "@/lib/contexts/LeadContext";
import { ETAPAS_CONFIG, ORIGEN_LABELS } from "@/tipos";
import { SITUACION_LABORAL_CONFIG, RENTAS_MENSUALES } from "@/tipos";
import { formatoMonedaAbreviado, formatoUF, formatoMoneda } from "@/lib/utils";
import type { Lead, Etapa, SituacionLaboral } from "@/tipos";

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
  { paso: 1, label: "Registro", icono: <FileText size={14} />, etapa: "NUEVO_LEAD" as Etapa },
  { paso: 2, label: "Contacto", icono: <Phone size={14} />, etapa: "CONTACTADO" as Etapa },
  { paso: 3, label: "Calificación", icono: <User size={14} />, etapa: "CALIFICACION_COMERCIAL" as Etapa },
  { paso: 4, label: "Documentación", icono: <FileCheck size={14} />, etapa: "DOCS_COMPLETAS" as Etapa },
  { paso: 5, label: "Evaluación", icono: <Building2 size={14} />, etapa: "EVALUACION_BANCARIA" as Etapa },
  { paso: 6, label: "Pre Aprobación", icono: <TrendingUp size={14} />, etapa: "PREAPROBADO" as Etapa },
  { paso: 7, label: "Aprobado", icono: <CheckCircle size={14} />, etapa: "APROBADO" as Etapa },
  { paso: 8, label: "Firma", icono: <FileCheck size={14} />, etapa: "FIRMA_DIGITAL" as Etapa },
  { paso: 9, label: "Notaría", icono: <Award size={14} />, etapa: "NOTARIA" as Etapa },
  { paso: 10, label: "Desembolso", icono: <DollarSign size={14} />, etapa: "CREDITO_PAGADO" as Etapa },
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
  const [tabActiva, setTabActiva] = useState<"progreso" | "documentos" | "datos" | "perfil">("progreso");
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [perfilEditado, setPerfilEditado] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    domicilio: "",
    comunaCiudad: "",
    // Datos extendidos
    cargasLegales: "",
    estadoCivil: "",
    regimenMatrimonial: "",
    fechaNacimiento: "",
    estudios: "",
    profesion: "",
    valorArriendo: "",
    afp: "",
    // Empleador
    nombreEmpleador: "",
    rutEmpresa: "",
    fechaIngreso: "",
    cargo: "",
    rentaLiquida: "",
    bancoAbonoRenta: "",
    fechaPago: "",
    direccionLaboral: "",
    comunaCiudadLaboral: "",
    telefonoLaboralFijo: "",
    emailLaboral: "",
    otrosIngresos: "",
    // Financiero
    situacionLaboral: "" as SituacionLaboral,
    enDicom: false,
    dicomDetalle: "",
    rentaMensual: "",
    complementarRenta: false,
    // Crédito
    tipoCredito: "",
    cuentaPie: false,
    montoSolicitado: "",
    valorPropiedad: "",
    pieDisponible: "",
    banco: "",
  });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [perfilGuardado, setPerfilGuardado] = useState(false);
  const [editandoProgreso, setEditandoProgreso] = useState(false);
  const [guardandoProgreso, setGuardandoProgreso] = useState(false);

  // RUTs de clientes reales del sistema
  const rutsEjemplo = useMemo(() => {
    return leads.slice(0, 6).map((l) => ({
      rut: l.rut,
      nombre: `${l.nombre} ${l.apellido}`,
      etapa: ETAPAS_CONFIG[l.etapa]?.label || l.etapa,
    }));
  }, [leads]);

  const handleBuscar = async () => {
    if (!rut.trim()) {
      setError("Por favor ingresa tu RUT para continuar");
      return;
    }

    setBuscando(true);
    setError("");

    try {
      // Normalizar el RUT ingresado
      const normalizarRut = (r: string) => r.replace(/\./g, "").replace("-", "").replace(/\s/g, "").toLowerCase();
      const rutIngresado = normalizarRut(rut);

      // Buscar en la API
      const response = await fetch(`/api/leads?busqueda=${encodeURIComponent(rut)}`);
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        // Encontrar el lead que coincida con el RUT
        const leadEncontrado = data.data.find((l: any) => {
          const rutLead = normalizarRut(l.rut);
          return rutLead === rutIngresado || (rutIngresado.length >= 6 && rutLead.includes(rutIngresado));
        });

        if (leadEncontrado) {
          const lead: Lead = {
            ...leadEncontrado,
            creadoEn: new Date(leadEncontrado.creadoEn),
          };
          setCliente(lead);
          setError("");

          // Cargar documentos reales desde la API
          try {
            const docsRes = await fetch(`/api/documentos?leadId=${lead.id}`);
            const docsData = await docsRes.json();
            if (docsData.success && docsData.data && docsData.data.length > 0) {
              setDocumentos(docsData.data.map((d: any) => ({
                id: d.id,
                nombre: d.nombre,
                tipo: d.tipo,
                estado: d.estado?.toLowerCase() || "pendiente",
                fechaSubida: d.creadoEn ? new Date(d.creadoEn) : undefined,
                tamaño: d.tamaño || undefined,
              })));
            } else {
              // Documentos base según tipo de trabajador
              const docsBase = (lead.situacionLaboral === "INDEPENDIENTE" ? [
                { id: "cedula", nombre: "Cédula de Identidad", tipo: "cedula", estado: "pendiente" as const },
                { id: "carpeta-trib", nombre: "Carpeta Tributaria", tipo: "carpeta-trib", estado: "pendiente" as const },
                { id: "renta", nombre: "Declaración de Renta", tipo: "renta", estado: "pendiente" as const },
                { id: "dicom", nombre: "Informe DICOM", tipo: "dicom", estado: "pendiente" as const },
              ] : [
                { id: "cedula", nombre: "Cédula de Identidad", tipo: "cedula", estado: "pendiente" as const },
                { id: "liq-sueldo", nombre: "Liquidaciones de Sueldo", tipo: "liq-sueldo", estado: "pendiente" as const },
                { id: "afp", nombre: "Certificado AFP", tipo: "afp", estado: "pendiente" as const },
                { id: "antiguedad", nombre: "Certificado Antigüedad", tipo: "antiguedad", estado: "pendiente" as const },
                { id: "domicilio", nombre: "Comprobante de Domicilio", tipo: "domicilio", estado: "pendiente" as const },
                { id: "dicom", nombre: "Informe DICOM", tipo: "dicom", estado: "pendiente" as const },
              ]);
              setDocumentos(docsBase);
            }
          } catch {
            setDocumentos([]);
          }
        } else {
          setError("RUT no encontrado. Verifica el RUT e intenta nuevamente.");
          setCliente(null);
          setDocumentos([]);
        }
      } else {
        setError("RUT no encontrado. Verifica el RUT e intenta nuevamente.");
        setCliente(null);
        setDocumentos([]);
      }
    } catch {
      setError("Error al buscar el cliente. Intenta nuevamente.");
      setCliente(null);
      setDocumentos([]);
    } finally {
      setBuscando(false);
    }
  };

  const seleccionarRutEjemplo = (rutEjemplo: string) => {
    setRut(rutEjemplo);
    setError("");
  };

  const iniciarEdicionPerfil = () => {
    if (cliente) {
      setPerfilEditado({
        nombre: cliente.nombre || "",
        apellido: cliente.apellido || "",
        email: cliente.email || "",
        telefono: cliente.telefono || "",
        domicilio: cliente.domicilioParticular || "",
        comunaCiudad: cliente.comunaCiudad || "",
        cargasLegales: cliente.cargasLegales || "",
        estadoCivil: cliente.estadoCivil || "",
        regimenMatrimonial: cliente.regimenMatrimonial || "",
        fechaNacimiento: cliente.fechaNacimiento || "",
        estudios: cliente.estudios || "",
        profesion: cliente.profesion || "",
        valorArriendo: cliente.valorArriendo?.toString() || "",
        afp: cliente.afp || "",
        nombreEmpleador: cliente.nombreEmpleador || "",
        rutEmpresa: cliente.rutEmpresa || "",
        fechaIngreso: cliente.fechaIngreso || "",
        cargo: cliente.cargo || "",
        rentaLiquida: cliente.rentaLiquida?.toString() || "",
        bancoAbonoRenta: cliente.bancoAbonoRenta || "",
        fechaPago: cliente.fechaPago || "",
        direccionLaboral: cliente.direccionLaboral || "",
        comunaCiudadLaboral: cliente.comunaCiudadLaboral || "",
        telefonoLaboralFijo: cliente.telefonoLaboralFijo || "",
        emailLaboral: cliente.emailLaboral || "",
        otrosIngresos: cliente.otrosIngresos || "",
        situacionLaboral: cliente.situacionLaboral || "DEPENDIENTE",
        enDicom: cliente.enDicom || false,
        dicomDetalle: cliente.dicomDetalle || "",
        rentaMensual: cliente.rentaMensual || "",
        complementarRenta: cliente.complementarRenta || false,
        tipoCredito: cliente.tipoCredito || "",
        cuentaPie: cliente.cuentaPie || false,
        montoSolicitado: cliente.montoSolicitado?.toString() || "",
        valorPropiedad: cliente.valorPropiedad?.toString() || "",
        pieDisponible: cliente.pieDisponible?.toString() || "",
        banco: cliente.banco || "",
      });
      setEditandoPerfil(true);
    }
  };

  const guardarPerfil = async () => {
    if (!cliente) return;
    setGuardandoPerfil(true);

    const datosActualizar = {
      nombre: perfilEditado.nombre,
      apellido: perfilEditado.apellido,
      email: perfilEditado.email,
      telefono: perfilEditado.telefono,
      domicilioParticular: perfilEditado.domicilio,
      comunaCiudad: perfilEditado.comunaCiudad,
      cargasLegales: perfilEditado.cargasLegales || undefined,
      estadoCivil: perfilEditado.estadoCivil || undefined,
      regimenMatrimonial: perfilEditado.regimenMatrimonial || undefined,
      fechaNacimiento: perfilEditado.fechaNacimiento || undefined,
      estudios: perfilEditado.estudios || undefined,
      profesion: perfilEditado.profesion || undefined,
      valorArriendo: perfilEditado.valorArriendo ? parseFloat(perfilEditado.valorArriendo) : undefined,
      afp: perfilEditado.afp || undefined,
      nombreEmpleador: perfilEditado.nombreEmpleador || undefined,
      rutEmpresa: perfilEditado.rutEmpresa || undefined,
      fechaIngreso: perfilEditado.fechaIngreso || undefined,
      cargo: perfilEditado.cargo || undefined,
      rentaLiquida: perfilEditado.rentaLiquida ? parseFloat(perfilEditado.rentaLiquida) : undefined,
      bancoAbonoRenta: perfilEditado.bancoAbonoRenta || undefined,
      fechaPago: perfilEditado.fechaPago || undefined,
      direccionLaboral: perfilEditado.direccionLaboral || undefined,
      comunaCiudadLaboral: perfilEditado.comunaCiudadLaboral || undefined,
      telefonoLaboralFijo: perfilEditado.telefonoLaboralFijo || undefined,
      emailLaboral: perfilEditado.emailLaboral || undefined,
      otrosIngresos: perfilEditado.otrosIngresos || undefined,
      situacionLaboral: perfilEditado.situacionLaboral,
      enDicom: perfilEditado.enDicom,
      dicomDetalle: perfilEditado.dicomDetalle || undefined,
      rentaMensual: perfilEditado.rentaMensual || undefined,
      complementarRenta: perfilEditado.complementarRenta,
      tipoCredito: perfilEditado.tipoCredito || undefined,
      cuentaPie: perfilEditado.cuentaPie,
      montoSolicitado: perfilEditado.montoSolicitado ? parseFloat(perfilEditado.montoSolicitado) : undefined,
      valorPropiedad: perfilEditado.valorPropiedad ? parseFloat(perfilEditado.valorPropiedad) : undefined,
      pieDisponible: perfilEditado.pieDisponible ? parseFloat(perfilEditado.pieDisponible) : undefined,
      banco: perfilEditado.banco || undefined,
    };

    try {
      const response = await fetch(`/api/leads/${cliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosActualizar),
      });

      if (response.ok) {
        setCliente({
          ...cliente,
          ...datosActualizar,
        });
        setEditandoPerfil(false);
        setPerfilGuardado(true);
        setTimeout(() => setPerfilGuardado(false), 3000);
      }
    } catch {
      // Guardar localmente si la API falla
      if (cliente) {
        setCliente({
          ...cliente,
          ...datosActualizar,
        });
      }
      setEditandoPerfil(false);
      setPerfilGuardado(true);
      setTimeout(() => setPerfilGuardado(false), 3000);
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const actualizarEtapaProgreso = async (nuevaEtapa: Etapa) => {
    if (!cliente) return;
    setGuardandoProgreso(true);

    try {
      const response = await fetch(`/api/leads/${cliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa: nuevaEtapa }),
      });

      if (response.ok) {
        setCliente({ ...cliente, etapa: nuevaEtapa });
      }
    } catch {
      // Guardar localmente si la API falla
      setCliente({ ...cliente, etapa: nuevaEtapa });
    } finally {
      setGuardandoProgreso(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
              <Home size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Tu Hipoteca Fácil</h1>
              <p className="text-[9px] text-blue-200/70 font-medium">Portal del Cliente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="tel:+56921234567" className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-white hover:bg-white/10 rounded-lg transition-colors">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4 border border-white/20">
            <Sparkles size={14} className="text-white" />
            <span className="text-[11px] font-semibold text-white">Consulta en tiempo real</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
            Consulta tu Crédito Hipotecario
          </h2>
          <p className="text-sm text-blue-200/70 max-w-lg mx-auto">
            Ingresa tu RUT para conocer el estado actual de tu solicitud y subir documentos requeridos
          </p>
        </div>

        {/* Buscador */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
            <label className="text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-3 block">
              RUT del Titular
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/50" />
                <input
                  type="text"
                  placeholder="Ej: 12.345.678-9"
                  value={rut}
                  onChange={(e) => { setRut(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>
              <button
                onClick={handleBuscar}
                disabled={buscando}
                className="px-6 py-3.5 bg-white text-blue-900 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {buscando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-900 rounded-full animate-spin" />
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
              <div className="mt-4 p-3 bg-red-500/20 rounded-xl flex items-center gap-2 border border-red-500/30">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <span className="text-[11px] text-red-600">{error}</span>
              </div>
            )}

            {/* RUTs de ejemplo */}
            {rutsEjemplo.length > 0 && !cliente && (
              <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[11px] font-bold text-blue-200 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  RUTs de prueba disponibles
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {rutsEjemplo.map((ejemplo, i) => (
                    <button
                      key={i}
                      onClick={() => seleccionarRutEjemplo(ejemplo.rut)}
                      className="text-left p-2.5 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 hover:border-white/30 transition-all group"
                    >
                      <div className="text-[11px] font-bold text-white group-hover:text-blue-200 transition-colors">{ejemplo.rut}</div>
                      <div className="text-[10px] text-blue-200/70 mt-0.5">{ejemplo.nombre}</div>
                      <div className="text-[9px] text-blue-300 font-medium mt-1">{ejemplo.etapa}</div>
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
                    { id: "perfil" as const, label: "Mi Perfil", icono: <User size={14} /> },
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
                    {/* Header del Progreso */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Progreso de tu Crédito</h4>
                        <p className="text-[10px] text-slate-400">
                          {etapaActual > 0 ? `${progreso.toFixed(0)}% completado` : "Inicia tu proceso de crédito"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {guardandoProgreso && (
                          <span className="text-[10px] text-blue-500 flex items-center gap-1">
                            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            Guardando...
                          </span>
                        )}
                        <button
                          onClick={() => setEditandoProgreso(!editandoProgreso)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
                            editandoProgreso
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {editandoProgreso ? (
                            <>
                              <Check size={12} /> Finalizar Edición
                            </>
                          ) : (
                            <>
                              <Edit size={12} /> Editar Progreso
                            </>
                          )}
                        </button>
                      </div>
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

                    {/* Progreso Horizontal de Pasos */}
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center justify-between relative">
                        {/* Línea de fondo */}
                        <div className="absolute top-5 left-[5%] right-[5%] h-0.5 bg-slate-200" />
                        <div
                          className="absolute top-5 left-[5%] h-0.5 bg-emerald-500 transition-all duration-700"
                          style={{ width: `${Math.max(0, (progreso / 100) * 90)}%` }}
                        />

                        {PASOS_PROGRESO.map((paso, i) => {
                          const esCompletado = etapaActual > paso.paso;
                          const esActual = etapaActual === paso.paso;
                          const esFuturo = etapaActual < paso.paso;

                          return (
                            <div
                              key={paso.paso}
                              className={`relative z-10 flex flex-col items-center gap-2 ${
                                editandoProgreso ? "cursor-pointer" : ""
                              }`}
                              onClick={() => {
                                if (editandoProgreso && cliente) {
                                  actualizarEtapaProgreso(paso.etapa);
                                }
                              }}
                            >
                              {/* Círculo del paso */}
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                  esActual
                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100"
                                    : esCompletado
                                    ? "bg-emerald-500 text-white"
                                    : "bg-white text-slate-400 border-2 border-slate-200"
                                } ${editandoProgreso && !esCompletado ? "hover:scale-110 hover:border-blue-400" : ""}`}
                              >
                                {esCompletado ? (
                                  <Check size={16} />
                                ) : (
                                  paso.icono
                                )}
                              </div>

                              {/* Label */}
                              <span
                                className={`text-[9px] font-semibold text-center max-w-[60px] leading-tight ${
                                  esActual
                                    ? "text-blue-700"
                                    : esCompletado
                                    ? "text-emerald-700"
                                    : "text-slate-400"
                                }`}
                              >
                                {paso.label}
                              </span>

                              {/* Badge */}
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

                    {/* Info del paso actual */}
                    <div className={`mt-6 p-4 rounded-xl ${configEstado?.bg || "bg-slate-50"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center ${configEstado?.color || "text-slate-500"}`}>
                          {configEstado?.icono}
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${configEstado?.color || "text-slate-700"}`}>
                            {configEstado?.label || "Estado desconocido"}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {configEstado?.descripcion || "Tu solicitud se encuentra en esta etapa"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Leyenda */}
                    {editandoProgreso && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-[10px] text-blue-700 flex items-center gap-1.5">
                          <Edit size={11} />
                          <span className="font-semibold">Modo edición:</span> Haz clic en cualquier paso para marcar la etapa actual del crédito.
                        </p>
                      </div>
                    )}
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

                {/* Tab Mi Perfil */}
                {tabActiva === "perfil" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Mi Perfil</h4>
                        <p className="text-[10px] text-slate-400">Actualiza tu información personal</p>
                      </div>
                      {!editandoPerfil && (
                        <button
                          onClick={iniciarEdicionPerfil}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-600 transition-colors"
                        >
                          <Edit size={12} /> Editar
                        </button>
                      )}
                    </div>

                    {perfilGuardado && (
                      <div className="mb-4 p-3 bg-emerald-50 rounded-xl flex items-center gap-2 border border-emerald-100">
                        <CheckCircle size={14} className="text-emerald-500" />
                        <span className="text-[11px] text-emerald-700 font-medium">Perfil actualizado correctamente</span>
                      </div>
                    )}

                    {editandoPerfil ? (
                      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                        {/* Sección: Datos Personales */}
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <User size={13} className="text-blue-500" />
                            Datos Personales
                          </h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Nombre *</label>
                              <input type="text" value={perfilEditado.nombre}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, nombre: e.target.value })}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" required />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Apellido *</label>
                              <input type="text" value={perfilEditado.apellido}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, apellido: e.target.value })}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" required />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Fecha Nacimiento</label>
                              <input type="date" value={perfilEditado.fechaNacimiento}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, fechaNacimiento: e.target.value })}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Estado Civil</label>
                              <select value={perfilEditado.estadoCivil}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, estadoCivil: e.target.value })}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                                <option value="">Seleccionar</option>
                                <option value="Soltero/a">Soltero/a</option>
                                <option value="Casado/a">Casado/a</option>
                                <option value="Divorciado/a">Divorciado/a</option>
                                <option value="Viudo/a">Viudo/a</option>
                                <option value="Unión Civil">Unión Civil</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Régimen Matrimonial</label>
                              <select value={perfilEditado.regimenMatrimonial}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, regimenMatrimonial: e.target.value })}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                                <option value="">Seleccionar</option>
                                <option value="Separación de Bienes">Separación de Bienes</option>
                                <option value="Sociedad Conyugal">Sociedad Conyugal</option>
                                <option value="No aplica">No aplica</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Cargas Legales</label>
                              <input type="text" value={perfilEditado.cargasLegales}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, cargasLegales: e.target.value })}
                                placeholder="Ej: Caja Compensación"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Estudios</label>
                              <input type="text" value={perfilEditado.estudios}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, estudios: e.target.value })}
                                placeholder="Ej: Universitario"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Profesión</label>
                              <input type="text" value={perfilEditado.profesion}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, profesion: e.target.value })}
                                placeholder="Ej: Ingeniero"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Situación Laboral *</label>
                              <select value={perfilEditado.situacionLaboral}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, situacionLaboral: e.target.value as SituacionLaboral })}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                                <option value="DEPENDIENTE">Trabajador Dependiente</option>
                                <option value="INDEPENDIENTE">Trabajador Independiente</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">AFP</label>
                              <select value={perfilEditado.afp}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, afp: e.target.value })}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                                <option value="">Seleccionar</option>
                                <option value="Capital">Capital</option>
                                <option value="Cuprum">Cuprum</option>
                                <option value="Habitat">Habitat</option>
                                <option value="Planvital">Planvital</option>
                                <option value="Provida">Provida</option>
                                <option value="Rencoret">Rencoret</option>
                                <option value="Santa María">Santa María</option>
                                <option value="Otros">Otros</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Sección: Contacto y Domicilio */}
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Phone size={13} className="text-emerald-500" />
                            Contacto y Domicilio
                          </h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Teléfono</label>
                              <input type="tel" value={perfilEditado.telefono}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, telefono: e.target.value })}
                                placeholder="+56 9 1234 5678"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Email</label>
                              <input type="email" value={perfilEditado.email}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, email: e.target.value })}
                                placeholder="correo@ejemplo.com"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Domicilio Particular</label>
                              <input type="text" value={perfilEditado.domicilio}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, domicilio: e.target.value })}
                                placeholder="Dirección completa"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Comuna / Ciudad</label>
                              <input type="text" value={perfilEditado.comunaCiudad}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, comunaCiudad: e.target.value })}
                                placeholder="Ej: Las Condes"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Valor Arriendo (si aplica)</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">$</span>
                                <input type="number" value={perfilEditado.valorArriendo}
                                  onChange={(e) => setPerfilEditado({ ...perfilEditado, valorArriendo: e.target.value })}
                                  placeholder="0"
                                  className="w-full h-10 pl-7 pr-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Sección: Datos del Empleador */}
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Building2 size={13} className="text-emerald-500" />
                            Datos del Empleador
                          </h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Nombre Empleador</label>
                              <input type="text" value={perfilEditado.nombreEmpleador}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, nombreEmpleador: e.target.value })}
                                placeholder="Nombre de la empresa"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">RUT Empresa</label>
                              <input type="text" value={perfilEditado.rutEmpresa}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, rutEmpresa: e.target.value })}
                                placeholder="12.345.678-9"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Fecha de Ingreso</label>
                              <input type="date" value={perfilEditado.fechaIngreso}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, fechaIngreso: e.target.value })}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Cargo</label>
                              <input type="text" value={perfilEditado.cargo}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, cargo: e.target.value })}
                                placeholder="Ej: Gerente"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Renta Líquida</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">$</span>
                                <input type="number" value={perfilEditado.rentaLiquida}
                                  onChange={(e) => setPerfilEditado({ ...perfilEditado, rentaLiquida: e.target.value })}
                                  placeholder="0"
                                  className="w-full h-10 pl-7 pr-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Banco Abono Renta</label>
                              <select value={perfilEditado.bancoAbonoRenta}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, bancoAbonoRenta: e.target.value })}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                                <option value="">Seleccionar</option>
                                <option value="Banco Estado">Banco Estado</option>
                                <option value="Santander">Santander</option>
                                <option value="Banco de Chile">Banco de Chile</option>
                                <option value="Banco BCI">Banco BCI</option>
                                <option value="Banco Scotiabank">Banco Scotiabank</option>
                                <option value="Banco Itaú">Banco Itaú</option>
                                <option value="Banco Security">Banco Security</option>
                                <option value="Banco Falabella">Banco Falabella</option>
                                <option value="Banco Ripley">Banco Ripley</option>
                                <option value="Banco Paris">Banco Paris</option>
                                <option value="CorpGroup">CorpGroup</option>
                                <option value="Otros">Otros</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Fecha de Pago</label>
                              <select value={perfilEditado.fechaPago}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, fechaPago: e.target.value })}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
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
                              <input type="tel" value={perfilEditado.telefonoLaboralFijo}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, telefonoLaboralFijo: e.target.value })}
                                placeholder="Fijo"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Dirección Laboral</label>
                              <input type="text" value={perfilEditado.direccionLaboral}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, direccionLaboral: e.target.value })}
                                placeholder="Dirección del trabajo"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Comuna / Ciudad</label>
                              <input type="text" value={perfilEditado.comunaCiudadLaboral}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, comunaCiudadLaboral: e.target.value })}
                                placeholder="Ej: Santiago"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Email Laboral</label>
                              <input type="email" value={perfilEditado.emailLaboral}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, emailLaboral: e.target.value })}
                                placeholder="correo@empresa.cl"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Otros Ingresos</label>
                              <input type="text" value={perfilEditado.otrosIngresos}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, otrosIngresos: e.target.value })}
                                placeholder="Detallar otros ingresos"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                          </div>
                        </div>

                        {/* Sección: Situación Financiera */}
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <DollarSign size={13} className="text-purple-500" />
                            Situación Financiera
                          </h5>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Renta Mensual</label>
                              <select value={perfilEditado.rentaMensual}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, rentaMensual: e.target.value })}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                                <option value="">Seleccionar</option>
                                {RENTAS_MENSUALES.map((renta) => <option key={renta} value={renta}>{renta}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">En DICOM</label>
                              <div className="flex gap-3 h-10 items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name="dicom" checked={perfilEditado.enDicom === false}
                                    onChange={() => setPerfilEditado({ ...perfilEditado, enDicom: false })} className="w-4 h-4 text-blue-600" />
                                  <span className="text-[11px] text-slate-600">No</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name="dicom" checked={perfilEditado.enDicom === true}
                                    onChange={() => setPerfilEditado({ ...perfilEditado, enDicom: true })} className="w-4 h-4 text-red-600" />
                                  <span className="text-[11px] text-slate-600">Si</span>
                                </label>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Complementar Renta</label>
                              <div className="flex gap-3 h-10 items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name="complementar" checked={perfilEditado.complementarRenta === false}
                                    onChange={() => setPerfilEditado({ ...perfilEditado, complementarRenta: false })} className="w-4 h-4 text-blue-600" />
                                  <span className="text-[11px] text-slate-600">No</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name="complementar" checked={perfilEditado.complementarRenta === true}
                                    onChange={() => setPerfilEditado({ ...perfilEditado, complementarRenta: true })} className="w-4 h-4 text-blue-600" />
                                  <span className="text-[11px] text-slate-600">Si</span>
                                </label>
                              </div>
                            </div>
                          </div>
                          {perfilEditado.enDicom && (
                            <div className="mt-3 space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Detalle DICOM</label>
                              <input type="text" value={perfilEditado.dicomDetalle}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, dicomDetalle: e.target.value })}
                                placeholder="Describe la situacion en DICOM"
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                            </div>
                          )}
                        </div>

                        {/* Sección: Crédito Solicitado */}
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <CreditCard size={13} className="text-amber-500" />
                            Crédito Solicitado
                          </h5>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Monto Solicitado</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">$</span>
                                <input type="number" value={perfilEditado.montoSolicitado}
                                  onChange={(e) => setPerfilEditado({ ...perfilEditado, montoSolicitado: e.target.value })}
                                  placeholder="0"
                                  className="w-full h-10 pl-7 pr-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Valor Propiedad</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">$</span>
                                <input type="number" value={perfilEditado.valorPropiedad}
                                  onChange={(e) => setPerfilEditado({ ...perfilEditado, valorPropiedad: e.target.value })}
                                  placeholder="0"
                                  className="w-full h-10 pl-7 pr-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Pie Disponible</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">$</span>
                                <input type="number" value={perfilEditado.pieDisponible}
                                  onChange={(e) => setPerfilEditado({ ...perfilEditado, pieDisponible: e.target.value })}
                                  placeholder="0"
                                  className="w-full h-10 pl-7 pr-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Banco</label>
                              <select value={perfilEditado.banco}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, banco: e.target.value })}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                                <option value="">Seleccionar banco</option>
                                <option value="Banco Estado">Banco Estado</option>
                                <option value="Santander">Santander</option>
                                <option value="Banco de Chile">Banco de Chile</option>
                                <option value="Banco BCI">Banco BCI</option>
                                <option value="Banco Scotiabank">Banco Scotiabank</option>
                                <option value="Banco Itaú">Banco Itaú</option>
                                <option value="Banco Security">Banco Security</option>
                                <option value="Banco Falabella">Banco Falabella</option>
                                <option value="Banco Ripley">Banco Ripley</option>
                                <option value="Banco Paris">Banco Paris</option>
                                <option value="CorpGroup">CorpGroup</option>
                                <option value="Otros">Otros</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-semibold text-slate-700">Tipo de Crédito</label>
                              <select value={perfilEditado.tipoCredito}
                                onChange={(e) => setPerfilEditado({ ...perfilEditado, tipoCredito: e.target.value })}
                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                                <option value="">Seleccionar tipo</option>
                                <option value="Créditos Hipotecarios">Créditos Hipotecarios</option>
                                <option value="Créditos de Consumos">Créditos de Consumos</option>
                                <option value="Fines Generales">Fines Generales</option>
                                <option value="Capital para Empresas">Capital para Empresas</option>
                              </select>
                            </div>
                          </div>
                          <div className="mt-4 space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-700">Cuenta de Ahorro (Cuenta Pie)</label>
                            <div className="flex gap-3 h-10 items-center">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="cuentaPie" checked={perfilEditado.cuentaPie === false}
                                  onChange={() => setPerfilEditado({ ...perfilEditado, cuentaPie: false })} className="w-4 h-4 text-blue-600" />
                                <span className="text-[11px] text-slate-600">No tiene</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="cuentaPie" checked={perfilEditado.cuentaPie === true}
                                  onChange={() => setPerfilEditado({ ...perfilEditado, cuentaPie: true })} className="w-4 h-4 text-blue-600" />
                                <span className="text-[11px] text-slate-600">Tiene cuenta pie</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Botones */}
                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => setEditandoPerfil(false)}
                            className="px-5 py-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={guardarPerfil}
                            disabled={guardandoPerfil}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
                          >
                            {guardandoPerfil ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Guardando...
                              </>
                            ) : (
                              <>
                                <Save size={12} /> Guardar Cambios
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Sección: Datos Personales */}
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Datos Personales</h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">Nombre completo</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.nombre} {cliente.apellido}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">RUT</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.rut}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">Email</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.email || "No registrado"}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">Teléfono</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.telefono || "No registrado"}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">Situación Laboral</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.situacionLaboral === "DEPENDIENTE" ? "Trabajador Dependiente" : "Trabajador Independiente"}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">Origen</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.origen || "No especificado"}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">En DICOM</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.enDicom ? "Sí" : "No"}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">Renta Mensual</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.rentaMensual || "No especificada"}</div>
                            </div>
                          </div>
                        </div>

                        {/* Sección: Datos Extendidos */}
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Información Adicional</h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">Cargas Legales</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.cargasLegales || "No especificado"}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">Estado Civil</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.estadoCivil || "No especificado"}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">Régimen Matrimonial</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.regimenMatrimonial || "No especificado"}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">Fecha Nacimiento</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.fechaNacimiento || "No especificado"}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">Estudios</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.estudios || "No especificado"}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">Profesión</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.profesion || "No especificado"}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">Domicilio</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.domicilioParticular || "No registrado"}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                              <div className="text-[10px] text-slate-400 font-medium mb-1">Comuna / Ciudad</div>
                              <div className="text-[12px] font-bold text-slate-800">{cliente.comunaCiudad || "No registrado"}</div>
                            </div>
                          </div>
                        </div>

                        {/* Sección: Datos del Empleador */}
                        {cliente.situacionLaboral === "DEPENDIENTE" && (
                          <div>
                            <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Datos del Empleador</h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-slate-50 rounded-xl">
                                <div className="text-[10px] text-slate-400 font-medium mb-1">Nombre Empleador</div>
                                <div className="text-[12px] font-bold text-slate-800">{cliente.nombreEmpleador || "No especificado"}</div>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-xl">
                                <div className="text-[10px] text-slate-400 font-medium mb-1">RUT Empresa</div>
                                <div className="text-[12px] font-bold text-slate-800">{cliente.rutEmpresa || "No especificado"}</div>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-xl">
                                <div className="text-[10px] text-slate-400 font-medium mb-1">Cargo</div>
                                <div className="text-[12px] font-bold text-slate-800">{cliente.cargo || "No especificado"}</div>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-xl">
                                <div className="text-[10px] text-slate-400 font-medium mb-1">Renta Líquida</div>
                                <div className="text-[12px] font-bold text-slate-800">{cliente.rentaLiquida ? `$${cliente.rentaLiquida.toLocaleString()}` : "No especificado"}</div>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-xl">
                                <div className="text-[10px] text-slate-400 font-medium mb-1">Banco Abono Renta</div>
                                <div className="text-[12px] font-bold text-slate-800">{cliente.bancoAbonoRenta || "No especificado"}</div>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-xl">
                                <div className="text-[10px] text-slate-400 font-medium mb-1">Fecha de Pago</div>
                                <div className="text-[12px] font-bold text-slate-800">{cliente.fechaPago || "No especificado"}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
