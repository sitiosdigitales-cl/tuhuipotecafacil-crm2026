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
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [perfilEditado, setPerfilEditado] = useState({ nombre: "", apellido: "", email: "", telefono: "" });
  const [guardando, setGuardando] = useState(false);

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
    setPerfilEditado({ nombre: cliente.nombre, apellido: cliente.apellido, email: cliente.email || "", telefono: cliente.telefono || "" });
    setEditandoPerfil(true);
  };

  const guardarPerfil = async () => {
    if (!cliente) return;
    setGuardando(true);
    try {
      await fetch(`/api/leads/${cliente.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(perfilEditado) });
      setCliente({ ...cliente, ...perfilEditado });
      setEditandoPerfil(false);
      toast.success("Perfil actualizado");
    } catch { toast.error("Error al guardar"); }
    setGuardando(false);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Estado de la Solicitud */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                <FileText size={18} className="text-teal-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Estado de tu solicitud</h2>
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
                    <div key={paso.paso} className="flex flex-col items-center relative z-10 w-1/4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        completado ? "bg-teal-500 text-white shadow-md shadow-teal-500/30" :
                        actual ? "bg-teal-500 text-white ring-4 ring-teal-100 shadow-lg shadow-teal-500/30" :
                        "bg-white text-slate-400 border-2 border-slate-200"
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
