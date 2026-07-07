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

const NOMBRES_MOCK = ["Pedro", "Carmen", "Laura", "Roberto", "María", "Carlos", "Ana", "Juan", "Sofía", "Diego"];
const APELLIDOS_MOCK = ["Sánchez", "López", "Fernández", "Vega", "González", "Rojas", "Torres", "Pérez", "Martínez", "Silva"];
const ORIGENES_MOCK: OrigenLead[] = ["WEB", "FACEBOOK", "INSTAGRAM", "GOOGLE", "WHATSAPP", "REFERIDO"];
const ETAPAS_INICIALES: Etapa[] = ["NUEVO_LEAD", "CONTACTO_INICIAL", "CONTACTADO"];
const PRIORIDADES: Prioridad[] = ["BAJA", "MEDIA", "ALTA", "URGENTE"];

function crearLeadAleatorio(): Omit<Lead, "id" | "creadoEn"> {
  const nombre = NOMBRES_MOCK[Math.floor(Math.random() * NOMBRES_MOCK.length)];
  const apellido = APELLIDOS_MOCK[Math.floor(Math.random() * APELLIDOS_MOCK.length)];
  const origen = ORIGENES_MOCK[Math.floor(Math.random() * ORIGENES_MOCK.length)];
  const etapa = ETAPAS_INICIALES[Math.floor(Math.random() * ETAPAS_INICIALES.length)];
  const prioridad = PRIORIDADES[Math.floor(Math.random() * PRIORIDADES.length)];
  const monto = Math.floor(Math.random() * 300 + 50) * 1000000;

  return {
    nombre,
    apellido,
    rut: `${Math.floor(Math.random() * 20000000 + 5000000).toLocaleString("es-CL")}-${Math.floor(Math.random() * 10) === 10 ? "K" : Math.floor(Math.random() * 10)}`,
    email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@email.cl`,
    telefono: `+569${Math.floor(Math.random() * 90000000 + 10000000)}`,
    situacionLaboral: Math.random() > 0.5 ? "DEPENDIENTE" : "INDEPENDIENTE",
    enDicom: Math.random() > 0.8,
    origen,
    etapa,
    prioridad,
    banco: ["Banco de Chile", "Santander", "Bci", "Itaú", "Scotiabank"][Math.floor(Math.random() * 5)],
    montoSolicitado: monto,
    valorPropiedad: monto + Math.floor(Math.random() * 50 + 20) * 1000000,
    pieDisponible: Math.floor(Math.random() * 50 + 10) * 1000000,
    tipoCredito: "Crédito Hipotecario",
    diasEnEtapa: 0,
  };
}

export function LeadProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cargando, setCargando] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Cargar leads desde la API
  const cargarLeads = useCallback(async () => {
    try {
      const response = await fetch("/api/leads");
      const data = await response.json();

      if (data.success && data.data) {
        const leadsConFechas = data.data.map((l: any) => ({
          ...l,
          creadoEn: new Date(l.creadoEn),
          actualizadoEn: l.actualizadoEn ? new Date(l.actualizadoEn) : undefined,
        }));
        setLeads(leadsConFechas);
      }
    } catch (error) {
      console.error("Error al cargar leads:", error);
      // Fallback a datos mock si la API no está disponible
      const mockLeads = Array.from({ length: 50 }, (_, i) => ({
        id: `lead-${i + 1}`,
        ...crearLeadAleatorio(),
        creadoEn: new Date(Date.now() - Math.random() * 30 * 86400000),
        diasEnEtapa: Math.floor(Math.random() * 15) + 1,
      }));
      setLeads(mockLeads);
    } finally {
      setCargando(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    cargarLeads();
  }, [cargarLeads]);

  // Lead de prueba fijo para el portal
  useEffect(() => {
    if (!initialized) return;
    setLeads((prev) => {
      // Verificar si ya existe el lead de prueba
      const yaExiste = prev.some((l) => l.rut === "16.567.890-1");
      if (yaExiste) return prev;

      const leadPrueba = {
        id: "lead-prueba-001",
        nombre: "Juan Carlos",
        apellido: "Silva Muñoz",
        rut: "16.567.890-1",
        email: "juan.silva@gmail.com",
        telefono: "+56987654321",
        situacionLaboral: "INDEPENDIENTE" as const,
        enDicom: false,
        dicomDetalle: "Sin deudas registradas",
        origen: "REFERIDO" as const,
        etapa: "DOCS_COMPLETAS" as const,
        prioridad: "ALTA" as const,
        banco: "Banco de Chile",
        tipoCredito: "Crédito Hipotecario",
        montoSolicitado: 150000000,
        valorPropiedad: 220000000,
        pieDisponible: 70000000,
        rentaMensual: "$3.500.000",
        complementarRenta: false,
        nombreEjecutivo: "Andrés Pérez",
        notas: "Cliente interesado en crédito hipotecario para propiedad en Las Condes. Ya entregó toda la documentación. En espera de respuesta del banco.",
        creadoEn: new Date(Date.now() - 20 * 86400000),
        diasEnEtapa: 5,
      };

      // Guardar en API
      fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadPrueba),
      }).catch(() => {});

      return [leadPrueba, ...prev];
    });
  }, [initialized]);

  // Simular nuevos leads cada 60 segundos
  useEffect(() => {
    if (!initialized) return;

    const interval = setInterval(() => {
      const nuevoLead = crearLeadAleatorio();
      // Guardar en API (fire and forget)
      fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoLead),
      }).catch(() => {});

      // Agregar localmente
      setLeads((prev) => [
        {
          ...nuevoLead,
          id: `lead-${Date.now()}`,
          creadoEn: new Date(),
        },
        ...prev,
      ]);
    }, 60000);

    return () => clearInterval(interval);
  }, [initialized]);

  const agregarLead = useCallback(async (leadData: Omit<Lead, "id" | "creadoEn">) => {
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
      });
      const data = await response.json();

      if (data.success && data.data) {
        const nuevoLead = {
          ...data.data,
          creadoEn: new Date(data.data.creadoEn),
        };
        setLeads((prev) => [nuevoLead, ...prev]);
      }
    } catch (error) {
      // Fallback local
      const nuevoLead: Lead = {
        ...leadData,
        id: `lead-${Date.now()}`,
        creadoEn: new Date(),
      };
      setLeads((prev) => [nuevoLead, ...prev]);
    }
  }, []);

  const actualizarLead = useCallback(async (id: string, datos: Partial<Lead>) => {
    // Actualizar optimistamente
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...datos } : l))
    );

    // Enviar a API
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
    } catch (error) {
      console.error("Error al actualizar lead:", error);
    }
  }, []);

  const eliminarLead = useCallback(async (id: string) => {
    // Eliminar optimistamente
    setLeads((prev) => prev.filter((l) => l.id !== id));

    // Enviar a API
    try {
      await fetch(`/api/leads/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error al eliminar lead:", error);
    }
  }, []);

  const obtenerLead = useCallback((id: string) => {
    return leads.find((l) => l.id === id);
  }, [leads]);

  const asignarEjecutivo = useCallback(async (leadId: string, nombreEjecutivo: string) => {
    await actualizarLead(leadId, { nombreEjecutivo });
  }, [actualizarLead]);

  const moverEtapa = useCallback(async (leadId: string, nuevaEtapa: Etapa) => {
    await actualizarLead(leadId, { etapa: nuevaEtapa, diasEnEtapa: 0 });
  }, [actualizarLead]);

  const leadCounts = leads.reduce((acc, lead) => {
    acc[lead.etapa] = (acc[lead.etapa] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const obtenerCodigoReferido = useCallback((usuarioId: string) => {
    return `REF-${usuarioId.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }, []);

  const obtenerLeadsPorReferido = useCallback((codigoReferido: string) => {
    return leads.filter((l) => l.notas?.includes(codigoReferido));
  }, [leads]);

  return (
    <LeadContext.Provider value={{
      leads,
      agregarLead,
      actualizarLead,
      eliminarLead,
      obtenerLead,
      asignarEjecutivo,
      moverEtapa,
      leadCounts,
      cargando,
      recargarLeads: cargarLeads,
      obtenerCodigoReferido,
      obtenerLeadsPorReferido,
    }}>
      {children}
    </LeadContext.Provider>
  );
}

export function useLeads() {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error("useLeads debe ser usado dentro de un LeadProvider");
  }
  return context;
}
