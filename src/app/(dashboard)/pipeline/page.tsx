"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import {
  Search,
  DollarSign,
  Plus,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Users,
  Banknote,
  ArrowLeft,
  Layout,
  LayoutList,
  LayoutGrid,
  UserPlus,
} from "lucide-react";
import {
  COLOR_ETAPA_POR_DEFECTO,
  ETAPAS_CONFIG,
  etapasPorDefecto,
  ROLES_CONFIG,
} from "@/tipos";
import { formatoMonedaAbreviado } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FormularioLead } from "@/componentes/leads/FormularioLead";
import { PipelineSkeleton } from "@/componentes/pipeline/PipelineSkeleton";
import {
  PipelineLeadCard,
  PipelineLeadDetail,
} from "@/componentes/pipeline/PipelineLeadCard";
import { useUser } from "@/modulos/usuarios";
import { useLeads } from "@/modulos/leads";
import { useActivities } from "@/lib/contexts/ActivityContext";
import { validarAvance, type ResultadoValidacion, type ReglaValidacion } from "@/modulos/leads/validaciones-pipeline";
import type { EjecutivoAsignable } from "@/componentes/pipeline/AsignarEjecutivo";
import { toast } from "sonner";
import type { Lead, Etapa, EtapaPipeline, SituacionLaboral } from "@/tipos";

// Documentos obligatorios por situación laboral (mismos que en clientes/[id]/page.tsx)
const DOCUMENTOS_OBLIGATORIOS: Record<SituacionLaboral, string[]> = {
  DEPENDIENTE: ["liq-sueldo", "afp", "cedula", "anexo-laboral", "domicilio", "dicom"],
  INDEPENDIENTE: ["boletas", "resumen-mensual", "resumen-anual-2026", "resumen-anual-2025", "renta-2026", "aceptacion-renta-2026", "cartera-trib", "cedula", "dicom"],
  EMPRESA: ["cedula-socios", "cartera-trib-36", "cartera-trib-credito", "balance-2025", "balance-2024", "renta-f22-2026", "renta-f22-2025", "aceptacion-renta-2026", "aceptacion-renta-2025", "rol-empresa", "cert-tgr", "dicom"],
};

async function verificarDocumentosCompletos(lead: Lead): Promise<{ completo: boolean; faltantes: string[] }> {
  try {
    const res = await fetch(`/api/documentos?leadId=${lead.id}`);
    const json = await res.json();
    const docs = json.data || [];

    const obligatorios = DOCUMENTOS_OBLIGATORIOS[lead.situacionLaboral] || DOCUMENTOS_OBLIGATORIOS.DEPENDIENTE;

    // Mapeo de IDs del pipeline a tipos de la BD
    const idATipo: Record<string, string> = {
      "liq-sueldo": "COMPROBANTE_INGRESOS",
      "afp": "CERTIFICADO_AFP",
      "cedula": "CEDULA_IDENTIDAD",
      "antiguedad": "CONTRATO_TRABAJO",
      "domicilio": "OTRO",
      "dicom": "OTRO",
      "carpeta-trib": "DECLARACION_RENTA",
      "renta": "DECLARACION_RENTA",
    };

    // Nombres legibles
    const idANombre: Record<string, string> = {
      "liq-sueldo": "Liquidaciones de sueldo",
      "afp": "Certificado cotizaciones AFP",
      "cedula": "Cédula de identidad",
      "antiguedad": "Certificado antigüedad laboral",
      "domicilio": "Comprobante de domicilio",
      "dicom": "Informe DICOM",
      "carpeta-trib": "Carpeta tributaria",
      "renta": "Declaración de renta",
    };

    const faltantes: string[] = [];

    for (const docId of obligatorios) {
      const tipoBD = idATipo[docId] || "OTRO";

      // Verificar si hay al menos un documento de este tipo cargado
      const tieneDoc = docs.some((d: { tipo: string; estado: string }) => {
        if (d.tipo !== tipoBD) return false;
        // Si es "OTRO", verificar por nombre en documentos del lead
        if (tipoBD === "OTRO") {
          return d.estado === "APROBADO" || d.estado === "RECIBIDO" || d.estado === "EN_REVISION";
        }
        return d.estado === "APROBADO" || d.estado === "RECIBIDO" || d.estado === "EN_REVISION";
      });

      // Verificar por nombre también (más confiable)
      const nombreDoc = idANombre[docId] || docId;
      const tienePorNombre = docs.some((d: { nombre: string; estado: string }) =>
        d.nombre?.toLowerCase().includes(nombreDoc.toLowerCase()) &&
        (d.estado === "APROBADO" || d.estado === "RECIBIDO" || d.estado === "EN_REVISION")
      );

      if (!tieneDoc && !tienePorNombre) {
        faltantes.push(nombreDoc);
      }
    }

    return { completo: faltantes.length === 0, faltantes };
  } catch {
    return { completo: false, faltantes: ["Error al verificar documentos"] };
  }
}

