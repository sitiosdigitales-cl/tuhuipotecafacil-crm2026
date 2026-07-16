"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/modulos/usuarios";
import { useLeads } from "@/modulos/leads";
import { ORIGEN_LABELS } from "@/tipos";
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Bell,
  ArrowRight,
  Filter,
} from "lucide-react";
import type { Lead } from "@/tipos";

interface Actividad {
  id: string;
  tipo: "lead" | "documento" | "aprobacion" | "tarea" | "llamada" | "email" | "whatsapp" | "reunion" | "seguimiento";
  titulo: string;
  accion: string;
  tiempo: Date;
  icono: typeof Users;
  color: string;
  leido: boolean;
  leadId?: string;
}

const TIPO_CONFIG: Record<string, { label: string; icono: typeof Users; color: string }> = {
  lead: { label: "Lead", icono: Users, color: "#3B82F6" },
  documento: { label: "Documento", icono: FileText, color: "#8B5CF6" },
  aprobacion: { label: "Aprobación", icono: CheckCircle, color: "#10B981" },
  tarea: { label: "Tarea", icono: Clock, color: "#F59E0B" },
  llamada: { label: "Llamada", icono: Phone, color: "#10B981" },
  email: { label: "Email", icono: Mail, color: "#3B82F6" },
  whatsapp: { label: "WhatsApp", icono: MessageSquare, color: "#22C55E" },
  reunion: { label: "Reunión", icono: Calendar, color: "#F59E0B" },
  seguimiento: { label: "Seguimiento", icono: Bell, color: "#6366F1" },
};

function generarActividadesDesdeLeads(leads: Lead[]): Actividad[] {
  const actividades: Actividad[] = [];
  const ahora = new Date();

  // Generar actividades basadas en leads reales
  leads.slice(0, 20).forEach((lead, idx) => {
    const tiempoBase = new Date(ahora.getTime() - (idx * 5 + Math.random() * 10) * 60000);

    // Actividad de lead nuevo
    if (idx < 8) {
      actividades.push({
        id: `act-lead-${lead.id}`,
        tipo: "lead",
        titulo: `${lead.nombre} ${lead.apellido}`,
        accion: `nuevo lead desde ${ORIGEN_LABELS[lead.origen] || lead.origen}`,
        tiempo: tiempoBase,
        icono: Users,
        color: "#3B82F6",
        leido: idx > 3,
        leadId: lead.id,
      });
    }

    // Actividad de documento
    if (idx % 4 === 0) {
      actividades.push({
        id: `act-doc-${lead.id}`,
        tipo: "documento",
        titulo: `${lead.nombre} ${lead.apellido}`,
        accion: "subió Certificado AFP",
        tiempo: new Date(tiempoBase.getTime() - 120000),
        icono: FileText,
        color: "#8B5CF6",
        leido: idx > 5,
        leadId: lead.id,
      });
    }

    // Actividad de aprobación
    if (lead.etapa === "APROBADO" || lead.etapa === "PREAPROBADO") {
      actividades.push({
        id: `act-aprob-${lead.id}`,
        tipo: "aprobacion",
        titulo: `${lead.nombre} ${lead.apellido}`,
        accion: `crédito ${lead.etapa === "APROBADO" ? "aprobado" : "preaprobado"} $ ${(lead.montoSolicitado || 0).toLocaleString("es-CL")}`,
        tiempo: new Date(tiempoBase.getTime() - 300000),
        icono: CheckCircle,
        color: "#10B981",
        leido: false,
        leadId: lead.id,
      });
    }

    // Actividad de seguimiento
    if (idx % 3 === 0 && idx < 15) {
      actividades.push({
        id: `act-seg-${lead.id}`,
        tipo: "seguimiento",
        titulo: `${lead.nombre} ${lead.apellido}`,
        accion: "respondió al seguimiento",
        tiempo: new Date(tiempoBase.getTime() - 600000),
        icono: Bell,
        color: "#6366F1",
        leido: true,
        leadId: lead.id,
      });
    }
  });

  // Ordenar por tiempo (más reciente primero)
  return actividades.sort((a, b) => b.tiempo.getTime() - a.tiempo.getTime()).slice(0, 12);
}

function formatearTiempo(fecha: Date): string {
  const ahora = new Date();
  const diff = ahora.getTime() - fecha.getTime();
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);

  if (minutos < 1) return "ahora";
  if (minutos < 60) return `${minutos}m`;
  if (horas < 24) return `${horas}h`;
  return `${dias}d`;
}

