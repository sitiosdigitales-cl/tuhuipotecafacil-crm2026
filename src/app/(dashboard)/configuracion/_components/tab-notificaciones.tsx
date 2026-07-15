"use client";

import { Bell, Mail, MessageSquare, Smartphone, Zap } from "lucide-react";
import { SectionCard, ToggleRow } from "./config-section";

interface TabNotificacionesProps {
  notifEmail: boolean;
  setNotifEmail: (v: boolean) => void;
  notifWhatsApp: boolean;
  setNotifWhatsApp: (v: boolean) => void;
  notifSms: boolean;
  setNotifSms: (v: boolean) => void;
  notifNuevosLeads: boolean;
  setNotifNuevosLeads: (v: boolean) => void;
  notifTareasVencidas: boolean;
  setNotifTareasVencidas: (v: boolean) => void;
  notifDocumentos: boolean;
  setNotifDocumentos: (v: boolean) => void;
  notifAprobaciones: boolean;
  setNotifAprobaciones: (v: boolean) => void;
}

export function TabNotificaciones({
  notifEmail, setNotifEmail,
  notifWhatsApp, setNotifWhatsApp,
  notifSms, setNotifSms,
  notifNuevosLeads, setNotifNuevosLeads,
  notifTareasVencidas, setNotifTareasVencidas,
  notifDocumentos, setNotifDocumentos,
  notifAprobaciones, setNotifAprobaciones,
}: TabNotificacionesProps) {
  return (
    <div className="space-y-5">
      <SectionCard title="Canales de Notificacion" icon={<Bell size={16} className="text-amber-500" />}>
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

      <SectionCard title="Tipos de Notificacion" icon={<Zap size={16} className="text-blue-500" />}>
        <div className="space-y-4">
          <ToggleRow
            label="Nuevos Leads"
            description="Cuando un nuevo lead ingresa al sistema"
            checked={notifNuevosLeads}
            onChange={setNotifNuevosLeads}
          />
          <ToggleRow
            label="Tareas Vencidas"
            description="Cuando una tarea pasa su fecha limite"
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
            label="Aprobaciones de Credito"
            description="Cuando un credito es aprobado o rechazado"
            checked={notifAprobaciones}
            onChange={setNotifAprobaciones}
          />
        </div>
      </SectionCard>
    </div>
  );
}
