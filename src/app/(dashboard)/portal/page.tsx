"use client";

import { useState, useEffect } from "react";
import {
  Search,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  DollarSign,
  TrendingUp,
  Building2,
  Home,
  User,
  Shield,
  Download,
  Eye,
  ChevronRight,
  ArrowLeft,
  CreditCard,
  Sparkles,
  Upload,
} from "lucide-react";
import { formatoMoneda, formatoUF } from "@/lib/utils";
import type { Lead } from "@/tipos";

const RUTS_PRUEBA = [
  { rut: "9.942.494-8", nombre: "María Silva", estado: "Nuevo Lead" },
  { rut: "24.553.496-7", nombre: "Carlos Rojas", estado: "Nuevo Lead" },
  { rut: "7.868.319-6", nombre: "Carlos López", estado: "Nuevo Lead" },
  { rut: "21.057.659-6", nombre: "Diego López", estado: "Nuevo Lead" },
  { rut: "20.345.923-8", nombre: "Carlos Silva", estado: "Nuevo Lead" },
  { rut: "9.881.331-7", nombre: "Juan Sánchez", estado: "Nuevo Lead" },
];

const ETAPAS_CREDITO = [
  { id: "NUEVO_LEAD", label: "Registro", icono: User, completada: true },
  { id: "CONTACTO_INICIAL", label: "Contacto", icono: Phone, completada: true },
  { id: "CALIFICACION_COMERCIAL", label: "Calificación", icono: Shield, completada: true },
  { id: "DOCS_PENDIENTES", label: "Documentación", icono: FileText, completada: false, actual: true },
  { id: "EVALUACION_BANCARIA", label: "Evaluación", icono: Building2, completada: false },
  { id: "PREAPROBADO", label: "Pre Aprobación", icono: Clock, completada: false },
  { id: "APROBADO", label: "Aprobado", icono: CheckCircle, completada: false },
  { id: "FIRMA_DIGITAL", label: "Firma", icono: FileText, completada: false },
  { id: "NOTARIA", label: "Notaría", icono: Building2, completada: false },
  { id: "CREDITO_PAGADO", label: "Desembolso", icono: DollarSign, completada: false },
];

const estadoDocConfig: Record<string, { label: string; color: string; bg: string }> = {
  APROBADO: { label: "Aprobado", color: "text-emerald-600", bg: "bg-emerald-50" },
  EN_REVISION: { label: "En Revisión", color: "text-amber-600", bg: "bg-amber-50" },
  PENDIENTE: { label: "Pendiente", color: "text-slate-500", bg: "bg-slate-50" },
  RECIBIDO: { label: "Recibido", color: "text-blue-600", bg: "bg-blue-50" },
  RECHAZADO: { label: "Rechazado", color: "text-red-600", bg: "bg-red-50" },
};

