"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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
          creadoEn: new Date(l.creadoEn),
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

  // Auto-actualizar cada 30 segundos
  useEffect(() => {
    if (!initialized) return;
    const interval = setInterval(cargarLeads, 30000);
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
    // Guardar estado anterior para rollback
    const leadsAnteriores = leads;

    // Optimistic update
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...datos } : l)));

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: "PUT",
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
  }, [leads]);

  const eliminarLead = useCallback(async (id: string) => {
    // Guardar estado anterior para rollback
    const leadsAnteriores = leads;
    const leadEliminado = leads.find((l) => l.id === id);

    // Optimistic update
    setLeads((prev) => prev.filter((l) => l.id !== id));

    try {
      const response = await fetch(`/api/leads/${id}`, { method: "DELETE" });

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
