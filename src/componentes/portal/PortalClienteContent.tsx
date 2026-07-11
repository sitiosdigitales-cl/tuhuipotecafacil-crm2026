"use client";

import { useState, useMemo } from "react";
import {
  Search,
  FileText,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  User,
  Home,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Upload,
  Edit,
  Save,
  Info,
  Bell,
  MapPin,
  Briefcase,
  AlertCircle,
  FileCheck,
  FileClock,
  Trash2,
} from "lucide-react";
import { useLeads } from "@/lib/contexts/LeadContext";
import { ETAPAS_CONFIG, SITUACION_LABORAL_CONFIG } from "@/tipos";
import { formatoMonedaAbreviado, formatoUF, formatoMoneda } from "@/lib/utils";
import { toast } from "sonner";
import type { Lead, Etapa, SituacionLaboral } from "@/tipos";

const PASOS_PROGRESO = [
  { paso: 1, label: "Registro", etapa: "NUEVO_LEAD" as Etapa },
  { paso: 2, label: "Contacto", etapa: "CONTACTADO" as Etapa },
  { paso: 3, label: "Calificación", etapa: "CALIFICACION_COMERCIAL" as Etapa },
  { paso: 4, label: "Documentación", etapa: "DOCS_COMPLETAS" as Etapa },
  { paso: 5, label: "Evaluación", etapa: "EVALUACION_BANCARIA" as Etapa },
  { paso: 6, label: "Pre Aprobación", etapa: "PREAPROBADO" as Etapa },
  { paso: 7, label: "Aprobado", etapa: "APROBADO" as Etapa },
  { paso: 8, label: "Firma", etapa: "FIRMA_DIGITAL" as Etapa },
  { paso: 9, label: "Notaría", etapa: "NOTARIA" as Etapa },
  { paso: 10, label: "Desembolso", etapa: "CREDITO_PAGADO" as Etapa },
];

