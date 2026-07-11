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
  TrendingUp,
  Award,
  Upload,
  Trash2,
  Eye,
  FileCheck,
  FileX,
  FileClock,
  Check,
  Sparkles,
  Edit,
  Save,
  CreditCard,
} from "lucide-react";
import { useLeads } from "@/lib/contexts/LeadContext";
import { ETAPAS_CONFIG, ORIGEN_LABELS, SITUACION_LABORAL_CONFIG, RENTAS_MENSUALES } from "@/tipos";
import { formatoMonedaAbreviado, formatoUF, formatoMoneda } from "@/lib/utils";
import { toast } from "sonner";
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

const DOCUMENTOS_POR_TIPO = {
  DEPENDIENTE: [
    { id: "cedula", nombre: "Cédula de Identidad", obligatorio: true },
    { id: "liq-sueldo", nombre: "Liquidaciones de Sueldo", obligatorio: true },
    { id: "afp", nombre: "Certificado AFP", obligatorio: true },
    { id: "antiguedad", nombre: "Certificado Antigüedad", obligatorio: true },
    { id: "domicilio", nombre: "Comprobante de Domicilio", obligatorio: true },
    { id: "dicom", nombre: "Informe DICOM", obligatorio: true },
  ],
  INDEPENDIENTE: [
    { id: "cedula", nombre: "Cédula de Identidad", obligatorio: true },
    { id: "carpeta-trib", nombre: "Carpeta Tributaria", obligatorio: true },
    { id: "renta", nombre: "Declaración de Renta", obligatorio: true },
    { id: "dicom", nombre: "Informe DICOM", obligatorio: true },
  ],
};

