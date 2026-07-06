"use client";

import { useState } from "react";
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
  Bell,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Info,
  CreditCard,
  Hash,
  MapPin,
} from "lucide-react";
import { formatoMoneda, formatoUF } from "@/lib/utils";

// Datos mock de clientes para el portal
const CLIENTES_PORTAL = [
  {
    id: "lead-1",
    nombre: "María González",
    apellido: "González",
    rut: "15.234.567-8",
    email: "maria@email.com",
    telefono: "+56 9 1234 5678",
    etapa: "EVALUACION_BANCARIA",
    etapaLabel: "Evaluación Bancaria",
    banco: "Banco Estado",
    tipoCredito: "Hipotecario",
    montoSolicitado: 150000000,
    valorPropiedad: 180000000,
    pieDisponible: 30000000,
    fechaInicio: new Date(Date.now() - 30 * 86400000),
    ultimoContacto: new Date(Date.now() - 2 * 86400000),
    documentos: [
      { nombre: "Cédula de Identidad", estado: "APROBADO", fecha: new Date(Date.now() - 25 * 86400000) },
      { nombre: "Contrato de Trabajo", estado: "APROBADO", fecha: new Date(Date.now() - 20 * 86400000) },
      { nombre: "Comprobante de Ingresos", estado: "EN_REVISION", fecha: new Date(Date.now() - 10 * 86400000) },
      { nombre: "Certificado AFP", estado: "PENDIENTE", fecha: null },
      { nombre: "Valorización", estado: "PENDIENTE", fecha: null },
    ],
    actividades: [
      { fecha: new Date(Date.now() - 2 * 86400000), titulo: "Documentos enviados al banco", tipo: "documento" },
      { fecha: new Date(Date.now() - 5 * 86400000), titulo: "Llamada de seguimiento realizada", tipo: "llamada" },
      { fecha: new Date(Date.now() - 10 * 86400000), titulo: "Evaluación bancaria iniciada", tipo: "sistema" },
      { fecha: new Date(Date.now() - 15 * 86400000), titulo: "Documentación completa recibida", tipo: "documento" },
      { fecha: new Date(Date.now() - 20 * 86400000), titulo: "Propuesta comercial enviada", tipo: "email" },
    ],
  },
  {
    id: "lead-2",
    nombre: "Carlos",
    apellido: "Rojas",
    rut: "18.345.678-9",
    email: "carlos@email.com",
    telefono: "+56 9 2345 6789",
    etapa: "DOCS_PENDIENTES",
    etapaLabel: "Documentos Pendientes",
    banco: "Santander",
    tipoCredito: "Hipotecario",
    montoSolicitado: 120000000,
    valorPropiedad: 150000000,
    pieDisponible: 30000000,
    fechaInicio: new Date(Date.now() - 15 * 86400000),
    ultimoContacto: new Date(Date.now() - 1 * 86400000),
    documentos: [
      { nombre: "Cédula de Identidad", estado: "APROBADO", fecha: new Date(Date.now() - 10 * 86400000) },
      { nombre: "Certificado AFP", estado: "PENDIENTE", fecha: null },
      { nombre: "Comprobante de Domicilio", estado: "PENDIENTE", fecha: null },
    ],
    actividades: [
      { fecha: new Date(Date.now() - 1 * 86400000), titulo: "Recordatorio de documentos enviado", tipo: "whatsapp" },
      { fecha: new Date(Date.now() - 3 * 86400000), titulo: "Primera llamada de contacto", tipo: "llamada" },
    ],
  },
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
  RECHAZADO: { label: "Rechazado", color: "text-red-600", bg: "bg-red-50" },
};

