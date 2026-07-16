"use client";

import { useState } from "react";
import { Mail, Send, Loader2, Check } from "lucide-react";
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
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleTestEmail = async () => {
    if (!smtpUsuario) {
      toast.error("Ingresa tu email de usuario SMTP primero");
      return;
    }

    setEnviandoPrueba(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "test",
          to: smtpUsuario,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Email de prueba enviado a " + smtpUsuario);
        setEnviado(true);
        setTimeout(() => setEnviado(false), 3000);
      } else {
        toast.error(data.error || "Error al enviar email");
      }
    } catch {
      toast.error("Error de conexion al servidor");
    } finally {
      setEnviandoPrueba(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Configuracion SMTP" icon={<Mail size={16} className="text-blue-500" />}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Servidor SMTP">
            <ConfigInput value={smtpServer} onChange={setSmtpServer} placeholder="smtp.gmail.com" />
          </Field>
          <Field label="Puerto">
            <ConfigInput value={smtpPort} onChange={setSmtpPort} placeholder="587" />
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
            disabled={enviandoPrueba || !smtpUsuario}
            className={"flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold transition-colors " + (enviado ? "bg-emerald-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed")}
          >
            {enviandoPrueba ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Enviando...
              </>
            ) : enviado ? (
              <>
                <Check size={14} />
                Enviado
              </>
            ) : (
              <>
                <Mail size={14} />
                Enviar Email de Prueba
              </>
            )}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Email Remitente" icon={<Send size={16} className="text-emerald-500" />}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email From">
            <ConfigInput value={emailFrom} onChange={setEmailFrom} type="email" placeholder="noreply@tuhipotecafacil.cl" />
          </Field>
          <Field label="Nombre Remitente">
            <ConfigInput value={emailNombre} onChange={setEmailNombre} placeholder="TuHipotecaFacil" />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}