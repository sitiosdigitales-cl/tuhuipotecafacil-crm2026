"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, MessageSquare, Zap, FileText, User, CheckSquare, Clock, MessageCircle, Settings, Save, Check } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "./config-section";

interface PreferenciaNotificacion {
  canal: string;
  evento: string;
  habilitado: boolean;
}

const EVENTOS_CONFIG = [
  { id: "documento_subido", label: "Documento Subido", icon: "FileText", grupo: "Documentos" },
  { id: "documento_estado", label: "Cambio Estado Documento", icon: "FileText", grupo: "Documentos" },
  { id: "documento_version", label: "Nueva Version Documento", icon: "FileText", grupo: "Documentos" },
  { id: "lead_nuevo", label: "Nuevo Lead", icon: "User", grupo: "Leads" },
  { id: "lead_etapa", label: "Cambio de Etapa Lead", icon: "User", grupo: "Leads" },
  { id: "lead_asignado", label: "Lead Asignado", icon: "User", grupo: "Leads" },
  { id: "tarea_asignada", label: "Tarea Asignada", icon: "CheckSquare", grupo: "Tareas" },
  { id: "tarea_vencida", label: "Tarea Vencida", icon: "Clock", grupo: "Tareas" },
  { id: "tarea_completada", label: "Tarea Completada", icon: "CheckSquare", grupo: "Tareas" },
  { id: "mensaje", label: "Nuevo Mensaje", icon: "MessageCircle", grupo: "Comunicaciones" },
  { id: "sistema", label: "Eventos del Sistema", icon: "Settings", grupo: "Sistema" },
];

const CANALES_CONFIG = [
  { id: "in_app", label: "En la App", icon: "Bell", description: "Notificaciones en el panel lateral" },
  { id: "email", label: "Email", icon: "Mail", description: "Notificaciones por correo electronico" },
  { id: "whatsapp", label: "WhatsApp", icon: "MessageSquare", description: "Notificaciones por WhatsApp" },
];