export function ActividadTiempoReal() {
  const router = useRouter();
  useUser();
  const { leads } = useLeads();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Generar actividades basadas en los leads reales del contexto
  useEffect(() => {
    if (leads.length === 0) return;
    const actividadesGeneradas = generarActividadesDesdeLeads(leads);
    setActividades(actividadesGeneradas);
  }, [leads]);

  // Simular nuevas actividades cada 45 segundos usando leads reales
  useEffect(() => {
    if (leads.length === 0) return;
    const interval = setInterval(() => {
      const leadAleatorio = leads[Math.floor(Math.random() * leads.length)];
      const tipos = ["lead", "documento", "seguimiento", "llamada"] as const;
      const tipoAleatorio = tipos[Math.floor(Math.random() * tipos.length)];

      const nuevaActividad: Actividad = {
        id: `act-new-${Date.now()}`,
        tipo: tipoAleatorio,
        titulo: `${leadAleatorio.nombre} ${leadAleatorio.apellido}`,
        accion: tipoAleatorio === "lead"
          ? `nuevo lead desde ${ORIGEN_LABELS[leadAleatorio.origen]}`
          : tipoAleatorio === "documento"
          ? "subió documento nuevo"
          : tipoAleatorio === "llamada"
          ? "respondió llamada"
          : "completó seguimiento",
        tiempo: new Date(),
        icono: TIPO_CONFIG[tipoAleatorio].icono,
        color: TIPO_CONFIG[tipoAleatorio].color,
        leido: false,
        leadId: leadAleatorio.id,
      };

      setActividades((prev) => [nuevaActividad, ...prev.slice(0, 11)]);
    }, 45000);

    return () => clearInterval(interval);
  }, [leads]);

  const actividadesFiltradas = useMemo(() => {
    if (filtroTipo === "todos") return actividades;
    return actividades.filter((a) => a.tipo === filtroTipo);
  }, [actividades, filtroTipo]);

  const noLeidos = actividades.filter((a) => !a.leido).length;

  const marcarLeidas = () => {
    setActividades((prev) => prev.map((a) => ({ ...a, leido: true })));
  };

  const handleVerActividad = (actividad: Actividad) => {
    if (actividad.leadId) {
      setActividades((prev) =>
        prev.map((a) => (a.id === actividad.id ? { ...a, leido: true } : a))
      );
      router.push(`/clientes/${actividad.leadId}`);
    }
  };

  const tiposDisponibles = useMemo(() => {
    const tipos = new Set(actividades.map((a) => a.tipo));
    return Array.from(tipos);
  }, [actividades]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100/80 dark:border-slate-700 shadow-soft overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell size={16} className="text-slate-400 dark:text-slate-500" />
            {noLeidos > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {noLeidos}
              </span>
            )}
          </div>
          <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">Actividad Reciente</span>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-600">VIVO</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
              mostrarFiltros
                ? "bg-blue-50 text-blue-600"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter size={10} />
            Filtros
          </button>
          {noLeidos > 0 && (
            <button
              onClick={marcarLeidas}
              className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Marcar leído
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFiltroTipo("todos")}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                filtroTipo === "todos"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos
            </button>
            {tiposDisponibles.map((tipo) => {
              const config = TIPO_CONFIG[tipo];
              if (!config) return null;
              const Icono = config.icono;
              return (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                    filtroTipo === tipo
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Icono size={10} />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid de actividades */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 dark:bg-slate-700">
        {actividadesFiltradas.slice(0, 8).map((actividad) => {
          const IconoAct = actividad.icono;
          return (
            <div
              key={actividad.id}
              onClick={() => handleVerActividad(actividad)}
              className={`bg-white dark:bg-slate-800 p-4 hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-all cursor-pointer group ${
                !actividad.leido
                  ? "bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-500/10 dark:to-slate-800"
                  : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${actividad.color}15` }}
                >
                  <IconoAct size={16} style={{ color: actividad.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                      {actividad.titulo}
                    </span>
                    {!actividad.leido && (
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {actividad.accion}
                  </p>
                  <span className="text-[11px] text-slate-300 dark:text-slate-500 mt-1 block">
                    {formatearTiempo(actividad.tiempo)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
        <button
          onClick={() => router.push("/reportes?tab=actividad")}
          className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors"
        >
          Ver toda la actividad <ArrowRight size={10} />
        </button>
      </div>
    </div>
  );
}
