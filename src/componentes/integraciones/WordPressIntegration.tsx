"use client";

import { useState } from "react";
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  Code,
  AlertCircle,
  Settings,
  RefreshCw,
  TestTube,
  Send,
  Link2,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export function WordPressIntegration() {
  const [copiado, setCopiado] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testNombre, setTestNombre] = useState("");
  const [testTelefono, setTestTelefono] = useState("");
  const [testEnviando, setTestEnviando] = useState(false);

  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/webhook/leads`;
  const apiUrl = `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/leads`;

  const copiarAlPortapapeles = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    toast.success("Copiado al portapapeles");
    setTimeout(() => setCopiado(null), 2000);
  };

  const enviarTest = async () => {
    if (!testNombre || !testEmail) {
      toast.error("Nombre y email son requeridos");
      return;
    }

    setTestEnviando(true);
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: testNombre.split(" ")[0] || testNombre,
          apellido: testNombre.split(" ").slice(1).join(" ") || "Test",
          email: testEmail,
          telefono: testTelefono,
          origen: "WEB",
          mensaje: "Lead de prueba desde integración WordPress",
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Lead de prueba enviado correctamente");
        setTestNombre("");
        setTestEmail("");
        setTestTelefono("");
      } else {
        toast.error("Error al enviar lead de prueba");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setTestEnviando(false);
    }
  };

  const codigoElementor = `
// En Elementor > Formulario > Configuración > Webhooks:
// 1. Agrega un nuevo webhook
// 2. URL: ${webhookUrl}
// 3. Método: POST
// 4. Headers: Content-Type: application/json

// Mapeo de campos (en la pestaña "Mapeo"):
// - Nombre → first_name
// - Apellido → last_name  
// - Email → email
// - Teléfono → phone
// - RUT → custom_field_rut
// - Mensaje → message
  `.trim();

  const codigoPHP = `
<?php
// Código para functions.php de WordPress
// Envía el formulario a tu CRM automáticamente

add_action('elementor_pro/forms/submission', function($submission) {
    $fields = $submission->get_fields();
    
    $data = array(
        'nombre'    => $fields['first_name'] ?? '',
        'apellido'  => $fields['last_name'] ?? '',
        'email'     => $fields['email'] ?? '',
        'telefono'  => $fields['phone'] ?? '',
        'rut'       => $fields['custom_field_rut'] ?? '',
        'mensaje'   => $fields['message'] ?? '',
    );
    
    wp_remote_post('${apiUrl}', array(
        'headers' => array('Content-Type' => 'application/json'),
        'body'    => json_encode($data),
    ));
});
?>
  `.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Globe size={24} />
          <h2 className="text-lg font-bold">Integración WordPress + Elementor</h2>
        </div>
        <p className="text-blue-200 text-[12px]">
          Conecta tu formulario de WordPress para recibir leads automáticamente en el CRM
        </p>
      </div>

      {/* URLs de conexión */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Link2 size={16} className="text-blue-500" />
          URLs de Conexión
        </h3>

        <div className="space-y-3">
          {/* Webhook URL */}
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Webhook URL (Elementor)</span>
              <button
                onClick={() => copiarAlPortapapeles(webhookUrl, "webhook")}
                className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700"
              >
                {copiado === "webhook" ? <Check size={12} /> : <Copy size={12} />}
                {copiado === "webhook" ? "Copiado" : "Copiar"}
              </button>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
              <code className="flex-1 text-[11px] text-slate-700 font-mono break-all">{webhookUrl}</code>
            </div>
          </div>

          {/* API URL */}
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase">API URL (Avanzado)</span>
              <button
                onClick={() => copiarAlPortapapeles(apiUrl, "api")}
                className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700"
              >
                {copiado === "api" ? <Check size={12} /> : <Copy size={12} />}
                {copiado === "api" ? "Copiado" : "Copiar"}
              </button>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
              <code className="flex-1 text-[11px] text-slate-700 font-mono break-all">{apiUrl}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Instrucciones Elementor */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Settings size={16} className="text-purple-500" />
          Configuración en Elementor
        </h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</div>
            <div>
              <div className="text-[11px] font-bold text-slate-800">Abre tu formulario en Elementor</div>
              <div className="text-[10px] text-slate-500">Edición del formulario &gt; Configuración &gt; Acciones</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</div>
            <div>
              <div className="text-[11px] font-bold text-slate-800">Agrega una acción Webhook</div>
              <div className="text-[10px] text-slate-500">En "Agregar acción" selecciona "Webhook"</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</div>
            <div>
              <div className="text-[11px] font-bold text-slate-800">Pega la URL del Webhook</div>
              <div className="text-[10px] text-slate-500">Copia la URL de arriba y pégala en el campo URL del webhook</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">4</div>
            <div>
              <div className="text-[11px] font-bold text-slate-800">Configura el mapeo de campos</div>
              <div className="text-[10px] text-slate-500">Asocia cada campo del formulario con los campos del CRM</div>
            </div>
          </div>
        </div>
      </div>

      {/* Código de ejemplo */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Code size={16} className="text-emerald-500" />
          Código de Configuración
        </h3>

        <div className="p-3 bg-slate-900 rounded-xl overflow-x-auto">
          <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap">{codigoElementor}</pre>
        </div>
      </div>

      {/* Código PHP alternativo */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText size={16} className="text-amber-500" />
          Alternativa: Código PHP para functions.php
        </h3>

        <div className="p-3 bg-slate-900 rounded-xl overflow-x-auto">
          <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap">{codigoPHP}</pre>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">
          Si el webhook de Elementor no funciona, agrega este código en functions.php de tu tema de WordPress
        </p>
      </div>

      {/* Test de integración */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TestTube size={16} className="text-green-500" />
          Probar Integración
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-1 block">Nombre *</label>
            <input
              type="text"
              value={testNombre}
              onChange={(e) => setTestNombre(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-1 block">Email *</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="juan@email.cl"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-1 block">Teléfono</label>
            <input
              type="tel"
              value={testTelefono}
              onChange={(e) => setTestTelefono(e.target.value)}
              placeholder="+56912345678"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <button
          onClick={enviarTest}
          disabled={testEnviando || !testNombre || !testEmail}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-[11px] font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testEnviando ? (
            <>
              <RefreshCw size={12} className="animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send size={12} />
              Enviar Lead de Prueba
            </>
          )}
        </button>
      </div>

      {/* Notas importantes */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
          <div>
            <h4 className="text-[11px] font-bold text-amber-800 mb-2">Notas Importantes</h4>
            <ul className="text-[10px] text-amber-700 space-y-1">
              <li>• Asegúrate de que tu sitio WordPress tenga SSL (HTTPS) para que el webhook funcione</li>
              <li>• Los leads llegan a la etapa "Nuevo Lead" automáticamente</li>
              <li>• Puedes personalizar los campos del formulario en Elementor</li>
              <li>• Si usas otro plugin de formularios (Contact Form 7, WPForms), el código PHP es la mejor opción</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