const getIcon = (name: string, className: string) => {
  const icons: Record<string, React.ReactNode> = {
    FileText: <FileText size={14} className={className} />,
    User: <User size={14} className={className} />,
    CheckSquare: <CheckSquare size={14} className={className} />,
    Clock: <Clock size={14} className={className} />,
    MessageCircle: <MessageCircle size={14} className={className} />,
    Settings: <Settings size={14} className={className} />,
    Bell: <Bell size={14} className={className} />,
    Mail: <Mail size={14} className={className} />,
    MessageSquare: <MessageSquare size={14} className={className} />,
  };
  return icons[name] || <Bell size={14} className={className} />;
};

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
  const [preferencias, setPreferencias] = useState<PreferenciaNotificacion[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // Cargar preferencias del usuario
  useEffect(() => {
    async function cargarPreferencias() {
      try {
        const res = await fetch("/api/preferencias-notificacion");
        const data = await res.json();
        if (data.success && data.data) {
          setPreferencias(data.data);
        }
      } catch {
        // Usar preferencias por defecto
        const defaults: PreferenciaNotificacion[] = [];
        EVENTOS_CONFIG.forEach(evt => {
          CANALES_CONFIG.forEach(can => {
            defaults.push({ canal: can.id, evento: evt.id, habilitado: true });
          });
        });
        setPreferencias(defaults);
      }
    }
    cargarPreferencias();
  }, []);

  const togglePreferencia = (canal: string, evento: string) => {
    setPreferencias(prev => {
      const existing = prev.find(p => p.canal === canal && p.evento === evento);
      if (existing) {
        return prev.map(p =>
          p.canal === canal && p.evento === evento
            ? { ...p, habilitado: !p.habilitado }
            : p
        );
      } else {
        return [...prev, { canal, evento, habilitado: true }];
      }
    });
  };

  const getPreferencia = (canal: string, evento: string): boolean => {
    const pref = preferencias.find(p => p.canal === canal && p.evento === evento);
    return pref?.habilitado ?? true;
  };

  const toggleCanal = (canal: string, habilitado: boolean) => {
    setPreferencias(prev => {
      const updated = [...prev];
      EVENTOS_CONFIG.forEach(evt => {
        const idx = updated.findIndex(p => p.canal === canal && p.evento === evt.id);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], habilitado };
        } else {
          updated.push({ canal, evento: evt.id, habilitado });
        }
      });
      return updated;
    });
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const res = await fetch("/api/preferencias-notificacion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferencias }),
      });
      if (res.ok) {
        toast.success("Preferencias guardadas");
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2000);
      } else {
        toast.error("Error al guardar preferencias");
      }
    } catch {
      toast.error("Error de conexion");
    } finally {
      setGuardando(false);
    }
  };

  // Agrupar eventos por grupo
  const grupos = EVENTOS_CONFIG.reduce((acc, evt) => {
    if (!acc[evt.grupo]) acc[evt.grupo] = [];
    acc[evt.grupo].push(evt);
    return acc;
  }, {} as Record<string, typeof EVENTOS_CONFIG>);

  return (
    <div className="space-y-5">
      {/* Canales de Notificacion */}
      <SectionCard title="Canales de Notificacion" icon={<Bell size={16} className="text-amber-500" />}>
        <div className="space-y-4">
          {CANALES_CONFIG.map(canal => (
            <div key={canal.id} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                {getIcon(canal.icon, "text-amber-500")}
                <div>
                  <div className="text-[12px] font-semibold text-slate-700">{canal.label}</div>
                  <div className="text-[10px] text-slate-400">{canal.description}</div>
                </div>
              </div>
              <button
                onClick={() => toggleCanal(canal.id, !getPreferencia(canal.id, EVENTOS_CONFIG[0].id))}
                className={"relative w-11 h-6 rounded-full transition-colors " + (getPreferencia(canal.id, EVENTOS_CONFIG[0].id) ? "bg-emerald-500" : "bg-slate-300")}
              >
                <div className={"absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform " + (getPreferencia(canal.id, EVENTOS_CONFIG[0].id) ? "left-6" : "left-1")} />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Preferencias por Evento */}
      <SectionCard title="Preferencias por Evento" icon={<Zap size={16} className="text-blue-500" />}>
        <p className="text-[11px] text-slate-400 mb-4">
          Configura que eventos quieres recibir y en que canales.
        </p>

        {/* Header de canales */}
        <div className="grid grid-cols-4 gap-2 mb-3 px-3">
          <div className="text-[10px] font-semibold text-slate-500">Evento</div>
          {CANALES_CONFIG.map(canal => (
            <div key={canal.id} className="flex items-center justify-center gap-1">
              {getIcon(canal.icon, "text-slate-500")}
              <span className="text-[10px] font-semibold text-slate-500">{canal.label}</span>
            </div>
          ))}
        </div>

        {/* Eventos por grupo */}
        {Object.entries(grupos).map(([grupo, eventos]) => (
          <div key={grupo} className="mb-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
              {grupo}
            </div>
            <div className="space-y-1">
              {eventos.map(evt => (
                <div key={evt.id} className="grid grid-cols-4 gap-2 items-center px-3 py-2 bg-slate-50/50 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    {getIcon(evt.icon, "text-blue-500")}
                    <span className="text-[11px] font-medium text-slate-700">{evt.label}</span>
                  </div>
                  {CANALES_CONFIG.map(canal => (
                    <div key={canal.id} className="flex justify-center">
                      <button
                        onClick={() => togglePreferencia(canal.id, evt.id)}
                        className={"w-8 h-5 rounded-full transition-colors " + (getPreferencia(canal.id, evt.id) ? "bg-emerald-500" : "bg-slate-200")}
                      >
                        <div className={"w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform mx-0.5 " + (getPreferencia(canal.id, evt.id) ? "translate-x-3" : "translate-x-0")} />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </SectionCard>

      {/* Boton Guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className={"flex items-center gap-2 px-6 py-2.5 rounded-xl text-[12px] font-semibold transition-all " + (guardado ? "bg-emerald-500 text-white" : "bg-slate-800 text-white hover:bg-slate-700")}
        >
          {guardando ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </>
          ) : guardado ? (
            <>
              <Check size={14} /> Guardado
            </>
          ) : (
            <>
              <Save size={14} /> Guardar Preferencias
            </>
          )}
        </button>
      </div>
    </div>
  );
}