export default function PortalPage() {
  const [rutIngresado, setRutIngresado] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<typeof CLIENTES_PORTAL[0] | null>(null);
  const [error, setError] = useState("");
  const [buscando, setBuscando] = useState(false);

  const handleBuscar = () => {
    setError("");
    setBuscando(true);

    setTimeout(() => {
      const cliente = CLIENTES_PORTAL.find(
        (c) => c.rut === rutIngresado || c.id === rutIngresado
      );

      if (cliente) {
        setClienteSeleccionado(cliente);
        setError("");
      } else {
        setError("No se encontró ningún cliente con ese RUT");
        setClienteSeleccionado(null);
      }
      setBuscando(false);
    }, 1000);
  };

  const handleVolver = () => {
    setClienteSeleccionado(null);
    setRutIngresado("");
    setError("");
  };

  // Portal Login
  if (!clienteSeleccionado) {
    return (
      <div className="min-h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-100/80 shadow-soft p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
              <Home size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Portal del Cliente</h1>
            <p className="text-[12px] text-slate-400 mb-8">
              Consulta el estado de tu crédito hipotecario
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-700 text-left block">
                  Ingresa tu RUT
                </label>
                <input
                  type="text"
                  value={rutIngresado}
                  onChange={(e) => setRutIngresado(e.target.value)}
                  placeholder="15.234.567-8"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200/60 rounded-xl text-[14px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all text-center font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-[11px] text-red-600">{error}</span>
                </div>
              )}

              <button
                onClick={handleBuscar}
                disabled={!rutIngresado || buscando}
                className="w-full h-12 bg-blue-600 text-white rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {buscando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search size={16} /> Consultar Estado
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <p className="text-[10px] text-slate-400">
                ¿No tienes tu RUT? Contacta a tu ejecutivo comercial
              </p>
              <p className="text-[10px] text-blue-500 font-semibold mt-1">
                +56 2 2123 4567
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Portal Dashboard
  const docsAprobados = clienteSeleccionado.documentos.filter((d) => d.estado === "APROBADO").length;
  const docsTotal = clienteSeleccionado.documentos.length;
  const porcentajeDocs = docsTotal > 0 ? Math.round((docsAprobados / docsTotal) * 100) : 0;

  const pasoActual = ETAPAS_CREDITO.findIndex((e) => e.actual) + 1;

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
        <div className="flex items-center justify-between mb-4">
          {ETAPAS_CREDITO.map((etapa, idx) => {
            const IconoEtapa = etapa.icono;
            const esActual = etapa.actual;
            const completada = etapa.completada;
            return (
              <div key={etapa.id} className="flex items-center">
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
                <div className="text-lg font-bold text-blue-700">{formatoMoneda(clienteSeleccionado.montoSolicitado)}</div>
                <div className="text-[10px] text-blue-500 font-medium">{formatoUF(clienteSeleccionado.montoSolicitado)}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-100/50">
                <div className="text-[9px] text-purple-500 font-bold uppercase tracking-wider mb-1">Valor Propiedad</div>
                <div className="text-lg font-bold text-purple-700">{formatoMoneda(clienteSeleccionado.valorPropiedad)}</div>
                <div className="text-[10px] text-purple-500 font-medium">{formatoUF(clienteSeleccionado.valorPropiedad)}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-100/50">
                <div className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider mb-1">Pie Disponible</div>
                <div className="text-lg font-bold text-emerald-700">{formatoMoneda(clienteSeleccionado.pieDisponible)}</div>
                <div className="text-[10px] text-emerald-500 font-medium">{formatoUF(clienteSeleccionado.pieDisponible)}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-100/50">
                <div className="text-[9px] text-amber-500 font-bold uppercase tracking-wider mb-1">Banco</div>
                <div className="text-lg font-bold text-amber-700 flex items-center gap-2">
                  <Building2 size={16} />
                  {clienteSeleccionado.banco}
                </div>
                <div className="text-[10px] text-amber-500 font-medium">{clienteSeleccionado.tipoCredito}</div>
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
              {clienteSeleccionado.documentos.map((doc, idx) => {
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
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
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
                AP
              </div>
              <div>
                <div className="text-[12px] font-bold text-slate-800">Andrés Pérez</div>
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
                href="mailto:andres@tuhipotecafacil.cl"
                className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Mail size={14} className="text-blue-500" />
                <span className="text-[11px] text-slate-600">andres@tuhipotecafacil.cl</span>
              </a>
              <button className="w-full flex items-center justify-center gap-2 p-2.5 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                <MessageSquare size={14} className="text-green-500" />
                <span className="text-[11px] text-green-600 font-semibold">WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              Actividad Reciente
            </h3>
            <div className="space-y-3">
              {clienteSeleccionado.actividades.slice(0, 5).map((actividad, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] font-semibold text-slate-700">{actividad.titulo}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {actividad.fecha.toLocaleDateString("es-CL")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Próximos pasos */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Info size={16} className="text-blue-500" />
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