export default function PortalPage() {
  const [rutIngresado, setRutIngresado] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Lead | null>(null);
  const [error, setError] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    async function cargarLeads() {
      try {
        const res = await fetch("/api/leads");
        const json = await res.json();
        if (json.success && json.data) {
          setLeads(json.data.map((l: Record<string, any>) => ({
            ...l,
            creadoEn: l.creadoEn ? new Date(l.creadoEn) : new Date(),
          })));
        }
      } catch {
        setLeads([]);
      }
    }
    cargarLeads();
  }, []);

  const handleBuscar = () => {
    setError("");
    setBuscando(true);

    setTimeout(() => {
      const cliente = leads.find(
        (l) => l.rut === rutIngresado
      );

      if (cliente) {
        setClienteSeleccionado(cliente);
        setError("");
      } else {
        setError("No se encontró ningún cliente con ese RUT");
        setClienteSeleccionado(null);
      }
      setBuscando(false);
    }, 800);
  };

  const handleSeleccionarRut = (rut: string) => {
    setRutIngresado(rut);
    setError("");
  };

  const handleVolver = () => {
    setClienteSeleccionado(null);
    setRutIngresado("");
    setError("");
  };

  // Portal Login - Nuevo Diseño
  if (!clienteSeleccionado) {
    return (
      <div className="min-h-[calc(100vh-100px)] flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="w-full max-w-2xl px-4">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-[11px] font-semibold border border-white/20">
              <Sparkles size={14} />
              Consulta en tiempo real
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Consulta tu Crédito Hipotecario
            </h1>
            <p className="text-sm text-blue-200/70 max-w-md mx-auto">
              Ingresa tu RUT para conocer el estado actual de tu solicitud y subir documentos requeridos
            </p>
          </div>

          {/* Card principal */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6 sm:p-8">
            {/* Input RUT */}
            <div className="mb-6">
              <label className="text-[10px] font-bold text-blue-200/70 uppercase tracking-widest block mb-3">
                RUT DEL TITULAR
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/50" />
                  <input
                    type="text"
                    value={rutIngresado}
                    onChange={(e) => {
                      setRutIngresado(e.target.value);
                      setError("");
                    }}
                    placeholder="Ej: 12.345.678-9"
                    className="w-full h-14 pl-12 pr-4 bg-white/10 border border-white/20 rounded-2xl text-base text-white placeholder:text-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all font-mono"
                    onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                  />
                </div>
                <button
                  onClick={handleBuscar}
                  disabled={!rutIngresado || buscando}
                  className="h-14 px-8 bg-white text-blue-900 rounded-2xl text-sm font-semibold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                >
                  {buscando ? (
                    <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-900 rounded-full animate-spin" />
                  ) : (
                    <Search size={18} />
                  )}
                  Consultar
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl mb-6">
                <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            {/* RUTs de prueba */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-xs font-bold text-blue-200">RUTs de prueba disponibles</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {RUTS_PRUEBA.map((item) => (
                  <button
                    key={item.rut}
                    onClick={() => handleSeleccionarRut(item.rut)}
                    className={`text-left p-4 bg-white/10 border-2 rounded-xl transition-all hover:bg-white/20 hover:border-white/30 ${
                      rutIngresado === item.rut ? "border-blue-400 shadow-md" : "border-white/10"
                    }`}
                  >
                    <div className="text-sm font-bold text-white font-mono">{item.rut}</div>
                    <div className="text-xs text-blue-200/70 mt-1">{item.nombre}</div>
                    <div className="text-[10px] text-blue-300 font-semibold mt-1">{item.estado}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-blue-200/50">
              ¿No tienes tu RUT? Contacta a tu ejecutivo comercial
            </p>
            <a href="tel:+56221234567" className="text-sm text-white font-semibold hover:text-blue-200">
              +56 2 2123 4567
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Portal Dashboard
  const docsAprobados = 3;
  const docsTotal = 5;
  const porcentajeDocs = Math.round((docsAprobados / docsTotal) * 100);
  const pasoActual = 4;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleVolver}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold mb-1">
                Hola, {clienteSeleccionado.nombre}
              </h1>
              <p className="text-blue-200 text-[11px]">
                Aquí puedes ver el estado de tu crédito hipotecario
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{pasoActual}</div>
              <div className="text-[10px] text-blue-200">de {ETAPAS_CREDITO.length} etapas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progreso del crédito */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Progreso de tu Crédito</h3>
        <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2">
          {ETAPAS_CREDITO.map((etapa, idx) => {
            const IconoEtapa = etapa.icono;
            const esActual = etapa.actual;
            const completada = etapa.completada;
            return (
              <div key={etapa.id} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      completada
                        ? "bg-emerald-500 text-white"
                        : esActual
                        ? "bg-blue-500 text-white ring-4 ring-blue-100"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {completada ? <CheckCircle size={18} /> : <IconoEtapa size={18} />}
                  </div>
                  <span
                    className={`text-[9px] font-semibold mt-1.5 ${
                      completada || esActual ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {etapa.label}
                  </span>
                </div>
                {idx < ETAPAS_CREDITO.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${
                      completada ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
            style={{ width: `${(pasoActual / ETAPAS_CREDITO.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info del crédito */}
        <div className="lg:col-span-2 space-y-5">
          {/* Datos del crédito */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-blue-500" />
              Datos de tu Crédito
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-100/50">
                <div className="text-[9px] text-blue-500 font-bold uppercase tracking-wider mb-1">Monto Solicitado</div>
                <div className="text-lg font-bold text-blue-700">{formatoMoneda(clienteSeleccionado.montoSolicitado || 0)}</div>
                <div className="text-[10px] text-blue-500 font-medium">{formatoUF(clienteSeleccionado.montoSolicitado || 0)}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-100/50">
                <div className="text-[9px] text-purple-500 font-bold uppercase tracking-wider mb-1">Valor Propiedad</div>
                <div className="text-lg font-bold text-purple-700">{formatoMoneda(clienteSeleccionado.valorPropiedad || 0)}</div>
                <div className="text-[10px] text-purple-500 font-medium">{formatoUF(clienteSeleccionado.valorPropiedad || 0)}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-100/50">
                <div className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider mb-1">Pie Disponible</div>
                <div className="text-lg font-bold text-emerald-700">{formatoMoneda(clienteSeleccionado.pieDisponible || 0)}</div>
                <div className="text-[10px] text-emerald-500 font-medium">{formatoUF(clienteSeleccionado.pieDisponible || 0)}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-100/50">
                <div className="text-[9px] text-amber-500 font-bold uppercase tracking-wider mb-1">Banco</div>
                <div className="text-lg font-bold text-amber-700 flex items-center gap-2">
                  <Building2 size={16} />
                  {clienteSeleccionado.banco || "Por asignar"}
                </div>
                <div className="text-[10px] text-amber-500 font-medium">{clienteSeleccionado.tipoCredito || "Hipotecario"}</div>
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText size={16} className="text-purple-500" />
                Documentos
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                {docsAprobados}/{docsTotal} aprobados
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                style={{ width: `${porcentajeDocs}%` }}
              />
            </div>
            <div className="space-y-2">
              {[
                { nombre: "Cédula de Identidad", estado: "APROBADO", fecha: new Date(Date.now() - 25 * 86400000) },
                { nombre: "Contrato de Trabajo", estado: "APROBADO", fecha: new Date(Date.now() - 20 * 86400000) },
                { nombre: "Comprobante de Ingresos", estado: "EN_REVISION", fecha: new Date(Date.now() - 10 * 86400000) },
                { nombre: "Certificado AFP", estado: "PENDIENTE", fecha: null },
                { nombre: "Valorización", estado: "PENDIENTE", fecha: null },
              ].map((doc, idx) => {
                const config = estadoDocConfig[doc.estado];
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center`}>
                        <FileText size={14} className={config.color} />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-700">{doc.nombre}</div>
                        {doc.fecha && (
                          <div className="text-[9px] text-slate-400">
                            Subido: {doc.fecha.toLocaleDateString("es-CL")}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      {doc.estado === "PENDIENTE" && (
                        <button className="p-1.5 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors">
                          <Upload size={12} className="text-blue-600" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-5">
          {/* Contacto */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User size={16} className="text-blue-500" />
              Tu Ejecutivo
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center text-white text-[12px] font-bold">
                {clienteSeleccionado.nombreEjecutivo?.split(" ").map((n) => n[0]).join("") || "SC"}
              </div>
              <div>
                <div className="text-[12px] font-bold text-slate-800">{clienteSeleccionado.nombreEjecutivo || "Sin asignar"}</div>
                <div className="text-[10px] text-slate-400">Ejecutivo Comercial</div>
              </div>
            </div>
            <div className="space-y-2">
              <a
                href="tel:+56912345678"
                className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Phone size={14} className="text-emerald-500" />
                <span className="text-[11px] text-slate-600">+56 9 1234 5678</span>
              </a>
              <a
                href="mailto:ejecutivo@tuhipotecafacil.cl"
                className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Mail size={14} className="text-blue-500" />
                <span className="text-[11px] text-slate-600">ejecutivo@tuhipotecafacil.cl</span>
              </a>
              <button className="w-full flex items-center justify-center gap-2 p-2.5 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                <MessageSquare size={14} className="text-green-500" />
                <span className="text-[11px] text-green-600 font-semibold">WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Próximos pasos */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" />
              Próximos Pasos
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                <div className="w-5 h-5 bg-amber-100 rounded-md flex items-center justify-center">
                  <FileText size={10} className="text-amber-600" />
                </div>
                <span className="text-[10px] text-slate-600">Enviar Certificado AFP</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                <div className="w-5 h-5 bg-amber-100 rounded-md flex items-center justify-center">
                  <FileText size={10} className="text-amber-600" />
                </div>
                <span className="text-[10px] text-slate-600">Enviar Valorización</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                <div className="w-5 h-5 bg-blue-100 rounded-md flex items-center justify-center">
                  <Phone size={10} className="text-blue-600" />
                </div>
                <span className="text-[10px] text-slate-600">Esperar respuesta del banco</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