/** Etapas que cuentan como oportunidad ganada. Ya se usaban para `aprobados`. */
const ETAPAS_GANADAS: string[] = ["APROBADO", "FIRMA_DIGITAL", "NOTARIA", "CREDITO_PAGADO"];

function normalizarTextoBusqueda(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarIdentificador(value: string) {
  return normalizarTextoBusqueda(value).replace(/[^a-z0-9@+]/g, "");
}

function leadCoincideConBusqueda(lead: Lead, query: string) {
  if (!query.trim()) return true;

  const campos = [
    lead.nombre,
    lead.apellido,
    `${lead.nombre} ${lead.apellido}`,
    lead.rut,
    lead.telefono,
    lead.email,
    lead.banco,
    lead.tipoCredito,
    lead.nombreEjecutivo,
  ].filter(Boolean).join(" ");
  const texto = normalizarTextoBusqueda(campos);
  const identificadores = normalizarIdentificador(campos);

  return normalizarTextoBusqueda(query)
    .split(" ")
    .filter(Boolean)
    .every((termino) =>
      texto.includes(termino) || identificadores.includes(normalizarIdentificador(termino))
    );
}

export default function PipelinePage() {
  const router = useRouter();
  const { usuarioActual, esSuperAdmin, usuarios } = useUser();
  const { leads, agregarLead, actualizarLead, eliminarLead, moverEtapa, cargaPorEjecutivo, cargando } = useLeads();
  const { agregarActividad } = useActivities();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEjecutivo, setFiltroEjecutivo] = useState("todos");
  const [eliminarDialogOpen, setEliminarDialogOpen] = useState(false);
  const [leadAEliminar, setLeadAEliminar] = useState<Lead | null>(null);
  const [formularioOpen, setFormularioOpen] = useState(false);
  const [leadSeleccionado, setLeadSeleccionado] = useState<Lead | null>(null);
  const [leadDetalle, setLeadDetalle] = useState<Lead | null>(null);
  const [validacionModal, setValidacionModal] = useState<{ open: boolean; resultado: ResultadoValidacion | null; lead: Lead | null; etapaDestino: string }>({
    open: false,
    resultado: null,
    lead: null,
    etapaDestino: "",
  });
  const leadsAnteriores = useRef(leads.length);
  const [etapasPipeline, setEtapasPipeline] = useState<EtapaPipeline[]>(etapasPorDefecto);
  const [vistaModo, setVistaModo] = useState<"kanban" | "ejecutivos">("kanban");
  const [filtroEtapa, setFiltroEtapa] = useState<string>("todas");

  // Cargar etapas desde la API
  useEffect(() => {
    async function cargarEtapas() {
      try {
        const res = await fetch("/api/pipeline/stages");
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          // Se conservan nombre y color: el tablero los pinta desde aqui y no
          // desde ETAPAS_CONFIG, que no conoce las etapas personalizadas.
          const etapasActivas = (data.data as EtapaPipeline[])
            .filter((etapa) => etapa.activa)
            .sort((a, b) => a.orden - b.orden);
          setEtapasPipeline(etapasActivas);
        }
      } catch {
        // Usar etapas por defecto si falla
      }
    }
    cargarEtapas();
  }, []);

  // Detectar nuevos leads
  useEffect(() => {
    if (leads.length > leadsAnteriores.current) {
      toast.info("Nuevo lead en el pipeline", {
        description: `${leads[0]?.nombre} ${leads[0]?.apellido} agregado a Nuevo Lead`,
      });
    }
    leadsAnteriores.current = leads.length;
  }, [leads]);

  // Filtrar leads: NUEVO_LEAD visible para todos, otros solo para el ejecutivo asignado
  const leadsUsuario = useMemo(() => {
    if (esSuperAdmin) return leads;
    const nombreCompleto = `${usuarioActual.nombre} ${usuarioActual.apellido}`;
    return leads.filter((l) => {
      // Leads nuevos sin asignar o asignados a mí: siempre visibles
      if (l.etapa === "NUEVO_LEAD") return true;
      // Leads en otras etapas: solo si estoy asignado
      return l.nombreEjecutivo === nombreCompleto;
    });
  }, [leads, esSuperAdmin, usuarioActual]);

  // Obtener ejecutivos únicos de los leads
  const ejecutivos = useMemo(() => {
    const nombres = new Set(leadsUsuario.map((l) => l.nombreEjecutivo).filter(Boolean));
    return Array.from(nombres).sort();
  }, [leadsUsuario]);

  const leadsBaseFiltrados = useMemo(() => {
    return leadsUsuario.filter((lead) => {
      const coincideEjecutivo = filtroEjecutivo === "todos" || lead.nombreEjecutivo === filtroEjecutivo;
      return leadCoincideConBusqueda(lead, busqueda) && coincideEjecutivo;
    });
  }, [leadsUsuario, busqueda, filtroEjecutivo]);

  const leadsFiltrados = useMemo(() => (
    filtroEtapa === "todas"
      ? leadsBaseFiltrados
      : leadsBaseFiltrados.filter((lead) => lead.etapa === filtroEtapa)
  ), [filtroEtapa, leadsBaseFiltrados]);

  const cantidadPorEtapa = useMemo(() => (
    leadsBaseFiltrados.reduce<Record<string, number>>((cantidades, lead) => {
      cantidades[lead.etapa] = (cantidades[lead.etapa] || 0) + 1;
      return cantidades;
    }, {})
  ), [leadsBaseFiltrados]);

  const etapasVisibles = useMemo(() => (
    filtroEtapa === "todas"
      ? etapasPipeline
      : etapasPipeline.filter((etapa) => etapa.id === filtroEtapa)
  ), [etapasPipeline, filtroEtapa]);

  const stats = useMemo(() => ({
    total: leadsFiltrados.length,
    montoTotal: leadsFiltrados.reduce((acc, l) => acc + (l.montoSolicitado || 0), 0),
    valorPropiedad: leadsFiltrados.reduce((acc, l) => acc + (l.valorPropiedad || 0), 0),
    aprobados: leadsFiltrados.filter(l => ETAPAS_GANADAS.includes(l.etapa)).length,
  }), [leadsFiltrados]);

  const handleAsignarEjecutivo = useCallback(async (
    leadId: string,
    ejecutivo: EjecutivoAsignable | null
  ) => {
    const lead = leads.find((item) => item.id === leadId);
    try {
      await actualizarLead(leadId, {
        asignadoA: ejecutivo?.id ?? "",
        nombreEjecutivo: ejecutivo?.nombre ?? "",
      });
      setLeadDetalle((actual) => actual?.id === leadId
        ? {
            ...actual,
            asignadoA: ejecutivo?.id ?? "",
            nombreEjecutivo: ejecutivo?.nombre ?? "",
          }
        : actual
      );
      if (lead) {
        toast.success("Ejecutivo asignado", {
          description: ejecutivo
            ? `${lead.nombre} ${lead.apellido} asignado a ${ejecutivo.nombre}`
            : `${lead.nombre} ${lead.apellido} sin asignar`,
        });
      }
    } catch {
      toast.error("No se pudo actualizar la asignación");
    }
  }, [actualizarLead, leads]);

  // Capturar el lead al iniciar el arrastre
  const onDragStart = useCallback(() => {}, []);

  const onDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const destinoId = destination.droppableId;
    const origenId = source.droppableId;

    // Detectar si es un ejecutivo siendo arrastrado hacia un lead
    if (origenId.startsWith("ejec-drag-")) {
      const identificadorEjecutivo = origenId.replace("ejec-drag-", "");
      const usuarioDestino = usuarios.find((usuario) =>
        usuario.id === identificadorEjecutivo ||
        `${usuario.nombre} ${usuario.apellido}` === identificadorEjecutivo
      );
      // Verificar si el destino es un lead
      if (destinoId.startsWith("lead-drop-") && usuarioDestino) {
        const leadId = destinoId.replace("lead-drop-", "");
        await handleAsignarEjecutivo(leadId, {
          id: usuarioDestino.id,
          nombre: `${usuarioDestino.nombre} ${usuarioDestino.apellido}`,
        });
        return;
      }
    }

    // Detectar si es asignación de ejecutivo (sidebar o vista ejecutivo) - flujo antiguo
    const esAsignacionEjecutivo = destinoId.startsWith("ejec-") || destinoId.startsWith("ejec-view-");
    if (esAsignacionEjecutivo) {
      // Buscar el lead en la columna de origen
      let leadMovido: Lead | undefined;
      if (source.droppableId === "ejec-view-sin-asignar") {
        leadMovido = leadsFiltrados.filter((l) => !l.nombreEjecutivo)[source.index];
      } else if (source.droppableId.startsWith("ejec-view-")) {
        // Viene de la vista por ejecutivo
        const usuarioOrigenId = source.droppableId.replace("ejec-view-", "");
        const usuarioOrigen = usuarios.find((usuario) => usuario.id === usuarioOrigenId);
        const nombreOrigen = usuarioOrigen
          ? `${usuarioOrigen.nombre} ${usuarioOrigen.apellido}`
          : "";
        const leadsDelOrigen = leadsFiltrados.filter((lead) =>
          lead.asignadoA === usuarioOrigenId ||
          (!lead.asignadoA && lead.nombreEjecutivo === nombreOrigen)
        );
        leadMovido = leadsDelOrigen[source.index];
      } else {
        // Viene de una etapa del kanban
        leadMovido = leadsFiltrados.filter((l) => l.etapa === source.droppableId)[source.index];
      }
      if (!leadMovido) return;

      // Extraer nombre del ejecutivo destino
      const usuarioDestinoId = destinoId
        .replace("ejec-view-", "")
        .replace("ejec-", "");
      const usuarioDestino = destinoId === "ejec-view-sin-asignar"
        ? null
        : usuarios.find((usuario) =>
            usuario.id === usuarioDestinoId ||
            `${usuario.nombre} ${usuario.apellido}` === usuarioDestinoId
          );

      if (destinoId !== "ejec-view-sin-asignar" && !usuarioDestino) {
        toast.error("No se pudo identificar al ejecutivo seleccionado");
        return;
      }

      await handleAsignarEjecutivo(
        leadMovido.id,
        usuarioDestino
          ? {
              id: usuarioDestino.id,
              nombre: `${usuarioDestino.nombre} ${usuarioDestino.apellido}`,
            }
          : null
      );
      return;
    }

    // Flujo normal: mover entre etapas del pipeline
    const etapaOrigen = source.droppableId;
    const leadsEnEtapaOrigen = leadsFiltrados.filter((l) => l.etapa === etapaOrigen);
    const leadMovido = leadsEnEtapaOrigen[source.index];
    if (!leadMovido) return;

    const etapaDestino = destinoId;

    // Validar reglas antes de avanzar
    const resultado = validarAvance(leadMovido, etapaDestino);

    if (!resultado.puedeAvanzar) {
      setValidacionModal({
        open: true,
        resultado,
        lead: leadMovido,
        etapaDestino,
      });
      return;
    }

    // REGLA ESPECIAL: Avance a DOCS_COMPLETAS requiere documentos cargados
    if (etapaDestino === "DOCS_COMPLETAS" && leadMovido.etapa !== "DOCS_COMPLETAS") {
      const verificacion = await verificarDocumentosCompletos(leadMovido);

      if (!verificacion.completo) {
        const reglasDocumentosFaltantes: ReglaValidacion[] = verificacion.faltantes.map((nombre) => ({
          id: `doc-faltante-${nombre}`,
          nombre: `Documento faltante: ${nombre}`,
          descripcion: `El documento "${nombre}" debe estar cargado antes de avanzar a Docs. Completas`,
          verificar: () => false,
          obligatoria: true,
        }));

        const resultadoDoc: ResultadoValidacion = {
          puedeAvanzar: false,
          reglasPasadas: resultado.reglasPasadas,
          reglasFallidas: reglasDocumentosFaltantes,
          advertencias: resultado.advertencias,
        };

        setValidacionModal({
          open: true,
          resultado: resultadoDoc,
          lead: leadMovido,
          etapaDestino,
        });
        return;
      }
    }

    const nombreEtapaOrigen = ETAPAS_CONFIG[leadMovido.etapa]?.label || leadMovido.etapa;
    const nombreEtapaDestino = ETAPAS_CONFIG[etapaDestino as Etapa]?.label || etapaDestino;
    try {
      await moverEtapa(leadMovido.id, etapaDestino as Etapa);
      void agregarActividad({
        leadId: leadMovido.id,
        tipo: "cambio_estado",
        titulo: "Cambio de etapa",
        descripcion: `${leadMovido.nombre} ${leadMovido.apellido} movido de ${nombreEtapaOrigen} a ${nombreEtapaDestino}`,
        usuario: usuarioActual?.nombre ? `${usuarioActual.nombre} ${usuarioActual.apellido}` : "Sistema",
        usuarioId: usuarioActual?.id || "system",
      }).catch(() => {
        toast.warning("La etapa cambió, pero no se registró su actividad");
      });

      toast.success(`Lead movido a ${nombreEtapaDestino}`, {
        description: `${leadMovido.nombre} ${leadMovido.apellido} avanzó de etapa`,
      });
    } catch {
      toast.error("No se pudo mover el lead", {
        description: "La etapa anterior fue restaurada.",
      });
    }
  }, [
    leadsFiltrados,
    moverEtapa,
    agregarActividad,
    usuarioActual,
    usuarios,
    handleAsignarEjecutivo,
  ]);

  const forzarAvance = async () => {
    if (!validacionModal.lead || !validacionModal.etapaDestino) return;

    // Registrar actividad de avance forzado
    const nombreEtapaOrigen = ETAPAS_CONFIG[validacionModal.lead.etapa]?.label || validacionModal.lead.etapa;
    const nombreEtapaDestino = ETAPAS_CONFIG[validacionModal.etapaDestino as Etapa]?.label || validacionModal.etapaDestino;
    try {
      await moverEtapa(
        validacionModal.lead.id,
        validacionModal.etapaDestino as Etapa
      );
      void agregarActividad({
        leadId: validacionModal.lead.id,
        tipo: "cambio_estado",
        titulo: "Avance forzado",
        descripcion: `${validacionModal.lead.nombre} ${validacionModal.lead.apellido} movido de ${nombreEtapaOrigen} a ${nombreEtapaDestino} (avance forzado)`,
        usuario: usuarioActual?.nombre ? `${usuarioActual.nombre} ${usuarioActual.apellido}` : "Sistema",
        usuarioId: usuarioActual?.id || "system",
      }).catch(() => {
        toast.warning("El avance se guardó, pero no su actividad");
      });

      toast.success(`Avance forzado a ${nombreEtapaDestino}`, {
        description: `${validacionModal.lead.nombre} ${validacionModal.lead.apellido} movido manualmente`,
      });
      setValidacionModal({ open: false, resultado: null, lead: null, etapaDestino: "" });
    } catch {
      toast.error("No se pudo forzar el avance");
    }
  };

  const handleEliminarLead = (lead: Lead) => {
    setLeadDetalle(null);
    setLeadAEliminar(lead);
    setEliminarDialogOpen(true);
  };

  const handleConfirmarEliminar = async () => {
    if (leadAEliminar) {
      const nombre = `${leadAEliminar.nombre} ${leadAEliminar.apellido}`;
      try {
        await eliminarLead(leadAEliminar.id);
        setLeadAEliminar(null);
        toast.success("Lead eliminado", {
          description: `${nombre} fue eliminado del pipeline`,
        });
      } catch {
        toast.error("No se pudo eliminar el lead");
      }
    }
  };

  const handleNuevoLead = () => {
    setLeadSeleccionado(null);
    setFormularioOpen(true);
  };

  const handleEditarLead = (lead: Lead) => {
    setLeadDetalle(null);
    setLeadSeleccionado(lead);
    setFormularioOpen(true);
  };

  const handleSubmitLead = async (data: Partial<Lead>) => {
    try {
      if (leadSeleccionado) {
        await actualizarLead(leadSeleccionado.id, data);
        toast.success("Lead actualizado", {
          description: `${data.nombre} ${data.apellido} fue actualizado`,
        });
      } else {
        const newLead: Omit<Lead, "id" | "creadoEn"> = {
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          rut: data.rut || "",
          email: data.email,
          telefono: data.telefono,
          situacionLaboral: data.situacionLaboral || "INDEPENDIENTE",
          enDicom: data.enDicom || false,
          origen: data.origen || "WEB",
          etapa: data.etapa || "NUEVO_LEAD",
          prioridad: data.prioridad || "MEDIA",
          banco: data.banco,
          montoSolicitado: data.montoSolicitado,
          valorPropiedad: data.valorPropiedad,
          pieDisponible: data.pieDisponible,
          notas: data.notas,
          diasEnEtapa: 0,
          asignadoA: usuarioActual.id,
          nombreEjecutivo: `${usuarioActual.nombre} ${usuarioActual.apellido}`,
        };
        await agregarLead(newLead);
        toast.success("Lead creado", {
          description: `${newLead.nombre} ${newLead.apellido} fue agregado al pipeline`,
        });
      }
      setFormularioOpen(false);
      setLeadSeleccionado(null);
      return true;
    } catch {
      toast.error("No se pudieron guardar los cambios", {
        description: "El formulario permanece abierto para volver a intentar.",
      });
      return false;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-100 dark:from-slate-900 via-slate-50 dark:via-slate-800 to-blue-50 dark:to-blue-950 overflow-hidden">
      {/* Header fijo */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4">
              <button
               onClick={() => router.push("/dashboard")}
               className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
               title="Volver al dashboard"
             >
               <ArrowLeft size={18} className="text-slate-600 dark:text-slate-300" />
             </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
                <Layout size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Pipeline
                </h1>
                <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium hidden sm:block">
                  {esSuperAdmin ? "Gestión de oportunidades de crédito hipotecario" : "Tus oportunidades de crédito"}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg">
               <Users size={12} className="text-slate-400 dark:text-slate-400" />
               <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{stats.total}</span>
               <span className="text-[11px] text-slate-400 dark:text-slate-500">leads</span>
             </div>
             <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
               <DollarSign size={12} className="text-blue-500 dark:text-blue-400" />
               <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">{formatoMonedaAbreviado(stats.montoTotal)}</span>
             </div>
             <div className="hidden items-center gap-2 rounded-lg bg-purple-50 px-2.5 py-1.5 dark:bg-purple-900/30 xl:flex">
               <Banknote size={12} className="text-purple-500 dark:text-purple-400" />
               <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">{formatoMonedaAbreviado(stats.valorPropiedad)}</span>
             </div>
             <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
               <TrendingUp size={12} className="text-emerald-500 dark:text-emerald-400" />
               <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">{stats.aprobados}</span>
             </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button onClick={handleNuevoLead} className="gap-1.5 shadow-lg shadow-blue-600/15 text-[11px] sm:text-sm">
              <Plus size={14} /> <span className="hidden sm:inline">Nuevo Lead</span><span className="sm:hidden">Nuevo</span>
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
          <div className="relative min-w-[220px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="search"
              aria-label="Buscar oportunidades"
              placeholder="Buscar por nombre, RUT, teléfono, correo, banco o ejecutivo..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              className="w-full rounded-xl border border-slate-200/70 bg-slate-50 py-2 pl-9 pr-3 text-[11px] text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:focus:bg-slate-600"
            />
          </div>
          <label className="sr-only" htmlFor="pipeline-stage-filter">Filtrar por etapa</label>
          <select
            id="pipeline-stage-filter"
            value={filtroEtapa}
            onChange={(event) => setFiltroEtapa(event.target.value)}
            className="max-w-[210px] flex-1 rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 sm:flex-none"
          >
            <option value="todas">Todas las etapas ({leadsBaseFiltrados.length})</option>
            {etapasPipeline.map((etapa) => (
              <option key={etapa.id} value={etapa.id}>
                {etapa.nombre} ({cantidadPorEtapa[etapa.id] || 0})
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="pipeline-owner-filter">Filtrar por ejecutivo</label>
          <select
            id="pipeline-owner-filter"
            value={filtroEjecutivo}
            onChange={(event) => setFiltroEjecutivo(event.target.value)}
            className="max-w-[190px] flex-1 rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 sm:flex-none"
          >
            <option value="todos">Todos los ejecutivos</option>
            {ejecutivos.map((ejecutivo) => (
              <option key={ejecutivo} value={ejecutivo}>{ejecutivo}</option>
            ))}
          </select>
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-700">
            <button
              onClick={() => setVistaModo("kanban")}
              className={`rounded-md p-1.5 transition-colors ${vistaModo === "kanban" ? "bg-white text-blue-600 shadow-sm dark:bg-slate-600 dark:text-blue-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
              title="Vista Kanban"
              aria-label="Vista Kanban"
            >
              <LayoutList size={14} />
            </button>
            <button
              onClick={() => setVistaModo("ejecutivos")}
              className={`rounded-md p-1.5 transition-colors ${vistaModo === "ejecutivos" ? "bg-white text-blue-600 shadow-sm dark:bg-slate-600 dark:text-blue-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
              title="Vista por Ejecutivo"
              aria-label="Vista por Ejecutivo"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
          <span className="ml-auto text-[10px] font-medium text-slate-400">
            {leadsFiltrados.length} {leadsFiltrados.length === 1 ? "resultado" : "resultados"}
          </span>
        </div>
      </div>

      {cargando ? (
        // El componente ya existia en src/componentes/pipeline y nadie lo usaba.
        <PipelineSkeleton />
      ) : (
      <>
      {/* Board - ocupa todo el espacio restante */}
      <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
        <div className="flex-1 flex overflow-hidden p-2 sm:p-4 pt-3">
          {vistaModo === "kanban" ? (
            <div className="flex flex-1 gap-2 overflow-x-auto scroll-smooth sm:gap-3">
          {etapasVisibles.map((etapaPipeline) => {
            const etapa = etapaPipeline.id;
            // Nombre y color salen de la API. Una etapa personalizada no tiene
            // entrada en ETAPAS_CONFIG y leer `config.color` reventaba la vista.
            const config = {
              label: etapaPipeline.nombre,
              color: etapaPipeline.color || COLOR_ETAPA_POR_DEFECTO,
            };
            const leadsEnEtapa = leadsFiltrados.filter((l) => l.etapa === etapa);
            const montoEtapa = leadsEnEtapa.reduce((acc, l) => acc + (l.montoSolicitado || 0), 0);
            const valorEtapa = leadsEnEtapa.reduce((acc, l) => acc + (l.valorPropiedad || 0), 0);

            return (
              <div
                key={etapa}
                data-testid={`pipeline-column-${etapa}`}
                className={`${filtroEtapa === "todas" ? "w-[238px] min-w-[238px] sm:w-[252px] sm:min-w-[252px]" : "w-full min-w-[280px] max-w-xl"} flex flex-shrink-0 flex-col`}
              >
                {/* Column Header con color completo */}
                <div
                  className="rounded-xl p-2.5 sm:p-3 mb-2 flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: `${config.color}12`, borderBottom: `3px solid ${config.color}` }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{config.label}</span>
                    </div>
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm"
                      style={{ backgroundColor: config.color, color: "white" }}
                    >
                      {leadsEnEtapa.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className="rounded-lg px-2.5 py-1.5"
                      style={{ backgroundColor: `${config.color}08` }}
                    >
                       <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: `${config.color}99` }}>Monto</div>
                       <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{formatoMonedaAbreviado(montoEtapa)}</div>
                     </div>
                     <div
                       className="rounded-lg px-2.5 py-1.5"
                       style={{ backgroundColor: `${config.color}08` }}
                     >
                       <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: `${config.color}99` }}>Propiedad</div>
                       <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{formatoMonedaAbreviado(valorEtapa)}</div>
                    </div>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={etapa}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                     className={`flex-1 rounded-xl p-2.5 overflow-y-auto transition-all duration-200 ${
                       snapshot.isDraggingOver
                         ? "bg-blue-50/80 dark:bg-blue-900/20 border-2 border-dashed border-blue-400 shadow-inner"
                         : "bg-white/60 dark:bg-slate-800/60 border-2 border-transparent"
                     }`}
                    >
                      {leadsEnEtapa.length > 0 && (
                        leadsEnEtapa.map((lead, index) => (
                          <PipelineLeadCard
                            key={lead.id}
                            lead={lead}
                            index={index}
                            onOpen={() => setLeadDetalle(lead)}
                          />
                        ))
                      )}
                      {provided.placeholder}
                      {leadsEnEtapa.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center py-8 px-3 text-center">
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {busqueda || filtroEjecutivo !== "todos" || filtroEtapa !== "todas"
                              ? "No encontramos oportunidades con estos criterios."
                              : "No hay oportunidades en esta etapa"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
              </div>
          ) : (
            /* Vista por Ejecutivo - Swimlanes */
            <div className="flex-1 flex gap-3 overflow-x-auto scroll-smooth">
              {usuarios.filter(u => u.estado === "ACTIVO" && u.rol !== "SUPER_ADMIN").map((user, idx, arr) => {
                const nombreCompleto = `${user.nombre} ${user.apellido}`;
                const userRol = ROLES_CONFIG[user.rol];
                const leadsDelEjecutivo = leadsFiltrados.filter((l) => l.nombreEjecutivo === nombreCompleto);
                const leadsSinAsignar = leadsFiltrados.filter((l) => !l.nombreEjecutivo);
                const esUltimo = idx === arr.length - 1;

                return (
                  <div key={user.id} className="min-w-[280px] w-[280px] flex-shrink-0 flex flex-col">
                    {/* Ejecutivo Header */}
                    <div className="rounded-xl p-3 mb-2 flex-shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                          style={{
                            background:
                              user.rol === "ADMIN"
                                ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                                : "linear-gradient(135deg, #64748b, #475569)",
                          }}
                        >
                          {user.nombre[0]}{user.apellido[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">{nombreCompleto}</div>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${userRol.color}`}>{userRol.label}</span>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
                          leadsDelEjecutivo.length === 0 ? "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500" :
                          leadsDelEjecutivo.length <= 3 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          leadsDelEjecutivo.length <= 6 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {leadsDelEjecutivo.length} leads
                        </span>
                      </div>
                    </div>

                    {/* Leads del ejecutivo */}
                    <Droppable droppableId={`ejec-view-${user.id}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 rounded-xl p-2.5 overflow-y-auto transition-all duration-200 min-h-[300px] ${
                            snapshot.isDraggingOver
                              ? "bg-blue-50/80 dark:bg-blue-900/20 border-2 border-dashed border-blue-400 shadow-inner"
                              : "bg-white/60 dark:bg-slate-800/60 border-2 border-transparent"
                          }`}
                        >
                          {leadsDelEjecutivo.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4 min-h-[200px]">
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-3">
                                <UserPlus size={16} className="text-slate-300 dark:text-slate-500" />
                              </div>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Sin leads asignados</p>
                              <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Arrastra leads aquí</p>
                            </div>
                          ) : (
                            leadsDelEjecutivo.map((lead, index) => (
                              <PipelineLeadCard
                                key={lead.id}
                                lead={lead}
                                index={index}
                                onOpen={() => setLeadDetalle(lead)}
                              />
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    {/* Leads sin asignar - solo en la última columna */}
                    {esUltimo && leadsSinAsignar.length > 0 && (
                      <div className="mt-3">
                        <Droppable droppableId="ejec-view-sin-asignar">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`rounded-xl p-2.5 transition-all duration-200 ${
                                snapshot.isDraggingOver
                                  ? "bg-amber-50/80 dark:bg-amber-900/20 border-2 border-dashed border-amber-400"
                                  : "bg-slate-50/60 dark:bg-slate-800/40 border-2 border-dashed border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2 px-1">
                                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Sin asignar ({leadsSinAsignar.length})</span>
                              </div>
                              {leadsSinAsignar.map((lead, index) => (
                                <PipelineLeadCard
                                  key={lead.id}
                                  lead={lead}
                                  index={index}
                                  onOpen={() => setLeadDetalle(lead)}
                                />
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DragDropContext>

      </>
      )}

      <PipelineLeadDetail
        lead={leadDetalle}
        etapaNombre={
          etapasPipeline.find((etapa) => etapa.id === leadDetalle?.etapa)?.nombre ||
          leadDetalle?.etapa ||
          ""
        }
        carga={cargaPorEjecutivo}
        onOpenChange={(open) => {
          if (!open) setLeadDetalle(null);
        }}
        onAssign={handleAsignarEjecutivo}
        onDelete={handleEliminarLead}
        onEdit={handleEditarLead}
        onOpenFull={(lead) => router.push(`/clientes/${lead.id}`)}
      />

      {/* Diálogo Eliminar */}
      <ConfirmDialog
        open={eliminarDialogOpen}
        onOpenChange={setEliminarDialogOpen}
        title="Eliminar Lead"
        description={`¿Eliminar a ${leadAEliminar?.nombre} ${leadAEliminar?.apellido}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleConfirmarEliminar}
      />

      {/* Modal de Validación */}
      <Dialog open={validacionModal.open} onOpenChange={(open) => {
        if (!open) setValidacionModal({ open: false, resultado: null, lead: null, etapaDestino: "" });
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              {validacionModal.etapaDestino === "DOCS_COMPLETAS" ? "Documentos incompletos" : "No se puede avanzar"}
            </DialogTitle>
            <DialogDescription>
              {validacionModal.etapaDestino === "DOCS_COMPLETAS"
                ? `${validacionModal.lead?.nombre} ${validacionModal.lead?.apellido} tiene documentos pendientes de carga. Deben estar cargados para avanzar a Docs. Completas.`
                : `${validacionModal.lead?.nombre} ${validacionModal.lead?.apellido} no cumple las reglas requeridas`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {validacionModal.resultado?.reglasFallidas && validacionModal.resultado.reglasFallidas.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Reglas no cumplidas
                </h4>
                <div className="space-y-2">
                  {validacionModal.resultado.reglasFallidas.map((regla) => (
                    <div key={regla.id} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                      <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] font-semibold text-slate-700">{regla.nombre}</div>
                        <div className="text-[10px] text-slate-500">{regla.descripcion}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validacionModal.resultado?.advertencias && validacionModal.resultado.advertencias.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Advertencias
                </h4>
                <div className="space-y-2">
                  {validacionModal.resultado.advertencias.map((regla) => (
                    <div key={regla.id} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                      <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] font-semibold text-slate-700">{regla.nombre}</div>
                        <div className="text-[10px] text-slate-500">{regla.descripcion}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validacionModal.resultado?.reglasPasadas && validacionModal.resultado.reglasPasadas.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Reglas cumplidas
                </h4>
                <div className="space-y-2">
                  {validacionModal.resultado.reglasPasadas.map((regla) => (
                    <div key={regla.id} className="flex items-start gap-2 p-2 bg-emerald-50 rounded-lg">
                      <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] font-semibold text-slate-700">{regla.nombre}</div>
                        <div className="text-[10px] text-slate-500">{regla.descripcion}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setValidacionModal({ open: false, resultado: null, lead: null, etapaDestino: "" })}
            >
              Cerrar
            </Button>
            <Button
              variant="destructive"
              onClick={forzarAvance}
              className="gap-1.5"
            >
              <AlertCircle size={14} /> Forzar Avance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Formulario de Lead */}
      <FormularioLead
        open={formularioOpen}
        onOpenChange={setFormularioOpen}
        lead={leadSeleccionado}
        onSubmit={handleSubmitLead}
      />
    </div>
  );
}
