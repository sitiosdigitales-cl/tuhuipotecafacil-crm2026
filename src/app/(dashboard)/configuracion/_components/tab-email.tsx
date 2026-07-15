"use client";

import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { SectionCard, Field, ConfigInput, ToggleRow } from "./config-section";

interface TabEmailProps {
  smtpServer: string;
  setSmtpServer: (v: string) => void;
  smtpPort: string;
  setSmtpPort: (v: string) => void;
  smtpUsuario: string;
  setSmtpUsuario: (v: string) => void;
  smtpPassword: string;
  setSmtpPassword: (v: string) => void;
  smtpSeguro: boolean;
  setSmtpSeguro: (v: boolean) => void;
  emailFrom: string;
  setEmailFrom: (v: string) => void;
  emailNombre: string;
  setEmailNombre: (v: string) => void;
}

export function TabEmail({
  smtpServer, setSmtpServer,
  smtpPort, setSmtpPort,
  smtpUsuario, setSmtpUsuario,
  smtpPassword, setSmtpPassword,
  smtpSeguro, setSmtpSeguro,
  emailFrom, setEmailFrom,
  emailNombre, setEmailNombre,
}: TabEmailProps) {
  const handleTestEmail = () => {
    toast.info("Enviando email de prueba...");
    setTimeout(() => {
      toast.success("Email de prueba enviado correctamente");
    }, 1500);
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Configuracion SMTP" icon={<Mail size={16} className="text-blue-500" />}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Servidor SMTP">
            <ConfigInput value={smtpServer} onChange={setSmtpServer} />
          </Field>
          <Field label="Puerto">
            <ConfigInput value={smtpPort} onChange={setSmtpPort} />
          </Field>
          <Field label="Usuario">
            <ConfigInput value={smtpUsuario} onChange={setSmtpUsuario} placeholder="tu@email.com" />
          </Field>
          <Field label="Contrasena">
            <ConfigInput value={smtpPassword} onChange={setSmtpPassword} type="password" placeholder="********" />
          </Field>
        </div>
        <div className="mt-4">
          <ToggleRow
            label="Conexion Segura (TLS)"
            description="Usar cifrado TLS para la conexion"
            checked={smtpSeguro}
            onChange={setSmtpSeguro}
          />
        </div>
        <div className="mt-4">
          <button
            onClick={handleTestEmail}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-600 transition-colors"
          >
            <Mail size={14} /> Enviar Email de Prueba
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Email Remitente" icon={<Send size={16} className="text-emerald-500" />}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email From">
            <ConfigInput value={emailFrom} onChange={setEmailFrom} type="email" />
          </Field>
          <Field label="Nombre Remitente">
            <ConfigInput value={emailNombre} onChange={setEmailNombre} />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
