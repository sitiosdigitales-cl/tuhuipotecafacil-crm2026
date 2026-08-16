"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import type { Lead, Etapa } from "@/tipos";

// Etapas que NO cuentan como carga activa
const ETAPAS_INACTIVAS = new Set(["CIERRE", "PERDIDO"]);

type LeadApi = Omit<Lead, "creadoEn"> & {
  creadoEn?: string | Date;
  creadoen?: string | Date;
};

interface RespuestaApi<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function normalizarLead(lead: LeadApi): Lead {
  const { creadoen, ...datos } = lead;
  return {
    ...datos,
    creadoEn: new Date(datos.creadoEn ?? creadoen ?? Date.now()),
  };
}

interface LeadContextType {
  leads: Lead[];
  agregarLead: (lead: Omit<Lead, "id" | "creadoEn">) => Promise<Lead>;
  actualizarLead: (id: string, datos: Partial<Lead>) => Promise<void>;
  eliminarLead: (id: string) => Promise<void>;
  asignarEjecutivo: (
    leadId: string,
    ejecutivo: { id: string; nombre: string } | null
  ) => Promise<void>;
  moverEtapa: (leadId: string, nuevaEtapa: Etapa) => Promise<void>;
  cargando: boolean;
  cargaPorEjecutivo: Record<string, number>;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export function LeadProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cargando, setCargando] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const cargarLeads = useCallback(async () => {
    try {
      const response = await fetch("/api/leads", { credentials: "include" });
      const data = await response.json() as RespuestaApi<LeadApi[]>;
      if (data.success && data.data && data.data.length > 0) {
        setLeads(data.data.map(normalizarLead));
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

  useEffect(() => {
    const timeout = window.setTimeout(() => void cargarLeads(), 0);
    return () => window.clearTimeout(timeout);
  }, [cargarLeads]);

  // Auto-actualizar cada 30 segundos (fallback)
  useEffect(() => {
    if (!initialized) return;
    const interval = setInterval(cargarLeads, 30000);
    return () => clearInterval(interval);
  }, [initialized, cargarLeads]);

  const agregarLead = useCallback(async (leadData: Omit<Lead, "id" | "creadoEn">) => {
    const response = await fetch("/api/leads", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData),
    });
    const data = (await response.json().catch(() => null)) as
      | RespuestaApi<LeadApi>
      | null;

    if (!response.ok || !data?.success || !data.data) {
      throw new Error(data?.error || "No se pudo crear el lead");
    }

    const leadPersistido = normalizarLead(data.data);
    setLeads((prev) => [leadPersistido, ...prev]);
    return leadPersistido;
  }, []);

  const actualizarLead = useCallback(async (id: string, datos: Partial<Lead>) => {
    const response = await fetch(`/api/leads/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const data = (await response.json().catch(() => null)) as
      | RespuestaApi<LeadApi>
      | null;

    if (!response.ok || !data?.success || !data.data) {
      throw new Error(data?.error || "No se pudo actualizar el lead");
    }

    const leadPersistido = normalizarLead(data.data);
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? leadPersistido : lead))
    );
  }, []);

  const eliminarLead = useCallback(async (id: string) => {
    const response = await fetch(`/api/leads/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await response.json().catch(() => null)) as
      | RespuestaApi<never>
      | null;

    if (!response.ok || !data?.success) {
      throw new Error(data?.error || "No se pudo eliminar el lead");
    }

    setLeads((prev) => prev.filter((lead) => lead.id !== id));
  }, []);

  const asignarEjecutivo = useCallback(async (
    leadId: string,
    ejecutivo: { id: string; nombre: string } | null
  ) => {
    await actualizarLead(leadId, {
      asignadoA: ejecutivo?.id ?? "",
      nombreEjecutivo: ejecutivo?.nombre ?? "",
    });
  }, [actualizarLead]);

  const moverEtapa = useCallback(async (leadId: string, nuevaEtapa: Etapa) => {
    await actualizarLead(leadId, { etapa: nuevaEtapa, diasEnEtapa: 0 });
  }, [actualizarLead]);

  // Leads activos por ejecutivo (excluye CIERRE y PERDIDO).
  // Memoizado porque un objeto nuevo aqui invalidaria el valor del contexto en
  // cada render, que es justo lo que este cambio viene a evitar.
  const cargaPorEjecutivo = useMemo(
    () =>
      leads.reduce((acc, lead) => {
        if (!lead.nombreEjecutivo || ETAPAS_INACTIVAS.has(lead.etapa)) return acc;
        acc[lead.nombreEjecutivo] = (acc[lead.nombreEjecutivo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    [leads]
  );

  // El objeto literal inline creaba una referencia nueva en cada render. React
  // compara por referencia, asi que los 25 componentes que usan useLeads() se
  // redibujaban cada 30 segundos aunque los datos fueran identicos.
  const valor = useMemo(
    () => ({
      leads, agregarLead, actualizarLead, eliminarLead, asignarEjecutivo,
      moverEtapa, cargando, cargaPorEjecutivo,
    }),
    [
      leads, agregarLead, actualizarLead, eliminarLead, asignarEjecutivo,
      moverEtapa, cargando, cargaPorEjecutivo,
    ]
  );

  return (
    <LeadContext.Provider value={valor}>
      {children}
    </LeadContext.Provider>
  );
}

export function useLeads() {
  const context = useContext(LeadContext);
  if (!context) throw new Error("useLeads debe ser usado dentro de un LeadProvider");
  return context;
}
