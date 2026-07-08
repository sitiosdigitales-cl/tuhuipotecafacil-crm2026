"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Lead, Etapa, OrigenLead, Prioridad } from "@/tipos";

interface LeadContextType {
  leads: Lead[];
  agregarLead: (lead: Omit<Lead, "id" | "creadoEn">) => Promise<void>;
  actualizarLead: (id: string, datos: Partial<Lead>) => Promise<void>;
  eliminarLead: (id: string) => Promise<void>;
  obtenerLead: (id: string) => Lead | undefined;
  asignarEjecutivo: (leadId: string, nombreEjecutivo: string) => Promise<void>;
  moverEtapa: (leadId: string, nuevaEtapa: Etapa) => Promise<void>;
  leadCounts: Record<string, number>;
  cargando: boolean;
  recargarLeads: () => Promise<void>;
  obtenerCodigoReferido: (usuarioId: string) => string;
  obtenerLeadsPorReferido: (codigoReferido: string) => Lead[];
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

function convertirLead(data: any): Lead {
  return {
    id: data.id,
    nombre: data.nombre,
    apellido: data.apellido,
    rut: data.rut,
    email: data.email || undefined,
    telefono: data.telefono || undefined,
    origen: data.origen || "WEB",
    etapa: data.etapa || "NUEVO_LEAD",
    prioridad: data.prioridad || "MEDIA",
    nombreEjecutivo: data.nombreejecutivo || undefined,
    banco: data.banco || undefined,
    tipoCredito: data.tipocredito || undefined,
    montoSolicitado: data.montosolicitado || undefined,
    valorPropiedad: data.valorpropiedad || undefined,
    pieDisponible: data.piedisponible || undefined,
    notas: data.notas || undefined,
    situacionLaboral: data.situacionlaboral || "DEPENDIENTE",
    enDicom: data.endicom || false,
    dicomDetalle: data.dicomdetalle || undefined,
    rentaMensual: data.rentamensual || undefined,
    creadoEn: new Date(data.creadoen),
    diasEnEtapa: data.diasenetapa || 0,
  };
}

export function LeadProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cargando, setCargando] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const cargarLeads = useCallback(async () => {
    try {
      const response = await fetch("/api/leads");
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        setLeads(data.data.map((l: any) => ({
          ...l,
          creadoEn: new Date(l.creadoen || l.creadoEn),
          nombreEjecutivo: l.nombreejecutivo || l.nombreEjecutivo,
          tipoCredito: l.tipocredito || l.tipoCredito,
          montoSolicitado: l.montosolicitado || l.montoSolicitado,
          valorPropiedad: l.valorpropiedad || l.valorPropiedad,
          pieDisponible: l.piedisponible || l.pieDisponible,
          situacionLaboral: l.situacionlaboral || l.situacionLaboral,
          enDicom: l.endicom || l.enDicom,
          dicomDetalle: l.dicomdetalle || l.dicomDetalle,
          rentaMensual: l.rentamensual || l.rentaMensual,
          diasEnEtapa: l.diasenetapa || l.diasEnEtapa || 0,
        })));
      } else {
        setLeads([]);
      }
    } catch {
      setLeads([]);
    } finally {
      setCargando(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => { cargarLeads(); }, [cargarLeads]);

  useEffect(() => {
    if (!initialized) return;
    const interval = setInterval(() => {
      const nombres = ["Pedro", "Carmen", "Laura", "Roberto", "María", "Carlos", "Ana", "Juan", "Sofía", "Diego"];
      const apellidos = ["Sánchez", "López", "Fernández", "Vega", "González", "Rojas", "Torres", "Pérez", "Martínez", "Silva"];
      const nombre = nombres[Math.floor(Math.random() * nombres.length)];
      const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
      supabase.from("leads").insert({
        nombre, apellido,
        rut: `${Math.floor(Math.random() * 20000000 + 5000000).toLocaleString("es-CL")}-${Math.floor(Math.random() * 10) === 10 ? "K" : Math.floor(Math.random() * 10)}`,
        email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@email.cl`,
        telefono: `+569${Math.floor(Math.random() * 90000000 + 10000000)}`,
        origen: ["WEB", "FACEBOOK", "WHATSAPP", "REFERIDO"][Math.floor(Math.random() * 4)],
        etapa: "NUEVO_LEAD",
        prioridad: ["BAJA", "MEDIA", "ALTA"][Math.floor(Math.random() * 3)],
        banco: ["Banco de Chile", "Santander", "Bci", "Itaú", "Scotiabank"][Math.floor(Math.random() * 5)],
        tipocredito: "Credito Hipotecario",
        montosolicitado: Math.floor(Math.random() * 300 + 50) * 1000000,
        valorpropiedad: Math.floor(Math.random() * 400 + 100) * 1000000,
        piedisponible: Math.floor(Math.random() * 50 + 10) * 1000000,
        situacionlaboral: Math.random() > 0.5 ? "DEPENDIENTE" : "INDEPENDIENTE",
      }).then(() => cargarLeads());
    }, 60000);
    return () => clearInterval(interval);
  }, [initialized, cargarLeads]);

  const agregarLead = useCallback(async (leadData: Omit<Lead, "id" | "creadoEn">) => {
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
      });
      const data = await response.json();
      if (data.success && data.data) {
        await cargarLeads();
      }
    } catch {
      // fallback local
    }
  }, [cargarLeads]);

  const actualizarLead = useCallback(async (id: string, datos: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...datos } : l)));
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: datos.nombre, apellido: datos.apellido, etapa: datos.etapa,
          prioridad: datos.prioridad, nombreejecutivo: datos.nombreEjecutivo,
          banco: datos.banco, notas: datos.notas,
        }),
      });
    } catch {}
  }, []);

  const eliminarLead = useCallback(async (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch(`/api/leads/${id}`, { method: "DELETE" });
    } catch {}
  }, []);

  const obtenerLead = useCallback((id: string) => leads.find((l) => l.id === id), [leads]);

  const asignarEjecutivo = useCallback(async (leadId: string, nombreEjecutivo: string) => {
    await actualizarLead(leadId, { nombreEjecutivo });
  }, [actualizarLead]);

  const moverEtapa = useCallback(async (leadId: string, nuevaEtapa: Etapa) => {
    await actualizarLead(leadId, { etapa: nuevaEtapa, diasEnEtapa: 0 });
  }, [actualizarLead]);

  const leadCounts = leads.reduce((acc, lead) => { acc[lead.etapa] = (acc[lead.etapa] || 0) + 1; return acc; }, {} as Record<string, number>);

  const obtenerCodigoReferido = useCallback((usuarioId: string) => `REF-${usuarioId.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, []);

  const obtenerLeadsPorReferido = useCallback((codigoReferido: string) => leads.filter((l) => l.notas?.includes(codigoReferido)), [leads]);

  return (
    <LeadContext.Provider value={{ leads, agregarLead, actualizarLead, eliminarLead, obtenerLead, asignarEjecutivo, moverEtapa, leadCounts, cargando, recargarLeads: cargarLeads, obtenerCodigoReferido, obtenerLeadsPorReferido }}>
      {children}
    </LeadContext.Provider>
  );
}

export function useLeads() {
  const context = useContext(LeadContext);
  if (!context) throw new Error("useLeads debe ser usado dentro de un LeadProvider");
  return context;
}
