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

const STORAGE_KEY = "crm_leads";

// Datos iniciales de prueba
const LEADS_INICIALES: Lead[] = [
  { id: "lead-1", nombre: "Juan Carlos", apellido: "Silva Muñoz", rut: "16.567.890-1", email: "juan.silva@gmail.com", telefono: "+56987654321", origen: "REFERIDO", etapa: "DOCS_COMPLETAS", prioridad: "ALTA", banco: "Banco de Chile", tipoCredito: "Crédito Hipotecario", montoSolicitado: 150000000, valorPropiedad: 220000000, pieDisponible: 70000000, notas: "Cliente interesado en crédito hipotecario para propiedad en Las Condes", situacionLaboral: "INDEPENDIENTE", enDicom: false, nombreEjecutivo: "Andrés Pérez", creadoEn: new Date(Date.now() - 20 * 86400000), diasEnEtapa: 5 },
  { id: "lead-2", nombre: "María", apellido: "González", rut: "12.345.678-5", email: "maria.gonzalez@email.cl", telefono: "+56912345678", origen: "REFERIDO", etapa: "CONTACTADO", prioridad: "MEDIA", banco: "Santander", tipoCredito: "Crédito Hipotecario", montoSolicitado: 120000000, valorPropiedad: 180000000, pieDisponible: 60000000, notas: "Primera contactada por referido", situacionLaboral: "DEPENDIENTE", enDicom: false, nombreEjecutivo: "Andrés Pérez", creadoEn: new Date(Date.now() - 15 * 86400000), diasEnEtapa: 10 },
  { id: "lead-3", nombre: "Carlos", apellido: "Rojas", rut: "15.234.567-8", email: "carlos.rojas@email.cl", telefono: "+56923456789", origen: "FACEBOOK", etapa: "INTERESADO", prioridad: "ALTA", banco: "Bci", tipoCredito: "Crédito Hipotecario", montoSolicitado: 95000000, valorPropiedad: 140000000, pieDisponible: 45000000, notas: "Interesado en departamento en Providencia", situacionLaboral: "DEPENDIENTE", enDicom: false, nombreEjecutivo: "Carolina Muñoz", creadoEn: new Date(Date.now() - 12 * 86400000), diasEnEtapa: 7 },
  { id: "lead-4", nombre: "Juan", apellido: "Pérez", rut: "18.765.432-1", email: "juan.perez@email.cl", telefono: "+56934567890", origen: "GOOGLE", etapa: "PREAPROBADO", prioridad: "URGENTE", banco: "Itaú", tipoCredito: "Crédito Hipotecario", montoSolicitado: 200000000, valorPropiedad: 300000000, pieDisponible: 100000000, notas: "Crédito preaprobado por el banco", situacionLaboral: "INDEPENDIENTE", enDicom: false, nombreEjecutivo: "Diego Silva", creadoEn: new Date(Date.now() - 10 * 86400000), diasEnEtapa: 3 },
  { id: "lead-5", nombre: "Ana", apellido: "Torres", rut: "11.222.333-4", email: "ana.torres@email.cl", telefono: "+56945678901", origen: "WHATSAPP", etapa: "EVALUACION_BANCARIA", prioridad: "MEDIA", banco: "Scotiabank", tipoCredito: "Crédito de Consumo", montoSolicitado: 80000000, valorPropiedad: 120000000, pieDisponible: 40000000, notas: "En evaluación bancaria actualmente", situacionLaboral: "DEPENDIENTE", enDicom: false, nombreEjecutivo: "Valentina Torres", creadoEn: new Date(Date.now() - 8 * 86400000), diasEnEtapa: 12 },
  { id: "lead-6", nombre: "Laura", apellido: "Sánchez", rut: "19.876.543-2", email: "laura.sanchez@email.cl", telefono: "+56956789012", origen: "REFERIDO", etapa: "APROBADO", prioridad: "ALTA", banco: "Banco de Chile", tipoCredito: "Crédito Hipotecario", montoSolicitado: 175000000, valorPropiedad: 250000000, pieDisponible: 75000000, notas: "Crédito aprobado pendiente de desembolso", situacionLaboral: "INDEPENDIENTE", enDicom: false, nombreEjecutivo: "Andrés Pérez", creadoEn: new Date(Date.now() - 5 * 86400000), diasEnEtapa: 2 },
  { id: "lead-7", nombre: "Roberto", apellido: "Silva", rut: "13.456.789-0", email: "roberto.silva@email.cl", telefono: "+56967890123", origen: "FACEBOOK", etapa: "DOCS_PENDIENTES", prioridad: "MEDIA", banco: "Santander", tipoCredito: "Crédito Hipotecario", montoSolicitado: 130000000, valorPropiedad: 195000000, pieDisponible: 65000000, notas: "Esperando documentos pendientes", situacionLaboral: "DEPENDIENTE", enDicom: false, nombreEjecutivo: "Diego Silva", creadoEn: new Date(Date.now() - 12 * 86400000), diasEnEtapa: 8 },
  { id: "lead-8", nombre: "Fernanda", apellido: "Rojas", rut: "17.654.321-K", email: "fernanda.rojas@email.cl", telefono: "+56978901234", origen: "GOOGLE", etapa: "NUEVO_LEAD", prioridad: "BAJA", banco: "Bci", tipoCredito: "Crédito de Consumo", montoSolicitado: 50000000, valorPropiedad: 75000000, pieDisponible: 25000000, notas: "Nuevo lead sin contactar", situacionLaboral: "DEPENDIENTE", enDicom: false, nombreEjecutivo: "Valentina Torres", creadoEn: new Date(Date.now() - 1 * 86400000), diasEnEtapa: 1 },
  { id: "lead-9", nombre: "Diego", apellido: "Díaz", rut: "14.321.678-9", email: "diego.diaz@email.cl", telefono: "+56989012345", origen: "WHATSAPP", etapa: "CONTACTO_INICIAL", prioridad: "MEDIA", banco: "Itaú", tipoCredito: "Crédito Hipotecario", montoSolicitado: 160000000, valorPropiedad: 240000000, pieDisponible: 80000000, notas: "Contacto inicial programado", situacionLaboral: "INDEPENDIENTE", enDicom: false, nombreEjecutivo: "Carolina Muñoz", creadoEn: new Date(Date.now() - 4 * 86400000), diasEnEtapa: 4 },
  { id: "lead-10", nombre: "Valentina", apellido: "Morales", rut: "16.789.012-3", email: "valentina.morales@email.cl", telefono: "+56990123456", origen: "REFERIDO", etapa: "INTERESADO", prioridad: "ALTA", banco: "Scotiabank", tipoCredito: "Crédito Hipotecario", montoSolicitado: 140000000, valorPropiedad: 210000000, pieDisponible: 70000000, notas: "Muy interesada en crédito hipotecario", situacionLaboral: "DEPENDIENTE", enDicom: false, nombreEjecutivo: "Andrés Pérez", creadoEn: new Date(Date.now() - 6 * 86400000), diasEnEtapa: 6 },
];

export function LeadProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cargando, setCargando] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Cargar leads desde localStorage
  useEffect(() => {
    try {
      const guardados = localStorage.getItem(STORAGE_KEY);
      if (guardados) {
        const parsed = JSON.parse(guardados);
        setLeads(parsed.map((l: any) => ({
          ...l,
          creadoEn: new Date(l.creadoEn),
        })));
      } else {
        // Primera vez: cargar datos iniciales
        setLeads(LEADS_INICIALES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(LEADS_INICIALES));
      }
    } catch {
      setLeads(LEADS_INICIALES);
    } finally {
      setCargando(false);
      setInitialized(true);
    }
  }, []);

  // Guardar leads en localStorage cuando cambien
  useEffect(() => {
    if (initialized && leads.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    }
  }, [leads, initialized]);

  const agregarLead = useCallback(async (leadData: Omit<Lead, "id" | "creadoEn">) => {
    const nuevoLead: Lead = {
      ...leadData,
      id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      creadoEn: new Date(),
    };
    setLeads((prev) => [nuevoLead, ...prev]);
  }, []);

  const actualizarLead = useCallback(async (id: string, datos: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...datos } : l)));
  }, []);

  const eliminarLead = useCallback(async (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
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
      recargarLeads: async () => {},
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
