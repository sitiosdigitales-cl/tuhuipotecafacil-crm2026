"use client";

import { useState } from "react";
import {
  Settings,
  Building2,
  Bell,
  Mail,
  Phone,
  Globe,
  Palette,
  Database,
  Shield,
  Users,
  FileText,
  Calendar,
  Clock,
  Save,
  Check,
  ChevronRight,
  ChevronDown,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Lock,
  Key,
  Smartphone,
  MessageSquare,
  Zap,
  Link,
  ExternalLink,
  AlertTriangle,
  Info,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
  Brain,
  Cpu,
  Thermometer,
} from "lucide-react";

type TabConfig = "general" | "notificaciones" | "pipeline" | "documentos" | "email" | "integraciones" | "seguridad" | "sistema" | "asistente-ia";

export default function ConfiguracionPage() {
  const [tabActiva, setTabActiva] = useState<TabConfig>("general");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // Configuración General
  const [nombreEmpresa, setNombreEmpresa] = useState("TuHipotecaFacil");
  const [rutEmpresa, setRutEmpresa] = useState("76.123.456-7");
  const [emailEmpresa, setEmailEmpresa] = useState("contacto@tuhipotecafacil.cl");
  const [telefonoEmpresa, setTelefonoEmpresa] = useState("+56 2 2123 4567");
  const [direccionEmpresa, setDireccionEmpresa] = useState("Av. Providencia 1234, Santiago");
  const [timezone, setTimezone] = useState("America/Santiago");
  const [idioma, setIdioma] = useState("es-CL");
  const [moneda, setMoneda] = useState("CLP");

  // Notificaciones
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhatsApp, setNotifWhatsApp] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifNuevosLeads, setNotifNuevosLeads] = useState(true);
  const [notifTareasVencidas, setNotifTareasVencidas] = useState(true);
  const [notifDocumentos, setNotifDocumentos] = useState(true);
  const [notifAprobaciones, setNotifAprobaciones] = useState(true);

  // Pipeline
  const [etapas, setEtapas] = useState([
    { id: "NUEVO_LEAD", nombre: "Nuevo Lead", color: "#3B82F6", activa: true },
    { id: "CONTACTO_INICIAL", nombre: "Contacto Inicial", color: "#6366F1", activa: true },
    { id: "CONTACTADO", nombre: "Contactado", color: "#8B5CF6", activa: true },
    { id: "INTERESADO", nombre: "Interesado", color: "#A855F7", activa: true },
    { id: "CALIFICACION_COMERCIAL", nombre: "Calificación Comercial", color: "#D946EF", activa: true },
    { id: "DOCS_PENDIENTES", nombre: "Docs. Pendientes", color: "#F97316", activa: true },
    { id: "DOCS_COMPLETAS", nombre: "Docs. Completas", color: "#22C55E", activa: true },
    { id: "EVALUACION_BANCARIA", nombre: "Evaluación Bancaria", color: "#06B6D4", activa: true },
    { id: "PREAPROBADO", nombre: "Preaprobado", color: "#14B8A6", activa: true },
    { id: "APROBADO", nombre: "Aprobado", color: "#10B981", activa: true },
    { id: "FIRMA_DIGITAL", nombre: "Firma Digital", color: "#6366F1", activa: true },
    { id: "NOTARIA", nombre: "Notaría", color: "#8B5CF6", activa: true },
    { id: "CREDITO_PAGADO", nombre: "Crédito Pagado", color: "#22C55E", activa: true },
  ]);

  // Documentos
  const [tiposDocumento, setTiposDocumento] = useState([
    { id: "CEDULA_IDENTIDAD", nombre: "Cédula de Identidad", obligatorio: true, activo: true },
    { id: "CONTRATO_TRABAJO", nombre: "Contrato de Trabajo", obligatorio: true, activo: true },
    { id: "COMPROBANTE_INGRESOS", nombre: "Comprobante de Ingresos", obligatorio: true, activo: true },
    { id: "CERTIFICADO_AFP", nombre: "Certificado AFP", obligatorio: true, activo: true },
    { id: "DECLARACION_RENTA", nombre: "Declaración de Renta", obligatorio: false, activo: true },
    { id: "VALORIZACION", nombre: "Valorización", obligatorio: true, activo: true },
    { id: "CERTIFICADO_PIE", nombre: "Certificado de Pie", obligatorio: true, activo: true },
    { id: "OTRO", nombre: "Otro", obligatorio: false, activo: true },
  ]);

  // Email
  const [smtpServer, setSmtpServer] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUsuario, setSmtpUsuario] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpSeguro, setSmtpSeguro] = useState(true);
  const [emailFrom, setEmailFrom] = useState("noreply@tuhipotecafacil.cl");
  const [emailNombre, setEmailNombre] = useState("TuHipotecaFacil");

  // Integraciones
  const [whatsappToken, setWhatsappToken] = useState("");
  const [whatsappPhoneId, setWhatsappPhoneId] = useState("");
  const [whatsappActivo, setWhatsappActivo] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [apiKeyExterna, setApiKeyExterna] = useState("");

  // Seguridad
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [requiereMayuscula, setRequiereMayuscula] = useState(true);
  const [requiereNumero, setRequiereNumero] = useState(true);
  const [requiereEspecial, setRequiereEspecial] = useState(true);
  const [bloqueoIntentos, setBloqueoIntentos] = useState(5);
  const [sesionDuracion, setSesionDuracion] = useState(24);
  const [twoFactorActivo, setTwoFactorActivo] = useState(false);

  // Asistente IA
  const [aiProveedor, setAiProveedor] = useState("openai");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModelo, setAiModelo] = useState("gpt-4o-mini");
  const [aiTemperatura, setAiTemperatura] = useState(0.7);
  const [aiMaxTokens, setAiMaxTokens] = useState(2048);
  const [aiSystemPrompt, setAiSystemPrompt] = useState(`Eres el asistente IA de TuHipotecaFacil.cl, un CRM hipotecario inteligente para el mercado chileno.
Tu rol es ayudar a los ejecutivos comerciales y administradores del CRM con análisis de leads, insights del pipeline, gestión de tareas y reportes.
Responde siempre en español, sé conciso y accionable.`);
  const [aiActivo, setAiActivo] = useState(true);
  const [aiAccesoDatos, setAiAccesoDatos] = useState(true);
  const [aiHistorial, setAiHistorial] = useState(true);
  const [aiSugerenciasAutomaticas, setAiSugerenciasAutomaticas] = useState(true);
  const [showAiApiKey, setShowAiApiKey] = useState(false);

  const handleGuardar = () => {
    setGuardando(true);
    setTimeout(() => {
      setGuardando(false);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    }, 1000);
  };

  const tabs: { id: TabConfig; label: string; icono: React.ReactNode }[] = [
    { id: "general", label: "General", icono: <Building2 size={16} /> },
    { id: "notificaciones", label: "Notificaciones", icono: <Bell size={16} /> },
    { id: "pipeline", label: "Pipeline", icono: <Settings size={16} /> },
    { id: "documentos", label: "Documentos", icono: <FileText size={16} /> },
    { id: "email", label: "Email", icono: <Mail size={16} /> },
    { id: "integraciones", label: "Integraciones", icono: <Link size={16} /> },
    { id: "asistente-ia", label: "Asistente IA", icono: <Sparkles size={16} /> },
    { id: "seguridad", label: "Seguridad", icono: <Shield size={16} /> },
    { id: "sistema", label: "Sistema", icono: <Database size={16} /> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Configuración del Sistema
            </h1>
            <p className="text-slate-300 text-[11px] font-medium">
              Administra la configuración general, notificaciones e integraciones
            </p>
          </div>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[12px] font-semibold transition-all ${
              guardado
                ? "bg-emerald-500 text-white"
                : "bg-white text-slate-800 hover:bg-slate-100"
            }`}
          >
            {guardando ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                Guardando...
              </>
            ) : guardado ? (
              <>
                <Check size={16} /> Guardado
              </>
            ) : (
              <>
                <Save size={16} /> Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Sidebar de tabs */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100/80 shadow-soft overflow-hidden sticky top-4">
            <div className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTabActiva(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-semibold transition-all ${
                    tabActiva === tab.id
                      ? "bg-slate-100 text-slate-800"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className={tabActiva === tab.id ? "text-purple-500" : "text-slate-400"}>
                    {tab.icono}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1">
          {/* General */}
          {tabActiva === "general" && (
            <div className="space-y-5">
              <SectionCard title="Información de la Empresa" icon={<Building2 size={16} className="text-blue-500" />}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nombre de la Empresa">
                    <Input value={nombreEmpresa} onChange={setNombreEmpresa} />
                  </Field>
                  <Field label="RUT">
                    <Input value={rutEmpresa} onChange={setRutEmpresa} />
                  </Field>
                  <Field label="Email de Contacto">
                    <Input value={emailEmpresa} onChange={setEmailEmpresa} type="email" />
                  </Field>
                  <Field label="Teléfono">
                    <Input value={telefonoEmpresa} onChange={setTelefonoEmpresa} />
                  </Field>
                </div>
                <Field label="Dirección">
                  <Input value={direccionEmpresa} onChange={setDireccionEmpresa} />
                </Field>
              </SectionCard>

              <SectionCard title="Preferencias Regionales" icon={<Globe size={16} className="text-emerald-500" />}>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Zona Horaria">
                    <Select value={timezone} onChange={setTimezone} options={[
                      { value: "America/Santiago", label: "Santiago (GMT-4)" },
                      { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
                      { value: "America/Lima", label: "Lima (GMT-5)" },
                      { value: "America/Bogota", label: "Bogotá (GMT-5)" },
                    ]} />
                  </Field>
                  <Field label="Idioma">
                    <Select value={idioma} onChange={setIdioma} options={[
                      { value: "es-CL", label: "Español (Chile)" },
                      { value: "es-AR", label: "Español (Argentina)" },
                      { value: "es-PE", label: "Español (Perú)" },
                      { value: "pt-BR", label: "Portugués (Brasil)" },
                    ]} />
                  </Field>
                  <Field label="Moneda">
                    <Select value={moneda} onChange={setMoneda} options={[
                      { value: "CLP", label: "Peso Chileno (CLP)" },
                      { value: "ARS", label: "Peso Argentino (ARS)" },
                      { value: "PEN", label: "Sol Peruano (PEN)" },
                      { value: "USD", label: "Dólar (USD)" },
                    ]} />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="Logo y Apariencia" icon={<Palette size={16} className="text-purple-500" />}>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    TH
                  </div>
                  <div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 transition-colors mb-2">
                      <Upload size={14} /> Subir Logo
                    </button>
                    <p className="text-[10px] text-slate-400">PNG, JPG o SVG. Máximo 2MB.</p>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* Notificaciones */}
          {tabActiva === "notificaciones" && (
            <div className="space-y-5">
              <SectionCard title="Canales de Notificación" icon={<Bell size={16} className="text-amber-500" />}>
                <div className="space-y-4">
                  <ToggleRow
                    label="Notificaciones por Email"
                    description="Recibe alertas importantes en tu correo"
                    checked={notifEmail}
                    onChange={setNotifEmail}
                    icon={<Mail size={16} className="text-blue-500" />}
                  />
                  <ToggleRow
                    label="Notificaciones por WhatsApp"
                    description="Recibe alertas en tu WhatsApp"
                    checked={notifWhatsApp}
                    onChange={setNotifWhatsApp}
                    icon={<MessageSquare size={16} className="text-green-500" />}
                  />
                  <ToggleRow
                    label="Notificaciones por SMS"
                    description="Recibe alertas por mensaje de texto"
                    checked={notifSms}
                    onChange={setNotifSms}
                    icon={<Smartphone size={16} className="text-purple-500" />}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Tipos de Notificación" icon={<Zap size={16} className="text-blue-500" />}>
                <div className="space-y-4">
                  <ToggleRow
                    label="Nuevos Leads"
                    description="Cuando un nuevo lead ingresa al sistema"
                    checked={notifNuevosLeads}
                    onChange={setNotifNuevosLeads}
                  />
                  <ToggleRow
                    label="Tareas Vencidas"
                    description="Cuando una tarea pasa su fecha límite"
                    checked={notifTareasVencidas}
                    onChange={setNotifTareasVencidas}
                  />
                  <ToggleRow
                    label="Documentos Pendientes"
                    description="Cuando faltan documentos por revisar"
                    checked={notifDocumentos}
                    onChange={setNotifDocumentos}
                  />
                  <ToggleRow
                    label="Aprobaciones de Crédito"
                    description="Cuando un crédito es aprobado o rechazado"
                    checked={notifAprobaciones}
                    onChange={setNotifAprobaciones}
                  />
                </div>
              </SectionCard>
            </div>
          )}

          {/* Pipeline */}
          {tabActiva === "pipeline" && (
            <div className="space-y-5">
              <SectionCard title="Etapas del Pipeline" icon={<Settings size={16} className="text-indigo-500" />}>
                <p className="text-[11px] text-slate-400 mb-4">
                  Configura las etapas del pipeline de ventas. Arrastra para reordenar.
                </p>
                <div className="space-y-2">
                  {etapas.map((etapa, idx) => (
                    <div
                      key={etapa.id}
                      className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100"
                    >
                      <div className="text-[10px] font-bold text-slate-400 w-6">{idx + 1}</div>
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: etapa.color }}
                      />
                      <input
                        type="text"
                        value={etapa.nombre}
                        onChange={(e) => {
                          const nuevasEtapas = [...etapas];
                          nuevasEtapas[idx].nombre = e.target.value;
                          setEtapas(nuevasEtapas);
                        }}
                        className="flex-1 bg-white border border-slate-200/60 rounded-lg px-3 py-1.5 text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400"
                      />
                      <input
                        type="color"
                        value={etapa.color}
                        onChange={(e) => {
                          const nuevasEtapas = [...etapas];
                          nuevasEtapas[idx].color = e.target.value;
                          setEtapas(nuevasEtapas);
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0"
                      />
                      <button
                        onClick={() => {
                          const nuevasEtapas = [...etapas];
                          nuevasEtapas[idx].activa = !nuevasEtapas[idx].activa;
                          setEtapas(nuevasEtapas);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          etapa.activa
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {etapa.activa ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="flex items-center gap-2 mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 transition-colors">
                  <Plus size={14} /> Agregar Etapa
                </button>
              </SectionCard>
            </div>
          )}

          {/* Documentos */}
          {tabActiva === "documentos" && (
            <div className="space-y-5">
              <SectionCard title="Tipos de Documento" icon={<FileText size={16} className="text-amber-500" />}>
                <p className="text-[11px] text-slate-400 mb-4">
                  Configura los tipos de documento que se pueden solicitar a los clientes.
                </p>
                <div className="space-y-2">
                  {tiposDocumento.map((doc, idx) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100"
                    >
                      <input
                        type="text"
                        value={doc.nombre}
                        onChange={(e) => {
                          const nuevosDocs = [...tiposDocumento];
                          nuevosDocs[idx].nombre = e.target.value;
                          setTiposDocumento(nuevosDocs);
                        }}
                        className="flex-1 bg-white border border-slate-200/60 rounded-lg px-3 py-1.5 text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400"
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={doc.obligatorio}
                          onChange={(e) => {
                            const nuevosDocs = [...tiposDocumento];
                            nuevosDocs[idx].obligatorio = e.target.checked;
                            setTiposDocumento(nuevosDocs);
                          }}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span className="text-[10px] text-slate-500">Obligatorio</span>
                      </label>
                      <button
                        onClick={() => {
                          const nuevosDocs = [...tiposDocumento];
                          nuevosDocs[idx].activo = !nuevosDocs[idx].activo;
                          setTiposDocumento(nuevosDocs);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          doc.activo
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {doc.activo ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="flex items-center gap-2 mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 transition-colors">
                  <Plus size={14} /> Agregar Tipo
                </button>
              </SectionCard>
            </div>
          )}

          {/* Email */}
          {tabActiva === "email" && (
            <div className="space-y-5">
              <SectionCard title="Configuración SMTP" icon={<Mail size={16} className="text-blue-500" />}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Servidor SMTP">
                    <Input value={smtpServer} onChange={setSmtpServer} />
                  </Field>
                  <Field label="Puerto">
                    <Input value={smtpPort} onChange={setSmtpPort} />
                  </Field>
                  <Field label="Usuario">
                    <Input value={smtpUsuario} onChange={setSmtpUsuario} placeholder="tu@email.com" />
                  </Field>
                  <Field label="Contraseña">
                    <Input value={smtpPassword} onChange={setSmtpPassword} type="password" placeholder="••••••••" />
                  </Field>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <ToggleRow
                    label="Conexión Segura (TLS)"
                    description="Usar cifrado TLS para la conexión"
                    checked={smtpSeguro}
                    onChange={setSmtpSeguro}
                  />
                </div>
                <div className="mt-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-600 transition-colors">
                    <Mail size={14} /> Enviar Email de Prueba
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Email Remitente" icon={<Send size={16} className="text-emerald-500" />}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Email From">
                    <Input value={emailFrom} onChange={setEmailFrom} type="email" />
                  </Field>
                  <Field label="Nombre Remitente">
                    <Input value={emailNombre} onChange={setEmailNombre} />
                  </Field>
                </div>
              </SectionCard>
            </div>
          )}

          {/* Integraciones */}
          {tabActiva === "integraciones" && (
            <div className="space-y-5">
              <SectionCard title="WhatsApp Business API" icon={<MessageSquare size={16} className="text-green-500" />}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-[12px] font-semibold text-slate-700">Estado</h4>
                    <p className="text-[10px] text-slate-400">
                      {whatsappActivo ? "Conectado y activo" : "Desconectado"}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    whatsappActivo
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {whatsappActivo ? "ACTIVO" : "INACTIVO"}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Access Token">
                    <Input value={whatsappToken} onChange={setWhatsappToken} type="password" placeholder="Tu token de acceso" />
                  </Field>
                  <Field label="Phone Number ID">
                    <Input value={whatsappPhoneId} onChange={setWhatsappPhoneId} placeholder="ID del número" />
                  </Field>
                </div>
                <div className="mt-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-[11px] font-semibold hover:bg-green-600 transition-colors">
                    <Link size={14} /> Conectar WhatsApp
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Webhooks y API" icon={<Link size={16} className="text-purple-500" />}>
                <Field label="Webhook URL">
                  <Input value={webhookUrl} onChange={setWebhookUrl} placeholder="https://tu-servidor.com/webhook" />
                </Field>
                <Field label="API Key Externa">
                  <Input value={apiKeyExterna} onChange={setApiKeyExterna} type="password" placeholder="Tu API Key" />
                </Field>
                <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                  <h4 className="text-[11px] font-bold text-slate-700 mb-2">Endpoints Disponibles</h4>
                  <div className="space-y-2">
                    <code className="block text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                      POST /api/webhook/lead - Recibir nuevo lead
                    </code>
                    <code className="block text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                      GET /api/leads - Obtener leads
                    </code>
                    <code className="block text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                      PUT /api/leads/:id - Actualizar lead
                    </code>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* Seguridad */}
          {tabActiva === "seguridad" && (
            <div className="space-y-5">
              <SectionCard title="Política de Contraseñas" icon={<Lock size={16} className="text-red-500" />}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Longitud Mínima">
                    <Input value={passwordMinLength.toString()} onChange={(v) => setPasswordMinLength(parseInt(v) || 8)} type="number" />
                  </Field>
                  <Field label="Intentos Máximos (Bloqueo)">
                    <Input value={bloqueoIntentos.toString()} onChange={(v) => setBloqueoIntentos(parseInt(v) || 5)} type="number" />
                  </Field>
                </div>
                <div className="space-y-4 mt-4">
                  <ToggleRow
                    label="Requiere Mayúscula"
                    description="La contraseña debe contener al menos una mayúscula"
                    checked={requiereMayuscula}
                    onChange={setRequiereMayuscula}
                  />
                  <ToggleRow
                    label="Requiere Número"
                    description="La contraseña debe contener al menos un número"
                    checked={requiereNumero}
                    onChange={setRequiereNumero}
                  />
                  <ToggleRow
                    label="Requiere Carácter Especial"
                    description="La contraseña debe contener !@#$%^&*"
                    checked={requiereEspecial}
                    onChange={setRequiereEspecial}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Sesiones" icon={<Clock size={16} className="text-amber-500" />}>
                <Field label="Duración de Sesión (horas)">
                  <Input value={sesionDuracion.toString()} onChange={(v) => setSesionDuracion(parseInt(v) || 24)} type="number" />
                </Field>
              </SectionCard>

              <SectionCard title="Autenticación de Dos Factores" icon={<Shield size={16} className="text-purple-500" />}>
                <ToggleRow
                  label="2FA Obligatorio"
                  description="Requerir autenticación de dos factores para todos los usuarios"
                  checked={twoFactorActivo}
                  onChange={setTwoFactorActivo}
                />
              </SectionCard>
            </div>
          )}

          {/* Asistente IA */}
          {tabActiva === "asistente-ia" && (
            <div className="space-y-5">
              {/* Estado del Asistente */}
              <SectionCard title="Estado del Asistente" icon={<Sparkles size={16} className="text-violet-500" />}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${aiActivo ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/20" : "bg-slate-200"}`}>
                      <Sparkles size={20} className={aiActivo ? "text-white" : "text-slate-400"} />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-slate-900">Asistente IA</div>
                      <div className="text-[11px] text-slate-500">
                        {aiActivo ? "Activo y listo para ayudar" : "Desactivado"}
                      </div>
                    </div>
                  </div>
                  <ToggleSwitch checked={aiActivo} onChange={setAiActivo} />
                </div>
              </SectionCard>

              {/* Configuración del Proveedor */}
              <SectionCard title="Proveedor de IA" icon={<Brain size={16} className="text-blue-500" />}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Proveedor">
                    <Select value={aiProveedor} onChange={setAiProveedor} options={[
                      { value: "openai", label: "OpenAI (GPT)" },
                      { value: "anthropic", label: "Anthropic (Claude)" },
                      { value: "google", label: "Google (Gemini)" },
                      { value: "azure", label: "Azure OpenAI" },
                    ]} />
                  </Field>
                  <Field label="Modelo">
                    <Select value={aiModelo} onChange={setAiModelo} options={
                      aiProveedor === "openai" ? [
                        { value: "gpt-4o-mini", label: "GPT-4o Mini (Rápido)" },
                        { value: "gpt-4o", label: "GPT-4o (Potente)" },
                        { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
                      ] : aiProveedor === "anthropic" ? [
                        { value: "claude-3-haiku", label: "Claude 3 Haiku (Rápido)" },
                        { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
                        { value: "claude-3-opus", label: "Claude 3 Opus (Potente)" },
                      ] : aiProveedor === "google" ? [
                        { value: "gemini-pro", label: "Gemini Pro" },
                        { value: "gemini-ultra", label: "Gemini Ultra" },
                      ] : [
                        { value: "gpt-4o-mini", label: "GPT-4o Mini" },
                        { value: "gpt-4o", label: "GPT-4o" },
                      ]
                    } />
                  </Field>
                </div>
                <Field label="API Key">
                  <div className="relative">
                    <Input
                      value={aiApiKey}
                      onChange={setAiApiKey}
                      type={showAiApiKey ? "text" : "password"}
                      placeholder="sk-..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowAiApiKey(!showAiApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showAiApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Tu API key se almacena de forma segura y nunca se comparte.</p>
                </Field>
              </SectionCard>

              {/* Parámetros del Modelo */}
              <SectionCard title="Parámetros del Modelo" icon={<Cpu size={16} className="text-emerald-500" />}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Temperatura">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={aiTemperatura}
                        onChange={(e) => setAiTemperatura(parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
                      />
                      <span className="text-[12px] font-bold text-slate-700 w-10 text-center">{aiTemperatura}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Menor = más preciso, Mayor = más creativo</p>
                  </Field>
                  <Field label="Máximo de Tokens">
                    <Input
                      value={aiMaxTokens.toString()}
                      onChange={(v) => setAiMaxTokens(parseInt(v) || 2048)}
                      type="number"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Longitud máxima de respuesta (1024-4096)</p>
                  </Field>
                </div>
              </SectionCard>

              {/* System Prompt */}
              <SectionCard title="Instrucciones del Asistente" icon={<MessageSquare size={16} className="text-amber-500" />}>
                <Field label="System Prompt">
                  <textarea
                    value={aiSystemPrompt}
                    onChange={(e) => setAiSystemPrompt(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none transition-all"
                    placeholder="Instrucciones para el asistente..."
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Define el comportamiento y personalidad del asistente.</p>
                </Field>
              </SectionCard>

              {/* Funcionalidades */}
              <SectionCard title="Funcionalidades" icon={<Zap size={16} className="text-purple-500" />}>
                <div className="space-y-4">
                  <ToggleRow
                    label="Acceso a datos del CRM"
                    description="Permite al asistente leer leads, clientes y estadísticas"
                    checked={aiAccesoDatos}
                    onChange={setAiAccesoDatos}
                    icon={<Database size={16} className="text-blue-500" />}
                  />
                  <ToggleRow
                    label="Historial de conversaciones"
                    description="Guarda el historial de chats para contexto"
                    checked={aiHistorial}
                    onChange={setAiHistorial}
                    icon={<Clock size={16} className="text-emerald-500" />}
                  />
                  <ToggleRow
                    label="Sugerencias automáticas"
                    description="Muestra sugerencias basadas en la actividad actual"
                    checked={aiSugerenciasAutomaticas}
                    onChange={setAiSugerenciasAutomaticas}
                    icon={<Sparkles size={16} className="text-violet-500" />}
                  />
                </div>
              </SectionCard>

              {/* Información de Uso */}
              <SectionCard title="Información de Uso" icon={<Info size={16} className="text-slate-500" />}>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-slate-900">1,247</div>
                    <div className="text-[10px] text-slate-500 mt-1">Mensajes este mes</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-violet-600">~$2.500</div>
                    <div className="text-[10px] text-slate-500 mt-1">Costo estimado</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600">98.5%</div>
                    <div className="text-[10px] text-slate-500 mt-1">Disponibilidad</div>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* Sistema */}
          {tabActiva === "sistema" && (
            <div className="space-y-5">
              <SectionCard title="Información del Sistema" icon={<Database size={16} className="text-blue-500" />}>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Versión" value="1.0.0" />
                  <InfoRow label="Última Actualización" value="03 Julio 2026" />
                  <InfoRow label="Base de Datos" value="MySQL 8.0" />
                  <InfoRow label="Node.js" value="v20.x" />
                </div>
              </SectionCard>

              <SectionCard title="Respaldo y Exportación" icon={<Download size={16} className="text-emerald-500" />}>
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[11px] font-semibold hover:bg-emerald-600 transition-colors">
                    <Download size={14} /> Exportar Datos
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-600 transition-colors">
                    <Upload size={14} /> Importar Datos
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-[11px] font-semibold hover:bg-amber-600 transition-colors">
                    <Database size={14} /> Crear Respaldo
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Mantenimiento" icon={<RefreshCw size={16} className="text-purple-500" />}>
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 transition-colors">
                    <RefreshCw size={14} /> Limpiar Caché
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 transition-colors">
                    <Database size={14} /> Optimizar Base de Datos
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Zona de Peligro" icon={<AlertTriangle size={16} className="text-red-500" />}>
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <h4 className="text-[12px] font-bold text-red-700 mb-2">Restablecer Sistema</h4>
                  <p className="text-[11px] text-red-600 mb-4">
                    Esta acción eliminará todos los datos y restablecerá la configuración por defecto. Esta acción no se puede deshacer.
                  </p>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-[11px] font-semibold hover:bg-red-600 transition-colors">
                    <Trash2 size={14} /> Restablecer Todo
                  </button>
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100/80 shadow-soft overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder }: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
    />
  );
}

function Select({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full transition-colors relative ${
        checked ? "bg-violet-500" : "bg-slate-300"
      }`}
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${
        checked ? "translate-x-6" : "translate-x-0.5"
      }`} />
    </button>
  );
}

function ToggleRow({ label, description, checked, onChange, icon }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
      <div className="flex items-center gap-3">
        {icon && <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">{icon}</div>}
        <div>
          <div className="text-[12px] font-semibold text-slate-700">{label}</div>
          <div className="text-[10px] text-slate-400">{description}</div>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors relative ${
          checked ? "bg-purple-500" : "bg-slate-300"
        }`}
      >
        <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${
          checked ? "translate-x-6" : "translate-x-0.5"
        }`} />
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-[12px] font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function Plus({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function Send({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
