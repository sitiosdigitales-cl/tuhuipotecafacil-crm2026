"use client";

import { useState } from "react";
import { Link, MessageSquare, Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";
import { SectionCard, Field, ConfigInput } from "./config-section";

interface TabIntegracionesProps {
  whatsappToken: string;
  setWhatsappToken: (v: string) => void;
  whatsappPhoneId: string;
  setWhatsappPhoneId: (v: string) => void;
  whatsappActivo: boolean;
  setWhatsappActivo: (v: boolean) => void;
  webhookUrl: string;
  setWebhookUrl: (v: string) => void;
  apiKeyExterna: string;
  setApiKeyExterna: (v: string) => void;
}

export function TabIntegraciones({
  whatsappToken, setWhatsappToken,
  whatsappPhoneId, setWhatsappPhoneId,
  whatsappActivo, setWhatsappActivo,
  webhookUrl, setWebhookUrl,
  apiKeyExterna, setApiKeyExterna,
}: TabIntegracionesProps) {
  const [showToken, setShowToken] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleConectar = () => {
    if (whatsappToken && whatsappPhoneId) {
      setWhatsappActivo(true);
      toast.success("WhatsApp conectado correctamente");
    } else {
      toast.error("Completa el token y Phone Number ID");
    }
  };

  const copiarEndpoint = (endpoint: string) => {
    navigator.clipboard.writeText(endpoint);
    toast.success("Endpoint copiado al portapapeles");
  };

  return (
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
            <div className="relative">
              <ConfigInput
                value={whatsappToken}
                onChange={setWhatsappToken}
                type={showToken ? "text" : "password"}
                placeholder="Tu token de acceso"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
          <Field label="Phone Number ID">
            <ConfigInput value={whatsappPhoneId} onChange={setWhatsappPhoneId} placeholder="ID del numero" />
          </Field>
        </div>
        <div className="mt-4">
          <button
            onClick={handleConectar}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-[11px] font-semibold hover:bg-green-600 transition-colors"
          >
            <Link size={14} /> Conectar WhatsApp
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Webhooks y API" icon={<Link size={16} className="text-purple-500" />}>
        <Field label="Webhook URL">
          <ConfigInput value={webhookUrl} onChange={setWebhookUrl} placeholder="https://tu-servidor.com/webhook" />
        </Field>
        <Field label="API Key Externa">
          <div className="relative">
            <ConfigInput
              value={apiKeyExterna}
              onChange={setApiKeyExterna}
              type={showApiKey ? "text" : "password"}
              placeholder="Tu API Key"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </Field>
        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
          <h4 className="text-[11px] font-bold text-slate-700 mb-2">Endpoints Disponibles</h4>
          <div className="space-y-2">
            {[
              { endpoint: "POST /api/webhook/lead", desc: "Recibir nuevo lead" },
              { endpoint: "GET /api/leads", desc: "Obtener leads" },
              { endpoint: "PUT /api/leads/:id", desc: "Actualizar lead" },
            ].map((item) => (
              <div key={item.endpoint} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <code className="text-[10px] text-slate-600">
                  {item.endpoint} <span className="text-slate-400">- {item.desc}</span>
                </code>
                <button
                  onClick={() => copiarEndpoint(item.endpoint)}
                  className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-400 hover:text-slate-600"
                >
                  <Copy size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
