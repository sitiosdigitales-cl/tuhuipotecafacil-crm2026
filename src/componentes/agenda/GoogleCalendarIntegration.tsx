"use client";

import { useState, useEffect } from "react";
import {
  initGoogleCalendar,
  signInWithGoogle,
  signOutGoogle,
  isGoogleAuthenticated,
  createGoogleCalendarEvent,
  generateMeetLink,
} from "@/lib/services/googleCalendar";
import {
  Calendar,
  Video,
  Check,
  Loader2,
  LogIn,
  LogOut,
  ExternalLink,
  Copy,
  Settings,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface GoogleCalendarIntegrationProps {
  onEventCreated?: (event: {
    googleEventId: string;
    meetLink?: string;
    calendarLink: string;
  }) => void;
}

export function GoogleCalendarIntegration({ onEventCreated }: GoogleCalendarIntegrationProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await initGoogleCalendar();
        setIsLoaded(true);
        setIsAuthenticated(isGoogleAuthenticated());
      } catch (error) {
        // Error initializing Google Calendar
      }
    }
    init();
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const success = await signInWithGoogle();
      setIsAuthenticated(success);
      if (success) {
        toast.success("Conectado con Google Calendar", {
          description: "Ahora puedes crear eventos y reuniones con Google Meet",
        });
      }
    } catch (error) {
      toast.error("Error al conectar con Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    signOutGoogle();
    setIsAuthenticated(false);
    toast.info("Desconectado de Google Calendar");
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl">
        <Loader2 size={14} className="text-slate-400 animate-spin" />
        <span className="text-[11px] text-slate-500">Cargando Google Calendar...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-700">Google Conectado</span>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            title="Desconectar Google"
          >
            <LogOut size={14} className="text-slate-400" />
          </button>
        </>
      ) : (
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 size={12} className="text-slate-400 animate-spin" />
          ) : (
            <Calendar size={12} className="text-blue-500" />
          )}
          <span className="text-[10px] font-semibold text-slate-600">
            {isLoading ? "Conectando..." : "Conectar Google"}
          </span>
        </button>
      )}
    </div>
  );
}

// Componente para crear evento con Google Calendar y Meet
interface CrearEventoGoogleProps {
  onCrearEvento: (evento: {
    titulo: string;
    descripcion: string;
    fechaInicio: Date;
    fechaFin: Date;
    crearMeet: boolean;
    emails: string[];
  }) => void;
  onClose: () => void;
}

export function CrearEventoGoogle({ onCrearEvento, onClose }: CrearEventoGoogleProps) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [horaInicio, setHoraInicio] = useState("10:00");
  const [horaFin, setHoraFin] = useState("11:00");
  const [crearMeet, setCrearMeet] = useState(true);
  const [emails, setEmails] = useState("");
  const [isAuthenticated] = useState(isGoogleAuthenticated());

  const handleCrear = () => {
    const [inicioHoras, inicioMinutos] = horaInicio.split(":").map(Number);
    const [finHoras, finMinutos] = horaFin.split(":").map(Number);

    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(inicioHoras, inicioMinutos, 0);

    const fechaFin = new Date(fecha);
    fechaFin.setHours(finHoras, finMinutos, 0);

    onCrearEvento({
      titulo,
      descripcion,
      fechaInicio,
      fechaFin,
      crearMeet,
      emails: emails.split(",").map((e) => e.trim()).filter(Boolean),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Título de la reunión
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej: Reunión de seguimiento con cliente"
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Descripción
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Detalles de la reunión..."
          rows={2}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Fecha
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Hora inicio
          </label>
          <input
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Hora fin
          </label>
          <input
            type="time"
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Participantes (email, separados por coma)
        </label>
        <input
          type="text"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder="cliente@email.com, otro@email.com"
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>

      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <input
          type="checkbox"
          id="crearMeet"
          checked={crearMeet}
          onChange={(e) => setCrearMeet(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-white border-blue-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="crearMeet" className="flex items-center gap-2 cursor-pointer">
          <Video size={14} className="text-blue-600" />
          <span className="text-[11px] font-semibold text-blue-700">Crear enlace de Google Meet</span>
        </label>
      </div>

      {!isAuthenticated && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <AlertCircle size={14} className="text-amber-600" />
          <span className="text-[10px] text-amber-700">
            Conecta tu cuenta de Google para sincronizar con Google Calendar
          </span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:text-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleCrear}
          disabled={!titulo || !fecha}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[11px] font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {crearMeet ? <Video size={12} /> : <Calendar size={12} />}
          {crearMeet ? "Crear con Meet" : "Crear evento"}
        </button>
      </div>
    </div>
  );
}

// Componente para mostrar link de Meet
export function MeetLinkDisplay({ meetLink }: { meetLink: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(meetLink);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
      <Video size={14} className="text-blue-600 flex-shrink-0" />
      <a
        href={meetLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 truncate"
      >
        {meetLink}
      </a>
      <button
        onClick={handleCopy}
        className="p-1 hover:bg-blue-100 rounded transition-colors"
      >
        {copied ? (
          <Check size={12} className="text-emerald-600" />
        ) : (
          <Copy size={12} className="text-blue-500" />
        )}
      </button>
      <a
        href={meetLink}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1 hover:bg-blue-100 rounded transition-colors"
      >
        <ExternalLink size={12} className="text-blue-500" />
      </a>
    </div>
  );
}
