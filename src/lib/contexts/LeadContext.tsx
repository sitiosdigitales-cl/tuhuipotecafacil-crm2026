"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Lead, Etapa } from "@/tipos";

// Etapas que NO cuentan como carga activa
const ETAPAS_INACTIVAS = new Set(["CIERRE", "PERDIDO"]);

interface LeadContextType {
  leads: Lead[];
  agregarLead: (lead: Omit<Lead, "id" | "creadoEn">) => Promise<void>;
  actualizarLead: (id: string, datos: Partial<Lead>) => Promise<void>;
  eliminarLead: (id: string) => Promise<void>;
  asignarEjecutivo: (leadId: string, nombreEjecutivo: string) => Promise<void>;
  moverEtapa: (leadId: string, nuevaEtapa: Etapa) => Promise<void>;
  cargando: boolean;
  obtenerCodigoReferido: (usuarioId: string) => string;
  obtenerLeadsPorReferido: (codigoReferido: string) => Lead[];
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

  // Auto-actualizar cada 30 segundos (fallback)
  useEffect(() => {
    if (!initialized) return;
    const interval = setInterval(cargarLeads, 30000);
    return () => clearInterval(interval);
  }, [initialized, cargarLeads]);

  // Realtime: escuchar cambios en la tabla leads
  useEffect(() => {
    if (!initialized) return;

    const channel = supabase
      .channel("leads-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const nuevoLead = {
            ...payload.new,
            creadoEn: new Date(payload.new.creadoEn || payload.new.creadoen),
          } as Lead;
          setLeads((prev) => {
            if (prev.some((l) => l.id === nuevoLead.id)) return prev;
            return [nuevoLead, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload) => {
          const actualizado = payload.new;
          setLeads((prev) =>
            prev.map((l) =>
              l.id === actualizado.id
                ? { ...l, ...actualizado, creadoEn: new Date(actualizado.creadoEn || actualizado.creadoen || l.creadoEn) }
                : l
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "leads" },
        (payload) => {
          const eliminado = payload.old;
          setLeads((prev) => prev.filter((l) => l.id !== eliminado.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialized]);

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
    let leadsAnteriores: any[] = [];
    
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

  const obtenerCodigoReferido = useCallback((usuarioId: string) => {
    if (!usuarioId) return "";
    const storageKey = `crm_codigo_ref_${usuarioId}`;
    const existente = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (existente) return existente;
    const nuevo = `REF-${usuarioId.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    if (typeof window !== "undefined") localStorage.setItem(storageKey, nuevo);
    return nuevo;
  }, []);

  const obtenerLeadsPorReferido = useCallback((codigoReferido: string) => leads.filter((l) => l.notas?.includes(codigoReferido)), [leads]);

  // Leads activos por ejecutivo (excluye CIERRE y PERDIDO)
  const cargaPorEjecutivo = leads.reduce((acc, lead) => {
    if (!lead.nombreEjecutivo || ETAPAS_INACTIVAS.has(lead.etapa)) return acc;
    acc[lead.nombreEjecutivo] = (acc[lead.nombreEjecutivo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <LeadContext.Provider value={{ leads, agregarLead, actualizarLead, eliminarLead, asignarEjecutivo, moverEtapa, cargando, obtenerCodigoReferido, obtenerLeadsPorReferido, cargaPorEjecutivo }}>
      {children}
    </LeadContext.Provider>
  );
}

export function useLeads() {
  const context = useContext(LeadContext);
  if (!context) throw new Error("useLeads debe ser usado dentro de un LeadProvider");
  return context;
}