const estadoConfig: Record<string, { label: string; icono: React.ReactNode; color: string; bg: string; descripcion: string; paso: number }> = {
  NUEVO_LEAD: { label: "Solicitud Recibida", icono: <FileText size={16} />, color: "text-blue-600", bg: "bg-blue-50", descripcion: "Hemos recibido tu solicitud de crédito", paso: 1 },
  CONTACTO_INICIAL: { label: "Contacto Programado", icono: <Phone size={16} />, color: "text-indigo-600", bg: "bg-indigo-50", descripcion: "Un ejecutivo se comunicará contigo pronto", paso: 2 },
  CONTACTADO: { label: "En Contacto", icono: <Mail size={16} />, color: "text-purple-600", bg: "bg-purple-50", descripcion: "Ya nos comunicamos contigo", paso: 2 },
  INTERESADO: { label: "Proceso Activo", icono: <TrendingUp size={16} />, color: "text-pink-600", bg: "bg-pink-50", descripcion: "Estás avanzando en el proceso", paso: 3 },
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

interface PortalClienteContentProps {
  className?: string;
  initialClientId?: string;
}

export function PortalClienteContent({ className = "", initialClientId }: PortalClienteContentProps) {
  const { leads } = useLeads();
  const [rut, setRut] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [cliente, setCliente] = useState<Lead | null>(null);
  const [error, setError] = useState("");
  const [tabActiva, setTabActiva] = useState<"progreso" | "documentos" | "datos" | "perfil">("progreso");
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [perfilEditado, setPerfilEditado] = useState({
    nombre: "", apellido: "", email: "", telefono: "", domicilio: "", comunaCiudad: "",
    cargasLegales: "", estadoCivil: "", regimenMatrimonial: "", fechaNacimiento: "",
    estudios: "", profesion: "", valorArriendo: "", afp: "",
    nombreEmpleador: "", rutEmpresa: "", fechaIngreso: "", cargo: "", rentaLiquida: "",
    bancoAbonoRenta: "", fechaPago: "", direccionLaboral: "", comunaCiudadLaboral: "",
    telefonoLaboralFijo: "", emailLaboral: "", otrosIngresos: "",
    situacionLaboral: "" as SituacionLaboral, enDicom: false, dicomDetalle: "",
    rentaMensual: "", complementarRenta: false, tipoCredito: "", cuentaPie: false,
    montoSolicitado: "", valorPropiedad: "", pieDisponible: "", banco: "",
  });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [perfilGuardado, setPerfilGuardado] = useState(false);
  const [editandoProgreso, setEditandoProgreso] = useState(false);
  const [guardandoProgreso, setGuardandoProgreso] = useState(false);

  const rutsEjemplo = useMemo(() => {
    return leads.slice(0, 6).map((l) => ({
      rut: l.rut,
      nombre: `${l.nombre} ${l.apellido}`,
      etapa: ETAPAS_CONFIG[l.etapa]?.label || l.etapa,
    }));
  }, [leads]);

  const handleBuscar = async () => {
    if (!rut.trim()) { setError("Ingresa un RUT"); return; }
    setBuscando(true); setError("");
    const normalizarRut = (r: string) => r.replace(/\./g, "").replace("-", "").replace(/\s/g, "").toLowerCase();
    const rutIngresado = normalizarRut(rut);
    const leadEncontrado = leads.find((l) => {
      const rutLead = normalizarRut(l.rut);
      return rutLead === rutIngresado || (rutIngresado.length >= 6 && rutLead.includes(rutIngresado));
    });
    if (leadEncontrado) {
      setCliente(leadEncontrado); setError("");
    } else {
      setError("RUT no encontrado"); setCliente(null);
    }
    setBuscando(false);
  };

  const configEstado = cliente ? estadoConfig[cliente.etapa] : null;
  const etapaActual = configEstado?.paso || 0;
  const progreso = (etapaActual / 10) * 100;

  const iniciarEdicionPerfil = () => {
    if (!cliente) return;
    setPerfilEditado({
      nombre: cliente.nombre || "", apellido: cliente.apellido || "", email: cliente.email || "",
      telefono: cliente.telefono || "", domicilio: cliente.domicilioParticular || "",
      comunaCiudad: cliente.comunaCiudad || "", cargasLegales: cliente.cargasLegales || "",
      estadoCivil: cliente.estadoCivil || "", regimenMatrimonial: cliente.regimenMatrimonial || "",
      fechaNacimiento: cliente.fechaNacimiento || "", estudios: cliente.estudios || "",
      profesion: cliente.profesion || "", valorArriendo: cliente.valorArriendo?.toString() || "",
      afp: cliente.afp || "", nombreEmpleador: cliente.nombreEmpleador || "",
      rutEmpresa: cliente.rutEmpresa || "", fechaIngreso: cliente.fechaIngreso || "",
      cargo: cliente.cargo || "", rentaLiquida: cliente.rentaLiquida?.toString() || "",
      bancoAbonoRenta: cliente.bancoAbonoRenta || "", fechaPago: cliente.fechaPago || "",
      direccionLaboral: cliente.direccionLaboral || "", comunaCiudadLaboral: cliente.comunaCiudadLaboral || "",
      telefonoLaboralFijo: cliente.telefonoLaboralFijo || "", emailLaboral: cliente.emailLaboral || "",
      otrosIngresos: cliente.otrosIngresos || "", situacionLaboral: cliente.situacionLaboral || "DEPENDIENTE",
      enDicom: cliente.enDicom || false, dicomDetalle: cliente.dicomDetalle || "",
      rentaMensual: cliente.rentaMensual || "", complementarRenta: cliente.complementarRenta || false,
      tipoCredito: cliente.tipoCredito || "", cuentaPie: cliente.cuentaPie || false,
      montoSolicitado: cliente.montoSolicitado?.toString() || "",
      valorPropiedad: cliente.valorPropiedad?.toString() || "",
      pieDisponible: cliente.pieDisponible?.toString() || "", banco: cliente.banco || "",
    });
    setEditandoPerfil(true);
  };

  const guardarPerfil = async () => {
    if (!cliente) return;
    setGuardandoPerfil(true);
    const datos = {
      nombre: perfilEditado.nombre, apellido: perfilEditado.apellido, email: perfilEditado.email,
      telefono: perfilEditado.telefono, domicilioParticular: perfilEditado.domicilio,
      comunaCiudad: perfilEditado.comunaCiudad, situacionLaboral: perfilEditado.situacionLaboral,
      enDicom: perfilEditado.enDicom, tipoCredito: perfilEditado.tipoCredito,
      cuentaPie: perfilEditado.cuentaPie, banco: perfilEditado.banco || undefined,
      montoSolicitado: perfilEditado.montoSolicitado ? parseFloat(perfilEditado.montoSolicitado) : undefined,
      valorPropiedad: perfilEditado.valorPropiedad ? parseFloat(perfilEditado.valorPropiedad) : undefined,
      pieDisponible: perfilEditado.pieDisponible ? parseFloat(perfilEditado.pieDisponible) : undefined,
    };
    try {
      await fetch(`/api/leads/${cliente.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) });
      setCliente({ ...cliente, ...datos });
      setEditandoPerfil(false); setPerfilGuardado(true);
      toast.success("Perfil actualizado");
      setTimeout(() => setPerfilGuardado(false), 3000);
    } catch { toast.error("Error al guardar"); }
    setGuardandoPerfil(false);
  };

  const actualizarEtapaProgreso = async (nuevaEtapa: Etapa) => {
    if (!cliente) return;
    setGuardandoProgreso(true);
    try {
      await fetch(`/api/leads/${cliente.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ etapa: nuevaEtapa }) });
      setCliente({ ...cliente, etapa: nuevaEtapa });
      toast.success("Etapa actualizada");
    } catch { toast.error("Error al actualizar"); }
    setGuardandoProgreso(false);
  };

  // Vista de búsqueda
  if (!cliente) {
    return (
      <div className={`bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-8 ${className}`}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4 border border-white/20">
            <Sparkles size={14} className="text-white" />
            <span className="text-[11px] font-semibold text-white">Consulta en tiempo real</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Portal del Cliente</h2>
          <p className="text-sm text-blue-200/70">Ingresa el RUT del cliente para ver su estado</p>
        </div>
        <div className="max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <label className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-3 block">RUT del Titular</label>
            <div className="flex gap-2">
              <input type="text" placeholder="Ej: 12.345.678-9" value={rut}
                onChange={(e) => { setRut(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              <button onClick={handleBuscar} disabled={buscando}
                className="px-5 py-3 bg-white text-blue-900 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all disabled:opacity-50">
                {buscando ? "..." : <><Search size={16} /> Buscar</>}
              </button>
            </div>
            {error && <p className="text-red-400 text-[11px] mt-2">{error}</p>}
            {rutsEjemplo.length > 0 && (
              <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] font-bold text-blue-200 mb-2">RUTs de prueba</p>
                <div className="grid grid-cols-2 gap-2">
                  {rutsEjemplo.map((e, i) => (
                    <button key={i} onClick={() => { setRut(e.rut); setError(""); }}
                      className="text-left p-2 bg-white/10 rounded-lg border border-white/10 hover:bg-white/20 transition-all">
                      <div className="text-[10px] font-bold text-white">{e.rut}</div>
                      <div className="text-[9px] text-blue-200/70">{e.nombre}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vista del cliente
  const config = ETAPAS_CONFIG[cliente.etapa];
  const situacionConfig = SITUACION_LABORAL_CONFIG[cliente.situacionLaboral];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header del cliente */}
      <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-lg font-bold border border-white/30">
                {cliente.nombre[0]}{cliente.apellido[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold">{cliente.nombre} {cliente.apellido}</h3>
                <p className="text-blue-200 text-[11px]">RUT: {cliente.rut}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20">{configEstado?.label}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-blue-200 uppercase">Monto Solicitado</div>
              <div className="text-xl font-bold">{formatoMonedaAbreviado(cliente.montoSolicitado || 0)}</div>
              <button onClick={() => { setCliente(null); setRut(""); }} className="mt-2 text-[10px] text-blue-200 hover:text-white underline">Cambiar cliente</button>
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
              <button key={tab.id} onClick={() => setTabActiva(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-[11px] font-semibold transition-colors border-b-2 ${
                  tabActiva === tab.id ? "text-blue-600 border-blue-600 bg-blue-50/50" : "text-slate-500 border-transparent hover:text-slate-700"
                }`}>
                {tab.icono} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {/* Tab Progreso */}
          {tabActiva === "progreso" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-900">Progreso de tu Crédito</h4>
                <div className="flex items-center gap-2">
                  {guardandoProgreso && <span className="text-[10px] text-blue-500">Guardando...</span>}
                  <button onClick={() => setEditandoProgreso(!editandoProgreso)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold ${editandoProgreso ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                    {editandoProgreso ? <><Check size={12} /> Finalizar</> : <><Edit size={12} /> Editar</>}
                  </button>
                </div>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-5">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all" style={{ width: `${progreso}%` }} />
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-5 left-[5%] right-[5%] h-0.5 bg-slate-200" />
                  <div className="absolute top-5 left-[5%] h-0.5 bg-emerald-500 transition-all" style={{ width: `${Math.max(0, (progreso / 100) * 90)}%` }} />
                  {PASOS_PROGRESO.map((paso) => {
                    const esCompletado = etapaActual > paso.paso;
                    const esActual = etapaActual === paso.paso;
                    return (
                      <div key={paso.paso} className="relative z-10 flex flex-col items-center gap-2 cursor-pointer"
                        onClick={() => editandoProgreso && actualizarEtapaProgreso(paso.etapa)}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          esActual ? "bg-blue-500 text-white shadow-lg ring-4 ring-blue-100" :
                          esCompletado ? "bg-emerald-500 text-white" : "bg-white text-slate-400 border-2 border-slate-200"
                        } ${editandoProgreso ? "hover:scale-110 hover:border-blue-400" : ""}`}>
                          {esCompletado ? <Check size={16} /> : paso.icono}
                        </div>
                        <span className={`text-[9px] font-semibold text-center max-w-[60px] ${esActual ? "text-blue-700" : esCompletado ? "text-emerald-700" : "text-slate-400"}`}>
                          {paso.label}
                        </span>
                        {esActual && <span className="text-[7px] font-bold px-1.5 py-0.5 bg-blue-500 text-white rounded-full">ACTUAL</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              {editandoProgreso && <p className="text-[10px] text-blue-600 mt-3 text-center">Haz clic en un paso para mover la etapa</p>}
            </div>
          )}

          {/* Tab Datos del Crédito */}
          {tabActiva === "datos" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase">Información del Crédito</h4>
                {[
                  ["Tipo de Crédito", cliente.tipoCredito || "Hipotecario"],
                  ["Monto Solicitado", formatoMonedaAbreviado(cliente.montoSolicitado || 0)],
                  ["Valor Propiedad", formatoMonedaAbreviado(cliente.valorPropiedad || 0)],
                  ["Pie Disponible", formatoMonedaAbreviado(cliente.pieDisponible || 0)],
                  ["Banco", cliente.banco || "Por asignar"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[11px] text-slate-500">{label}</span>
                    <span className="text-[11px] font-bold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase">Documentos Requeridos</h4>
                {(DOCUMENTOS_POR_TIPO[cliente.situacionLaboral] || DOCUMENTOS_POR_TIPO.DEPENDIENTE).map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                    <FileText size={12} className="text-slate-400" />
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold text-slate-800">{doc.nombre}</div>
                      {doc.obligatorio && <div className="text-[8px] text-red-500">Obligatorio</div>}
                    </div>
                    <span className="text-[8px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Pendiente</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Perfil */}
          {tabActiva === "perfil" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-900">Mi Perfil</h4>
                {!editandoPerfil && (
                  <button onClick={iniciarEdicionPerfil} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[11px] font-semibold">
                    <Edit size={12} /> Editar
                  </button>
                )}
              </div>
              {perfilGuardado && <div className="mb-3 p-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-700">Perfil actualizado</div>}
              {editandoPerfil ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Nombre", "nombre", "text"], ["Apellido", "apellido", "text"],
                      ["Email", "email", "email"], ["Teléfono", "telefono", "tel"],
                    ].map(([label, field, type]) => (
                      <div key={field}>
                        <label className="text-[10px] font-semibold text-slate-600">{label}</label>
                        <input type={type} value={(perfilEditado as any)[field]}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, [field]: e.target.value })}
                          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-[11px] mt-1" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setEditandoPerfil(false)} className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button onClick={guardarPerfil} disabled={guardandoPerfil} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[11px] font-semibold">
                      {guardandoPerfil ? "Guardando..." : <><Save size={12} /> Guardar</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Nombre completo", `${cliente.nombre} ${cliente.apellido}`],
                    ["RUT", cliente.rut], ["Email", cliente.email || "No registrado"],
                    ["Teléfono", cliente.telefono || "No registrado"],
                    ["Situación Laboral", situacionConfig?.label || "No definida"],
                    ["Estado Civil", cliente.estadoCivil || "No especificado"],
                  ].map(([label, value]) => (
                    <div key={label} className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[9px] text-slate-400 font-medium uppercase">{label}</div>
                      <div className="text-[11px] font-bold text-slate-800 mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Documentos */}
          {tabActiva === "documentos" && (
            <div className="text-center py-8">
              <FileText size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-[12px] text-slate-500">Los documentos se gestionan desde el perfil del cliente</p>
              <p className="text-[10px] text-slate-400 mt-1">Ve a la pestaña Documentos en el perfil del cliente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