const DOCUMENTOS_CONFIG = {
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

interface PortalClienteContentProps {
  className?: string;
}

export function PortalClienteContent({ className = "" }: PortalClienteContentProps) {
  const { leads } = useLeads();
  const [rut, setRut] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [cliente, setCliente] = useState<Lead | null>(null);
  const [error, setError] = useState("");
  const [tabActiva, setTabActiva] = useState<"resumen" | "perfil" | "documentos">("resumen");
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [perfilEditado, setPerfilEditado] = useState({
    nombre: "", apellido: "", email: "", telefono: "",
    domicilioParticular: "", comunaCiudad: "",
    estadoCivil: "", fechaNacimiento: "", profesion: "",
    nombreEmpleador: "", cargo: "", rentaLiquida: "",
    situacionLaboral: "" as SituacionLaboral,
  });
  const [guardando, setGuardando] = useState(false);
  const [documentos, setDocumentos] = useState<{ id: string; nombre: string; estado: string; fecha?: string; tamaño?: number }[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [guardandoProgreso, setGuardandoProgreso] = useState(false);

  const rutsEjemplo = useMemo(() => leads.slice(0, 4).map((l) => ({
    rut: l.rut, nombre: `${l.nombre} ${l.apellido}`,
  })), [leads]);

  const handleBuscar = async () => {
    if (!rut.trim()) { setError("Ingresa un RUT"); return; }
    setBuscando(true); setError("");
    const norm = (r: string) => r.replace(/\./g, "").replace("-", "").replace(/\s/g, "").toLowerCase();
    const rutBuscado = norm(rut);
    const found = leads.find((l) => {
      const rutLead = norm(l.rut);
      return rutLead === rutBuscado || (rutBuscado.length >= 6 && rutLead.includes(rutBuscado));
    });
    if (found) { setCliente(found); setError(""); }
    else { setError("RUT no encontrado"); setCliente(null); }
    setBuscando(false);
  };

  const etapaActual = cliente ? PASOS_PROGRESO.findIndex((p) => p.etapa === cliente.etapa) + 1 : 0;
  const progreso = Math.max(1, Math.min(etapaActual, 10));
  const pasoActual = PASOS_PROGRESO.find((p) => p.etapa === cliente?.etapa);
  const configEstado = cliente ? ETAPAS_CONFIG[cliente.etapa] : null;
  const docsConfig = DOCUMENTOS_CONFIG[cliente?.situacionLaboral || "DEPENDIENTE"];
  const docsAprobados = Math.floor(Math.random() * 3) + 4;
  const docsTotal = docsConfig.length;

  const iniciarEdicion = () => {
    if (!cliente) return;
    setPerfilEditado({
      nombre: cliente.nombre, apellido: cliente.apellido,
      email: cliente.email || "", telefono: cliente.telefono || "",
      domicilioParticular: cliente.domicilioParticular || "",
      comunaCiudad: cliente.comunaCiudad || "",
      estadoCivil: cliente.estadoCivil || "",
      fechaNacimiento: cliente.fechaNacimiento || "",
      profesion: cliente.profesion || "",
      nombreEmpleador: cliente.nombreEmpleador || "",
      cargo: cliente.cargo || "",
      rentaLiquida: cliente.rentaLiquida?.toString() || "",
      situacionLaboral: cliente.situacionLaboral || "DEPENDIENTE",
    });
    setEditandoPerfil(true);
  };

  const guardarPerfil = async () => {
    if (!cliente) return;
    setGuardando(true);
    try {
      await fetch(`/api/leads/${cliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: perfilEditado.nombre, apellido: perfilEditado.apellido,
          email: perfilEditado.email, telefono: perfilEditado.telefono,
          domicilioParticular: perfilEditado.domicilioParticular,
          comunaCiudad: perfilEditado.comunaCiudad,
          estadoCivil: perfilEditado.estadoCivil,
          fechaNacimiento: perfilEditado.fechaNacimiento,
          profesion: perfilEditado.profesion,
          nombreEmpleador: perfilEditado.nombreEmpleador,
          cargo: perfilEditado.cargo,
          rentaLiquida: perfilEditado.rentaLiquida ? parseFloat(perfilEditado.rentaLiquida) : undefined,
          situacionLaboral: perfilEditado.situacionLaboral,
        }),
      });
      setCliente({
        ...cliente,
        nombre: perfilEditado.nombre,
        apellido: perfilEditado.apellido,
        email: perfilEditado.email,
        telefono: perfilEditado.telefono,
        domicilioParticular: perfilEditado.domicilioParticular,
        comunaCiudad: perfilEditado.comunaCiudad,
        estadoCivil: perfilEditado.estadoCivil,
        fechaNacimiento: perfilEditado.fechaNacimiento,
        profesion: perfilEditado.profesion,
        nombreEmpleador: perfilEditado.nombreEmpleador,
        cargo: perfilEditado.cargo,
        rentaLiquida: perfilEditado.rentaLiquida ? parseFloat(perfilEditado.rentaLiquida) : undefined,
        situacionLaboral: perfilEditado.situacionLaboral,
      });
      setEditandoPerfil(false);
      toast.success("Perfil actualizado correctamente");
    } catch { toast.error("Error al guardar"); }
    setGuardando(false);
  };

  // Funciones de documentos
  const handleSubirDocumento = async (files: FileList | null) => {
    if (!files || !cliente) return;
    setSubiendo(true);
    for (const file of Array.from(files)) {
      const nuevoDoc = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nombre: file.name,
        estado: "subido",
        fecha: new Date().toLocaleDateString("es-CL"),
        tamaño: file.size,
      };
      setDocumentos((prev) => [...prev, nuevoDoc]);
      toast.success("Documento subido", { description: file.name });
    }
    setSubiendo(false);
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setArrastrando(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setArrastrando(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setArrastrando(false);
    handleSubirDocumento(e.dataTransfer.files);
  };

  const eliminarDocumento = (id: string) => {
    setDocumentos((prev) => prev.filter((d) => d.id !== id));
    toast.success("Documento eliminado");
  };

  const formatTamano = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Función para actualizar etapa del crédito
  const actualizarEtapa = async (nuevaEtapa: Etapa) => {
    if (!cliente) return;
    setGuardandoProgreso(true);
    try {
      await fetch(`/api/leads/${cliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa: nuevaEtapa }),
      });
      setCliente({ ...cliente, etapa: nuevaEtapa });
      toast.success("Progreso actualizado", { description: `Movido a ${PASOS_PROGRESO.find(p => p.etapa === nuevaEtapa)?.label}` });
    } catch {
      toast.error("Error al actualizar");
    }
    setGuardandoProgreso(false);
  };

  // Vista de búsqueda
  if (!cliente) {
    return (
      <div className={`min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl ${className}`}>
        <div className="w-full max-w-lg px-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
              <Home size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Portal del Cliente</h1>
            <p className="text-sm text-slate-500">Consulta el estado de tu solicitud hipotecaria</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">RUT del Titular</label>
            <div className="flex gap-2">
              <input type="text" placeholder="12.345.678-9" value={rut}
                onChange={(e) => { setRut(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" />
              <button onClick={handleBuscar} disabled={buscando}
                className="h-12 px-6 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl text-sm font-semibold hover:from-teal-600 hover:to-cyan-700 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 flex items-center gap-2">
                {buscando ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={16} />}
                Buscar
              </button>
            </div>
            {error && <p className="text-red-500 text-[11px] mt-2 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
            {rutsEjemplo.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 mb-2">RUTs de prueba</p>
                <div className="grid grid-cols-2 gap-2">
                  {rutsEjemplo.map((e, i) => (
                    <button key={i} onClick={() => { setRut(e.rut); setError(""); }}
                      className="text-left p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-teal-50 hover:border-teal-200 transition-all">
                      <div className="text-[11px] font-bold text-slate-700">{e.rut}</div>
                      <div className="text-[10px] text-slate-400">{e.nombre}</div>
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

  const situacionConfig = SITUACION_LABORAL_CONFIG[cliente.situacionLaboral];

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Banner de Bienvenida */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Hola, {cliente.nombre} <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="text-sm text-slate-500 max-w-md">
              Bienvenido a tu portal. Aquí puedes hacer seguimiento de tu solicitud hipotecaria en tiempo real.
            </p>
          </div>
          <div className="hidden md:block w-72 bg-gradient-to-br from-teal-400 via-cyan-400 to-blue-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Home size={14} className="text-teal-600" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-800">Tu hogar te espera</div>
                    <div className="text-[9px] text-slate-500">Estamos trabajando para ti</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5">
        <div className="flex gap-1">
          {[
            { id: "resumen" as const, label: "Resumen", icono: <TrendingUp size={15} /> },
            { id: "documentos" as const, label: "Documentos", icono: <FileText size={15} /> },
            { id: "perfil" as const, label: "Mi Perfil", icono: <User size={15} /> },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setTabActiva(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                tabActiva === tab.id
                  ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}>
              {tab.icono} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tab Resumen */}
          {tabActiva === "resumen" && (
            <>
          {/* Estado de la Solicitud */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                <FileText size={18} className="text-teal-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Progreso de tu Crédito</h2>
                <p className="text-xs text-teal-600 font-semibold">{configEstado?.label || "En proceso"}</p>
              </div>
            </div>

            {/* Barra de Progreso Horizontal */}
            <div className="relative mb-8 px-4">
              <div className="flex items-center justify-between relative">
                {/* Línea conectora de fondo */}
                <div className="absolute top-6 left-[12%] right-[12%] h-1 bg-slate-100 rounded-full" />
                {/* Línea de progreso */}
                <div className="absolute top-6 left-[12%] h-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(0, ((progreso - 1) / 3) * 76)}%` }} />

                {PASOS_PROGRESO.slice(0, 4).map((paso, i) => {
                  const completado = progreso > i + 1;
                  const actual = progreso === i + 1;
                  return (
                    <div key={paso.paso} className="flex flex-col items-center relative z-10 w-1/4 cursor-pointer group"
                      onClick={() => actualizarEtapa(paso.etapa)}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all group-hover:scale-110 ${
                        completado ? "bg-teal-500 text-white shadow-md shadow-teal-500/30" :
                        actual ? "bg-teal-500 text-white ring-4 ring-teal-100 shadow-lg shadow-teal-500/30" :
                        "bg-white text-slate-400 border-2 border-slate-200 group-hover:border-teal-400"
                      }`}>
                        {completado ? <CheckCircle size={20} /> : i + 1}
                      </div>
                      <span className={`text-[11px] font-semibold mt-3 text-center ${
                        actual ? "text-teal-600" : completado ? "text-teal-600" : "text-slate-400"
                      }`}>{paso.label}</span>
                      <span className={`text-[10px] mt-1 ${
                        completado ? "text-emerald-500 font-semibold" : actual ? "text-teal-500 font-semibold" : "text-slate-300"
                      }`}>
                        {completado ? "Completado" : actual ? "En progreso" : "Pendiente"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mensaje Informativo */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info size={16} className="text-blue-500 flex-shrink-0" />
                {guardandoProgreso && (
                  <div className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                )}
                <p className="text-xs text-blue-700">
                  {pasoActual?.label === "Documentación"
                    ? "Hemos recibido tus documentos. Nuestro equipo los está revisando y pronto avanzaremos a la evaluación de tu perfil."
                    : `Tu solicitud se encuentra en la etapa: ${configEstado?.label}. Te notificaremos cuando haya novedades.`}
                </p>
              </div>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap flex items-center gap-1">
                Ver detalles <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Resumen de la Solicitud */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Resumen de tu solicitud</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {[
                  { icon: <Calendar size={16} />, label: "Fecha de inicio", value: cliente.creadoEn.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" }) },
                  { icon: <Home size={16} />, label: "Tipo de propiedad", value: "Propiedad residencial" },
                  { icon: <MapPin size={16} />, label: "Banco asignado", value: cliente.banco || "Por asignar" },
                  { icon: <DollarSign size={16} />, label: "Valor del crédito", value: `${formatoMonedaAbreviado(cliente.montoSolicitado || 0)} (${formatoUF(cliente.montoSolicitado || 0)})` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">{item.label}</div>
                      <div className="text-xs font-semibold text-slate-700">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Clock size={14} className="text-teal-600" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Próximo paso</div>
                    <div className="text-xs font-bold text-slate-800">{pasoActual?.label || "En proceso"}</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Te notificaremos por email cuando tengamos novedades sobre tu evaluación.
                </p>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button className="flex items-center gap-2 text-xs text-teal-600 hover:text-teal-700 font-semibold">
                <Info size={14} /> ¿Tienes dudas sobre el proceso? Revisa nuestras preguntas frecuentes
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Acciones rápidas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: <Upload size={18} />, label: "Subir documento", color: "bg-blue-50 text-blue-600" },
                { icon: <FileText size={18} />, label: "Nueva simulación", color: "bg-emerald-50 text-emerald-600" },
                { icon: <MessageSquare size={18} />, label: "Enviar mensaje", color: "bg-purple-50 text-purple-600" },
                { icon: <Calendar size={18} />, label: "Agendar reunión", color: "bg-amber-50 text-amber-600" },
              ].map((accion) => (
                <button key={accion.label}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/50 transition-all">
                  <div className={`w-10 h-10 ${accion.color} rounded-xl flex items-center justify-center`}>
                    {accion.icon}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700">{accion.label}</span>
                </button>
              ))}
            </div>
          </div>
            </>
          )}

          {/* Tab Documentos */}
          {tabActiva === "documentos" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Mis Documentos</h2>
                  <p className="text-[11px] text-slate-400">Sube los documentos requeridos para tu solicitud</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-teal-600">{documentos.length}</div>
                  <div className="text-[10px] text-slate-400">documentos</div>
                </div>
              </div>

              {/* Zona de subida */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input-portal")?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-6 ${
                  arrastrando
                    ? "border-teal-400 bg-teal-50"
                    : "border-slate-200 hover:border-teal-300 hover:bg-slate-50"
                }`}
              >
                <input
                  id="file-input-portal"
                  type="file"
                  multiple
                  onChange={(e) => handleSubirDocumento(e.target.files)}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    arrastrando ? "bg-teal-100" : "bg-slate-100"
                  }`}>
                    <Upload size={24} className={arrastrando ? "text-teal-500" : "text-slate-400"} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {arrastrando ? "Suelta los archivos aquí" : "Arrastra archivos o haz clic para subir"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      PDF, JPG, PNG, DOC - Máx. 10MB por archivo
                    </p>
                  </div>
                  {subiendo && (
                    <div className="flex items-center gap-2 text-[11px] text-teal-600">
                      <div className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                      Subiendo...
                    </div>
                  )}
                </div>
              </div>

              {/* Documentos Requeridos */}
              <div className="mb-6">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Documentos Requeridos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {DOCUMENTOS_CONFIG[cliente?.situacionLaboral || "DEPENDIENTE"].map((doc) => {
                    const subido = documentos.some((d) => d.nombre.toLowerCase().includes(doc.id));
                    return (
                      <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          subido ? "bg-emerald-100" : "bg-white border border-slate-200"
                        }`}>
                          {subido ? <CheckCircle size={14} className="text-emerald-500" /> : <FileText size={14} className="text-slate-400" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-[11px] font-semibold text-slate-700">{doc.nombre}</div>
                          {doc.obligatorio && <div className="text-[9px] text-red-500">Obligatorio</div>}
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                          subido ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {subido ? "Subido" : "Pendiente"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lista de documentos subidos */}
              {documentos.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Documentos Subidos</h3>
                  <div className="space-y-2">
                    {documentos.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                        <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                          <FileCheck size={16} className="text-teal-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-slate-700 truncate">{doc.nombre}</div>
                          <div className="text-[10px] text-slate-400">
                            {doc.tamaño ? formatTamano(doc.tamaño) : ""} {doc.fecha && `• ${doc.fecha}`}
                          </div>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                          En revisión
                        </span>
                        <button
                          onClick={() => eliminarDocumento(doc.id)}
                          className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={12} className="text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Mi Perfil */}
          {tabActiva === "perfil" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Mi Perfil</h2>
                  <p className="text-[11px] text-slate-400">Completa tu información para agilizar el proceso</p>
                </div>
                {!editandoPerfil && (
                  <button onClick={iniciarEdicion}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 text-white rounded-xl text-[11px] font-semibold hover:bg-teal-600 transition-colors shadow-md shadow-teal-500/20">
                    <Edit size={12} /> Editar
                  </button>
                )}
              </div>

              {editandoPerfil ? (
                <div className="space-y-5">
                  {/* Datos Personales */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Datos Personales</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Nombre", field: "nombre", type: "text", required: true },
                        { label: "Apellido", field: "apellido", type: "text", required: true },
                        { label: "Email", field: "email", type: "email", required: false },
                        { label: "Teléfono", field: "telefono", type: "tel", required: false },
                        { label: "Fecha Nacimiento", field: "fechaNacimiento", type: "date", required: false },
                        { label: "Estado Civil", field: "estadoCivil", type: "select", required: false },
                        { label: "Profesión", field: "profesion", type: "text", required: false },
                      ].map((item) => (
                        <div key={item.field}>
                          <label className="text-[10px] font-semibold text-slate-600 mb-1 block">
                            {item.label} {item.required && <span className="text-red-500">*</span>}
                          </label>
                          {item.type === "select" ? (
                            <select value={(perfilEditado as any)[item.field]}
                              onChange={(e) => setPerfilEditado({ ...perfilEditado, [item.field]: e.target.value })}
                              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all">
                              <option value="">Seleccionar</option>
                              <option value="Soltero/a">Soltero/a</option>
                              <option value="Casado/a">Casado/a</option>
                              <option value="Divorciado/a">Divorciado/a</option>
                              <option value="Viudo/a">Viudo/a</option>
                              <option value="Unión Civil">Unión Civil</option>
                            </select>
                          ) : (
                            <input type={item.type} value={(perfilEditado as any)[item.field]}
                              onChange={(e) => setPerfilEditado({ ...perfilEditado, [item.field]: e.target.value })}
                              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Domicilio */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Domicilio</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Dirección</label>
                        <input type="text" value={perfilEditado.domicilioParticular}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, domicilioParticular: e.target.value })}
                          placeholder="Dirección completa"
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Comuna / Ciudad</label>
                        <input type="text" value={perfilEditado.comunaCiudad}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, comunaCiudad: e.target.value })}
                          placeholder="Ej: Las Condes"
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Empleador */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Datos del Empleador</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Nombre Empresa</label>
                        <input type="text" value={perfilEditado.nombreEmpleador}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, nombreEmpleador: e.target.value })}
                          placeholder="Nombre de la empresa"
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Cargo</label>
                        <input type="text" value={perfilEditado.cargo}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, cargo: e.target.value })}
                          placeholder="Ej: Gerente"
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Renta Líquida</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">$</span>
                          <input type="number" value={perfilEditado.rentaLiquida}
                            onChange={(e) => setPerfilEditado({ ...perfilEditado, rentaLiquida: e.target.value })}
                            placeholder="0"
                            className="w-full h-10 pl-7 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Situación Laboral</label>
                        <select value={perfilEditado.situacionLaboral}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, situacionLaboral: e.target.value as SituacionLaboral })}
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all">
                          <option value="DEPENDIENTE">Dependiente</option>
                          <option value="INDEPENDIENTE">Independiente</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button onClick={() => setEditandoPerfil(false)}
                      className="px-5 py-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                      Cancelar
                    </button>
                    <button onClick={guardarPerfil} disabled={guardando}
                      className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white rounded-xl text-[11px] font-semibold hover:bg-teal-600 transition-all shadow-md shadow-teal-500/20 disabled:opacity-50">
                      {guardando ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
                      ) : (
                        <><Save size={12} /> Guardar Cambios</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Nombre completo", `${cliente.nombre} ${cliente.apellido}`],
                      ["RUT", cliente.rut],
                      ["Email", cliente.email || "No registrado"],
                      ["Teléfono", cliente.telefono || "No registrado"],
                      ["Estado Civil", cliente.estadoCivil || "No especificado"],
                      ["Fecha Nacimiento", cliente.fechaNacimiento || "No especificado"],
                      ["Profesión", cliente.profesion || "No especificado"],
                      ["Situación Laboral", situacionConfig?.label || "No definida"],
                    ].map(([label, value]) => (
                      <div key={label} className="p-3 bg-slate-50 rounded-xl">
                        <div className="text-[9px] text-slate-400 font-medium uppercase">{label}</div>
                        <div className="text-[12px] font-semibold text-slate-700 mt-0.5">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Domicilio", cliente.domicilioParticular || "No especificado"],
                      ["Comuna / Ciudad", cliente.comunaCiudad || "No especificado"],
                      ["Nombre Empleador", cliente.nombreEmpleador || "No especificado"],
                      ["Cargo", cliente.cargo || "No especificado"],
                      ["Renta Líquida", cliente.rentaLiquida ? formatoMoneda(cliente.rentaLiquida) : "No especificado"],
                    ].map(([label, value]) => (
                      <div key={label} className="p-3 bg-slate-50 rounded-xl">
                        <div className="text-[9px] text-slate-400 font-medium uppercase">{label}</div>
                        <div className="text-[12px] font-semibold text-slate-700 mt-0.5">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna Lateral */}
        <div className="space-y-5">
          {/* Tu Asesor */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Tu asesor</h3>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 text-xl font-bold flex-shrink-0">
                {cliente.nombreEjecutivo?.split(" ").map((n) => n[0]).join("") || "TH"}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">{cliente.nombreEjecutivo || "Sin asignar"}</div>
                <div className="text-[11px] text-slate-500">Asesor Hipotecario Senior</div>
              </div>
            </div>
            <div className="space-y-3">
              <a href={`tel:${cliente.telefono || "+56912345678"}`}
                className="flex items-center gap-3 text-xs text-slate-600 hover:text-teal-600 transition-colors">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                  <Phone size={14} className="text-slate-400" />
                </div>
                <span>{cliente.telefono || "+56 9 1234 5678"}</span>
              </a>
              <a href={`mailto:${cliente.email || "asesor@tuhipotecafacil.cl"}`}
                className="flex items-center gap-3 text-xs text-slate-600 hover:text-teal-600 transition-colors">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                  <Mail size={14} className="text-slate-400" />
                </div>
                <span>{cliente.email || "asesor@tuhipotecafacil.cl"}</span>
              </a>
              <button className="flex items-center gap-3 text-xs text-teal-600 hover:text-teal-700 font-semibold">
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                  <MessageSquare size={14} className="text-teal-600" />
                </div>
                <span>Enviar mensaje</span>
              </button>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="text-slate-500" />
                  <span className="text-[11px] font-semibold text-slate-700">Horario de atención</span>
                </div>
                <p className="text-[11px] text-slate-500">Lunes a Viernes de 09:00 a 18:30 hrs.</p>
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Documentos</h3>
              <button className="text-[11px] font-semibold text-teal-600 hover:text-teal-700">Ver todos</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Documentos entregados</span>
                <span className="text-xs font-bold text-teal-600">{docsAprobados} / {docsTotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Documentos pendientes</span>
                <span className="text-xs font-bold text-amber-600">{docsTotal - docsAprobados}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all"
                  style={{ width: `${(docsAprobados / docsTotal) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Alertas y Notificaciones */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Alertas y notificaciones</h3>
              <button className="text-[11px] font-semibold text-teal-600 hover:text-teal-700">Ver todas</button>
            </div>
            <div className="space-y-3">
              {[
                { icon: <CheckCircle size={14} />, text: "Hemos recibido tu liquidación de sueldo", time: "Hace 2 días", color: "text-emerald-500" },
                { icon: <Bell size={14} />, text: "Documento pendiente: Certificado AFP", time: "Hace 3 días", color: "text-amber-500" },
                { icon: <Clock size={14} />, text: "Tu evaluación está en proceso", time: "Hace 5 días", color: "text-blue-500" },
              ].map((notif, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-50 ${notif.color}`}>
                    {notif.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-700 font-medium">{notif.text}</p>
                    <p className="text-[10px] text-slate-400">{notif.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2.5 bg-slate-50 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1">
              Ver todas las notificaciones <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
