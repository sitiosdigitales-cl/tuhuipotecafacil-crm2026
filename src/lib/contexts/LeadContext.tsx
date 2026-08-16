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
  agregarLead: (lead: Omit<Lead, "id" | "creadoEn">) => Promise<void>;
  actualizarLead: (id: string, datos: Partial<Lead>) => Promise<void>;
  eliminarLead: (id: string) => Promise<void>;
  asignarEjecutivo: (leadId: string, nombreEjecutivo: string) => Promise<void>;
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
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
      });
      const data = await response.json();
      if (data.success && data.data) {
        await cargarLeads();
      }
    } catch {
      // Fallback local si la API no está disponible
      const nuevoLead: Lead = {
        ...leadData,
        id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        creadoEn: new Date(),
      };
      setLeads((prev) => [nuevoLead, ...prev]);
    }
  }, [cargarLeads]);

  const actualizarLead = useCallback(async (id: string, datos: Partial<Lead>) => {
    // Guardar estado anterior para rollback usando functional update
    let leadsAnteriores: Lead[] = [];
    
    // Optimistic update con functional update para evitar stale closure
    setLeads((prev) => {
      leadsAnteriores = prev;
      return prev.map((l) => (l.id === id ? { ...l, ...datos } : l));
    });

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (!response.ok) {
        // Rollback si la API falla
        setLeads(leadsAnteriores);
      }
    } catch {
      // Rollback si hay error de red
      setLeads(leadsAnteriores);
    }
  }, []);

  const eliminarLead = useCallback(async (id: string) => {
    // Guardar estado anterior para rollback
    const leadEliminado = leads.find((l) => l.id === id);

    // Optimistic update
    setLeads((prev) => prev.filter((l) => l.id !== id));

    try {
      const response = await fetch(`/api/leads/${id}`, { method: "DELETE", credentials: "include" });

      if (!response.ok && leadEliminado) {
        // Rollback si la API falla
        setLeads((prev) => [...prev, leadEliminado].sort((a, b) =>
          new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
        ));
      }
    } catch {
      // Rollback si hay error de red
      if (leadEliminado) {
        setLeads((prev) => [...prev, leadEliminado].sort((a, b) =>
          new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
        ));
      }
    }
  }, [leads]);

  const asignarEjecutivo = useCallback(async (leadId: string, nombreEjecutivo: string) => {
    try {
      // Actualizar el lead con el nombre del ejecutivo
      const updateResponse = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreEjecutivo }),
      });

      if (updateResponse.ok) {
        // Actualizar estado local directamente
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, nombreEjecutivo }
              : l
          )
        );
      } else {
        const errorData = await updateResponse.json();
        console.error("[AsignarEjecutivo] API error:", errorData);
      }
    } catch (error) {
      console.error("[AsignarEjecutivo] Error:", error);
    }
  }, []);

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
