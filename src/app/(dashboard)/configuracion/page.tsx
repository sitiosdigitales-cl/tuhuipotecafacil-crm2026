"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Settings,
  Building2,
  Bell,
  Mail,
  FileText,
  Link,
  Shield,
  Database,
  Sparkles,
  Save,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { TabGeneral } from "./_components/tab-general";
import { TabNotificaciones } from "./_components/tab-notificaciones";
import { TabPipeline } from "./_components/tab-pipeline";
import { TabDocumentos } from "./_components/tab-documentos";
import { TabEmail } from "./_components/tab-email";
import { TabIntegraciones } from "./_components/tab-integraciones";
import { TabAsistenteIA } from "./_components/tab-asistente-ia";
import { TabSeguridad } from "./_components/tab-seguridad";
import { TabSistema } from "./_components/tab-sistema";

type TabConfig = "general" | "notificaciones" | "pipeline" | "documentos" | "email" | "integraciones" | "seguridad" | "sistema" | "asistente-ia";

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

function ConfiguracionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as TabConfig | null;

  const [tabActiva, setTabActiva] = useState<TabConfig>(
    tabFromUrl && tabs.some((t) => t.id === tabFromUrl) ? tabFromUrl : "general"
  );
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // Configuracion General
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
  const [etapas, setEtapas] = useState<Array<{ id: string; nombre: string; color: string; activa: boolean }>>([]);
  const [cargandoEtapas, setCargandoEtapas] = useState(true);

  useEffect(() => {
    async function cargarEtapas() {
      try {
        const res = await fetch("/api/pipeline/stages");
        const data = await res.json();
        if (data.success && data.data) {
          setEtapas(data.data);
        }
      } catch {
        // Usar etapas por defecto si falla
      } finally {
        setCargandoEtapas(false);
      }
    }
    cargarEtapas();
  }, []);

  // Documentos
  const [tiposDocumento, setTiposDocumento] = useState([
    { id: "CEDULA_IDENTIDAD", nombre: "Cedula de Identidad", obligatorio: true, activo: true },
    { id: "CONTRATO_TRABAJO", nombre: "Contrato de Trabajo", obligatorio: true, activo: true },
    { id: "COMPROBANTE_INGRESOS", nombre: "Comprobante de Ingresos", obligatorio: true, activo: true },
    { id: "CERTIFICADO_AFP", nombre: "Certificado AFP", obligatorio: true, activo: true },
    { id: "DECLARACION_RENTA", nombre: "Declaracion de Renta", obligatorio: false, activo: true },
    { id: "VALORIZACION", nombre: "Valorizacion", obligatorio: true, activo: true },
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
  const [aiSystemPrompt, setAiSystemPrompt] = useState(
    "Eres el asistente IA de TuHipotecaFacil.cl, un CRM hipotecario inteligente para el mercado chileno.\nTu rol es ayudar a los ejecutivos comerciales y administradores del CRM con analisis de leads, insights del pipeline, gestion de tareas y reportes.\nResponde siempre en espanol, se conciso y accionable."
  );
  const [aiActivo, setAiActivo] = useState(true);
  const [aiAccesoDatos, setAiAccesoDatos] = useState(true);
  const [aiHistorial, setAiHistorial] = useState(true);
  const [aiSugerenciasAutomaticas, setAiSugerenciasAutomaticas] = useState(true);

  const handleTabChange = (tab: TabConfig) => {
    setTabActiva(tab);
    router.replace(`/configuracion?tab=${tab}`, { scroll: false });
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const res = await fetch("/api/configuracion", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa: { nombre: nombreEmpresa, rut: rutEmpresa, email: emailEmpresa, telefono: telefonoEmpresa, direccion: direccionEmpresa },
          regionales: { timezone, idioma, moneda },
          notificaciones: { email: notifEmail, whatsapp: notifWhatsApp, sms: notifSms, nuevosLeads: notifNuevosLeads, tareasVencidas: notifTareasVencidas, documentos: notifDocumentos, aprobaciones: notifAprobaciones },
          email: { smtpServer, smtpPort, smtpUsuario, smtpPassword, smtpSeguro, emailFrom, emailNombre },
          integraciones: { whatsappToken, whatsappPhoneId, whatsappActivo, webhookUrl, apiKeyExterna },
          seguridad: { passwordMinLength, requiereMayuscula, requiereNumero, requiereEspecial, bloqueoIntentos, sesionDuracion, twoFactorActivo },
          asistenteIA: { proveedor: aiProveedor, apiKey: aiApiKey, modelo: aiModelo, temperatura: aiTemperatura, maxTokens: aiMaxTokens, systemPrompt: aiSystemPrompt, activo: aiActivo, accesoDatos: aiAccesoDatos, historial: aiHistorial, sugerenciasAutomaticas: aiSugerenciasAutomaticas },
        }),
      });
      if (res.ok) {
        toast.success("Configuracion guardada correctamente");
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2000);
      } else {
        toast.error("Error al guardar la configuracion");
      }
    } catch {
      toast.error("Error de conexion al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Configuracion del Sistema
            </h1>
            <p className="text-slate-300 text-[11px] font-medium">
              Administra la configuracion general, notificaciones e integraciones
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
        {/* Sidebar de tabs - Desktop */}
        <div className="w-56 flex-shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl border border-slate-100/80 shadow-soft overflow-hidden sticky top-4">
            <div className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
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

        {/* Mobile tab selector */}
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
          <div className="bg-white rounded-2xl shadow-medium border border-slate-100 p-2">
            <div className="flex overflow-x-auto gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all ${
                    tabActiva === tab.id
                      ? "bg-purple-500 text-white"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {tab.icono}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {tabActiva === "general" && (
            <TabGeneral
              nombreEmpresa={nombreEmpresa} setNombreEmpresa={setNombreEmpresa}
              rutEmpresa={rutEmpresa} setRutEmpresa={setRutEmpresa}
              emailEmpresa={emailEmpresa} setEmailEmpresa={setEmailEmpresa}
              telefonoEmpresa={telefonoEmpresa} setTelefonoEmpresa={setTelefonoEmpresa}
              direccionEmpresa={direccionEmpresa} setDireccionEmpresa={setDireccionEmpresa}
              timezone={timezone} setTimezone={setTimezone}
              idioma={idioma} setIdioma={setIdioma}
              moneda={moneda} setMoneda={setMoneda}
            />
          )}
          {tabActiva === "notificaciones" && (
            <TabNotificaciones
              notifEmail={notifEmail} setNotifEmail={setNotifEmail}
              notifWhatsApp={notifWhatsApp} setNotifWhatsApp={setNotifWhatsApp}
              notifSms={notifSms} setNotifSms={setNotifSms}
              notifNuevosLeads={notifNuevosLeads} setNotifNuevosLeads={setNotifNuevosLeads}
              notifTareasVencidas={notifTareasVencidas} setNotifTareasVencidas={setNotifTareasVencidas}
              notifDocumentos={notifDocumentos} setNotifDocumentos={setNotifDocumentos}
              notifAprobaciones={notifAprobaciones} setNotifAprobaciones={setNotifAprobaciones}
            />
          )}
          {tabActiva === "pipeline" && (
            <TabPipeline etapas={etapas} setEtapas={setEtapas} cargandoEtapas={cargandoEtapas} />
          )}
          {tabActiva === "documentos" && (
            <TabDocumentos tiposDocumento={tiposDocumento} setTiposDocumento={setTiposDocumento} />
          )}
          {tabActiva === "email" && (
            <TabEmail
              smtpServer={smtpServer} setSmtpServer={setSmtpServer}
              smtpPort={smtpPort} setSmtpPort={setSmtpPort}
              smtpUsuario={smtpUsuario} setSmtpUsuario={setSmtpUsuario}
              smtpPassword={smtpPassword} setSmtpPassword={setSmtpPassword}
              smtpSeguro={smtpSeguro} setSmtpSeguro={setSmtpSeguro}
              emailFrom={emailFrom} setEmailFrom={setEmailFrom}
              emailNombre={emailNombre} setEmailNombre={setEmailNombre}
            />
          )}
          {tabActiva === "integraciones" && (
            <TabIntegraciones
              whatsappToken={whatsappToken} setWhatsappToken={setWhatsappToken}
              whatsappPhoneId={whatsappPhoneId} setWhatsappPhoneId={setWhatsappPhoneId}
              whatsappActivo={whatsappActivo} setWhatsappActivo={setWhatsappActivo}
              webhookUrl={webhookUrl} setWebhookUrl={setWebhookUrl}
              apiKeyExterna={apiKeyExterna} setApiKeyExterna={setApiKeyExterna}
            />
          )}
          {tabActiva === "asistente-ia" && (
            <TabAsistenteIA
              aiProveedor={aiProveedor} setAiProveedor={setAiProveedor}
              aiApiKey={aiApiKey} setAiApiKey={setAiApiKey}
              aiModelo={aiModelo} setAiModelo={setAiModelo}
              aiTemperatura={aiTemperatura} setAiTemperatura={setAiTemperatura}
              aiMaxTokens={aiMaxTokens} setAiMaxTokens={setAiMaxTokens}
              aiSystemPrompt={aiSystemPrompt} setAiSystemPrompt={setAiSystemPrompt}
              aiActivo={aiActivo} setAiActivo={setAiActivo}
              aiAccesoDatos={aiAccesoDatos} setAiAccesoDatos={setAiAccesoDatos}
              aiHistorial={aiHistorial} setAiHistorial={setAiHistorial}
              aiSugerenciasAutomaticas={aiSugerenciasAutomaticas} setAiSugerenciasAutomaticas={setAiSugerenciasAutomaticas}
            />
          )}
          {tabActiva === "seguridad" && (
            <TabSeguridad
              passwordMinLength={passwordMinLength} setPasswordMinLength={setPasswordMinLength}
              requiereMayuscula={requiereMayuscula} setRequiereMayuscula={setRequiereMayuscula}
              requiereNumero={requiereNumero} setRequiereNumero={setRequiereNumero}
              requiereEspecial={requiereEspecial} setRequiereEspecial={setRequiereEspecial}
              bloqueoIntentos={bloqueoIntentos} setBloqueoIntentos={setBloqueoIntentos}
              sesionDuracion={sesionDuracion} setSesionDuracion={setSesionDuracion}
              twoFactorActivo={twoFactorActivo} setTwoFactorActivo={setTwoFactorActivo}
            />
          )}
          {tabActiva === "sistema" && <TabSistema />}
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    }>
      <ConfiguracionContent />
    </Suspense>
  );
}
