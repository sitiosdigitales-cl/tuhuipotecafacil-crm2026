"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DragStart } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import {
  Search,
  Phone,
  Mail,
  MoreHorizontal,
  DollarSign,
  Plus,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Building2,
  Home,
  Eye,
  Pencil,
  Trash2,
  Users,
  Banknote,
  ArrowLeft,
  Layout,
  LayoutList,
  LayoutGrid,
  UserPlus,
} from "lucide-react";
import { ETAPAS_CONFIG, ORIGEN_LABELS, ROLES_CONFIG } from "@/tipos";
import { formatoMonedaAbreviado, formatoUF } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FormularioLead } from "@/componentes/leads/FormularioLead";
import { useUser } from "@/modulos/usuarios";
import { useLeads } from "@/modulos/leads";
import { useActivities } from "@/lib/contexts/ActivityContext";
import { validarAvance, type ResultadoValidacion, type ReglaValidacion } from "@/modulos/leads/validaciones-pipeline";
import { AsignarEjecutivo } from "@/componentes/pipeline/AsignarEjecutivo";
import { toast } from "sonner";
import type { Lead, Etapa, Prioridad, SituacionLaboral } from "@/tipos";

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

    // Documentos que están APROBADOS o RECIBIDO o EN_REVISION (cargados)
    const docsCargados = docs.filter((d: { estado: string }) =>
      d.estado === "APROBADO" || d.estado === "RECIBIDO" || d.estado === "EN_REVISION"
    );

    const tiposCargados = new Set(docsCargados.map((d: { tipo: string }) => d.tipo));

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

// Etapas por defecto (se cargan desde la API)
const ETAPAS_POR_DEFECTO: Etapa[] = [
  "NUEVO_LEAD",
  "CONTACTO_INICIAL",
  "CONTACTADO",
  "INTERESADO",
  "CALIFICACION_COMERCIAL",
  "DOCS_PENDIENTES",
  "DOCS_COMPLETAS",
  "EVALUACION_BANCARIA",
  "PREAPROBADO",
  "APROBADO",
  "FIRMA_DIGITAL",
  "NOTARIA",
  "CREDITO_PAGADO",
];

const prioridadConfig: Record<Prioridad, { label: string; color: string; bg: string }> = {
  BAJA: { label: "Baja", color: "text-slate-600", bg: "bg-slate-100" },
  MEDIA: { label: "Media", color: "text-blue-600", bg: "bg-blue-50 border border-blue-100" },
  ALTA: { label: "Alta", color: "text-orange-600", bg: "bg-orange-50 border border-orange-100" },
  URGENTE: { label: "Urgente", color: "text-red-600", bg: "bg-red-50 border border-red-100" },
};

const getTiempoEstilo = (dias: number) => {
  if (dias <= 3) return { text: "text-emerald-700", bg: "bg-emerald-50 border border-emerald-100", label: "Nuevo" };
  if (dias <= 7) return { text: "text-amber-700", bg: "bg-amber-50 border border-amber-100", label: "Normal" };
  if (dias <= 14) return { text: "text-orange-700", bg: "bg-orange-50 border border-orange-100", label: "Tardío" };
  return { text: "text-red-700", bg: "bg-red-50 border border-red-100", label: "Crítico" };
};

function TarjetaLead({ lead, index, onVer, onEditar, onEliminar, onAsignar, carga }: {
  lead: Lead;
  index: number;
  onVer: () => void;
  onEditar: (e: React.MouseEvent) => void;
  onEliminar: (e: React.MouseEvent) => void;
  onAsignar: (leadId: string, nombreEjecutivo: string) => void;
  carga: Record<string, number>;
}) {
  const tiempo = getTiempoEstilo(lead.diasEnEtapa);
  const prioridad = prioridadConfig[lead.prioridad];

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
         <div
           ref={provided.innerRef}
           {...provided.draggableProps}
           className={`bg-white dark:bg-slate-800 rounded-xl border mb-2.5 transition-all duration-200 ${
             snapshot.isDragging
               ? "shadow-2xl ring-2 ring-blue-500/30 scale-[1.02] rotate-[1deg] z-50 opacity-90"
               : "border-slate-100 dark:border-slate-700 hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-600"
           }`}
         >
          {/* Drag Handle + Header */}
         <div {...provided.dragHandleProps} className={`px-3 py-2 border-b border-slate-100 dark:border-slate-700 cursor-grab active:cursor-grabbing ${
             lead.prioridad === 'URGENTE' ? 'bg-red-50/50 dark:bg-red-900/20' :
             lead.prioridad === 'ALTA' ? 'bg-orange-50/30 dark:bg-orange-900/20' : ''
           }`}>
            <div className="flex items-center justify-between">
               <div
                 className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 -mx-1 px-1 py-0.5 rounded-lg transition-colors"
                 onClick={(e) => { e.stopPropagation(); onVer(); }}
               >
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                    {lead.nombre[0]}{lead.apellido[0]}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    lead.prioridad === 'URGENTE' ? 'bg-red-500' :
                    lead.prioridad === 'ALTA' ? 'bg-orange-500' :
                    lead.prioridad === 'MEDIA' ? 'bg-blue-500' : 'bg-slate-400'
                  }`} />
                </div>
                <div className="min-w-0">
                   <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">{lead.nombre} {lead.apellido}</div>
                   <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{lead.rut}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prioridad.bg} ${prioridad.color}`}>
                  {prioridad.label}
                </span>
                 <button
                   onClick={(e) => { e.stopPropagation(); }}
                   className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                 >
                   <MoreHorizontal size={12} className="text-slate-400 dark:text-slate-500" />
                 </button>
              </div>
            </div>
          </div>

          {/* Información financiera destacada */}
          <div className="px-3 py-2.5">
             <div className="bg-gradient-to-br from-slate-50 dark:from-slate-700 to-slate-100/50 dark:to-slate-700/50 rounded-lg p-2.5 mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                   <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Monto Crédito</div>
                   <div className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-tight">{formatoMonedaAbreviado(lead.montoSolicitado || 0)}</div>
                   <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{formatoUF(lead.montoSolicitado || 0)}</div>
                </div>
                <div className="text-right">
                   <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Propiedad</div>
                   <div className="text-[12px] font-bold text-slate-700 dark:text-slate-300">{formatoMonedaAbreviado(lead.valorPropiedad || 0)}</div>
                   <div className="text-[11px] text-slate-500 dark:text-slate-400">{formatoUF(lead.valorPropiedad || 0)}</div>
                </div>
              </div>
              {lead.pieDisponible && lead.valorPropiedad && (
                 <div className="pt-1.5 mt-1.5 border-t border-slate-200/50 dark:border-slate-600/50">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] text-slate-400 dark:text-slate-500">Pie</span>
                     <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{formatoMonedaAbreviado(lead.pieDisponible)}</span>
                   </div>
                   <div className="mt-1 h-1 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                      style={{ width: `${Math.min((lead.pieDisponible / lead.valorPropiedad) * 100, 100)}%` }}
                    />
                  </div>
                   <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 text-right">
                    {((lead.pieDisponible / lead.valorPropiedad) * 100).toFixed(0)}% del valor
                  </div>
                </div>
              )}
            </div>

            {/* Banco y tipo de crédito */}
             <div className="flex items-center gap-2 mb-2">
               <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg">
                 <Building2 size={10} className="text-slate-400 dark:text-slate-500" />
                 <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">{lead.banco || "Sin banco"}</span>
               </div>
               <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg">
                 <Home size={10} className="text-slate-400 dark:text-slate-500" />
                 <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">{lead.tipoCredito || "Sin tipo"}</span>
               </div>
             </div>

            {/* Origen y tiempo */}
             <div className="flex items-center gap-1.5 mb-2.5">
               <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold border border-blue-100 dark:border-blue-800">
                {ORIGEN_LABELS[lead.origen] || lead.origen}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tiempo.bg} ${tiempo.text}`}>
                {lead.diasEnEtapa}d • {tiempo.label}
              </span>
            </div>

            {/* Contacto */}
             <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
               <div className="flex items-center gap-1">
                 <Phone size={9} className="text-slate-400 dark:text-slate-500" />
                 <span>{lead.telefono || "-"}</span>
               </div>
               <div className="flex items-center gap-1 truncate">
                 <Mail size={9} className="text-slate-400 dark:text-slate-500" />
                 <span className="truncate">{lead.email || "-"}</span>
               </div>
             </div>

            {/* Footer */}
             <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-700">
               <Droppable droppableId={`lead-drop-${lead.id}`}>
                 {(provided, snapshot) => (
                   <div
                     ref={provided.innerRef}
                     {...provided.droppableProps}
                     className={`flex items-center justify-between rounded-lg p-1.5 transition-all ${
                       snapshot.isDraggingOver
                         ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-dashed border-blue-400"
                         : ""
                     }`}
                   >
                     <div className="flex items-center gap-1.5 min-w-0 flex-1">
                       <div className="relative flex-shrink-0">
                         <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[7px] font-bold text-white ${
                           lead.nombreEjecutivo
                             ? "bg-gradient-to-br from-blue-500 to-blue-600"
                             : "bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700"
                         }`}>
                           {lead.nombreEjecutivo?.split(" ").map((n) => n[0]).join("") || "?"}
                         </div>
                         {lead.nombreEjecutivo && (
                           <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-white dark:border-slate-800" />
                         )}
                       </div>
                       <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate">
                         {lead.nombreEjecutivo?.split(" ")[0] || (snapshot.isDraggingOver ? "Soltar aqui" : "Sin asignar")}
                       </span>
                     </div>
                     <div className="flex items-center gap-0.5">
                       <AsignarEjecutivo
                         ejecutivoActual={lead.nombreEjecutivo}
                         onAsignar={(nombre) => onAsignar(lead.id, nombre)}
                         compact
                         carga={carga}
                       />
                       <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={onVer} className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Ver detalle">
                           <Eye size={11} className="text-blue-500 dark:text-blue-400" />
                         </button>
                         <button onClick={onEditar} className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors" title="Editar">
                           <Pencil size={11} className="text-amber-500 dark:text-amber-400" />
                         </button>
                         <button onClick={onEliminar} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Eliminar">
                           <Trash2 size={11} className="text-red-500 dark:text-red-400" />
                         </button>
                       </div>
                     </div>
                     {provided.placeholder}
                   </div>
                 )}
               </Droppable>
             </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function PipelinePage() {
  const router = useRouter();
  const { usuarioActual, esSuperAdmin, usuarios } = useUser();
  const { leads, agregarLead, actualizarLead, eliminarLead, asignarEjecutivo, moverEtapa, cargaPorEjecutivo } = useLeads();
  const { agregarActividad } = useActivities();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEjecutivo, setFiltroEjecutivo] = useState("todos");
  const [eliminarDialogOpen, setEliminarDialogOpen] = useState(false);
  const [leadAEliminar, setLeadAEliminar] = useState<Lead | null>(null);
  const [formularioOpen, setFormularioOpen] = useState(false);
  const [leadSeleccionado, setLeadSeleccionado] = useState<Lead | null>(null);
  const [validacionModal, setValidacionModal] = useState<{ open: boolean; resultado: ResultadoValidacion | null; lead: Lead | null; etapaDestino: string }>({
    open: false,
    resultado: null,
    lead: null,
    etapaDestino: "",
  });
  const leadsAnteriores = useRef(leads.length);
  const [etapasPipeline, setEtapasPipeline] = useState<Etapa[]>(ETAPAS_POR_DEFECTO);
  const [vistaModo, setVistaModo] = useState<"kanban" | "ejecutivos">("kanban");

  // Cargar etapas desde la API
  useEffect(() => {
    async function cargarEtapas() {
      try {
        const res = await fetch("/api/pipeline/stages");
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          // Filtrar solo las etapas activas y ordenarlas
          const etapasActivas = data.data
            .filter((e: { activa: boolean }) => e.activa)
            .sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden)
            .map((e: { id: string }) => e.id as Etapa);
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

  const leadsFiltrados = useMemo(() => {
    return leadsUsuario.filter((lead) => {
      const coincideBusqueda = !busqueda ||
        lead.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        lead.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
        lead.rut.includes(busqueda) ||
        lead.email?.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEjecutivo = filtroEjecutivo === "todos" || lead.nombreEjecutivo === filtroEjecutivo;
      return coincideBusqueda && coincideEjecutivo;
    });
  }, [leadsUsuario, busqueda, filtroEjecutivo]);

  const stats = useMemo(() => ({
    total: leadsFiltrados.length,
    montoTotal: leadsFiltrados.reduce((acc, l) => acc + (l.montoSolicitado || 0), 0),
    valorPropiedad: leadsFiltrados.reduce((acc, l) => acc + (l.valorPropiedad || 0), 0),
    aprobados: leadsFiltrados.filter(l => ['APROBADO', 'FIRMA_DIGITAL', 'NOTARIA'].includes(l.etapa)).length,
  }), [leadsFiltrados]);

  // Capturar el lead al iniciar el arrastre
  const onDragStart = useCallback((_start: DragStart) => {
  }, []);

  const onDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const destinoId = destination.droppableId;
    const origenId = source.droppableId;

    // Detectar si es un ejecutivo siendo arrastrado hacia un lead
    if (origenId.startsWith("ejec-drag-")) {
      const nombreEjecutivo = origenId.replace("ejec-drag-", "");
      // Verificar si el destino es un lead
      if (destinoId.startsWith("lead-drop-")) {
        const leadId = destinoId.replace("lead-drop-", "");
        handleAsignarEjecutivo(leadId, nombreEjecutivo);
        return;
      }
    }

    // Detectar si es asignación de ejecutivo (sidebar o vista ejecutivo) - flujo antiguo
    const esAsignacionEjecutivo = destinoId.startsWith("ejec-") || destinoId.startsWith("ejec-view-");
    if (esAsignacionEjecutivo) {
      // Buscar el lead en la columna de origen
      let leadMovido: Lead | undefined;
      if (source.droppableId.startsWith("ejec-view-")) {
        // Viene de la vista por ejecutivo
        const nombreOrigen = source.droppableId.replace("ejec-view-", "");
        const leadsDelOrigen = leadsFiltrados.filter((l) => l.nombreEjecutivo === nombreOrigen);
        leadMovido = leadsDelOrigen[source.index];
      } else if (source.droppableId === "ejec-view-Sin asignar") {
        leadMovido = leadsFiltrados.filter((l) => !l.nombreEjecutivo)[source.index];
      } else {
        // Viene de una etapa del kanban
        leadMovido = leadsFiltrados.filter((l) => l.etapa === source.droppableId)[source.index];
      }
      if (!leadMovido) return;

      // Extraer nombre del ejecutivo destino
      let nombreEjecutivo = "";
      if (destinoId === "ejec-view-Sin asignar") {
        nombreEjecutivo = "";
      } else {
        nombreEjecutivo = destinoId.replace("ejec-", "").replace("ejec-view-", "");
      }

      handleAsignarEjecutivo(leadMovido.id, nombreEjecutivo);
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

    // Si pasa la validación, mover el lead usando el contexto
    moverEtapa(leadMovido.id, etapaDestino as Etapa);

    // Registrar actividad
    const nombreEtapaOrigen = ETAPAS_CONFIG[leadMovido.etapa]?.label || leadMovido.etapa;
    const nombreEtapaDestino = ETAPAS_CONFIG[etapaDestino as Etapa]?.label || etapaDestino;
    agregarActividad({
      leadId: leadMovido.id,
      tipo: "cambio_estado",
      titulo: "Cambio de etapa",
      descripcion: `${leadMovido.nombre} ${leadMovido.apellido} movido de ${nombreEtapaOrigen} a ${nombreEtapaDestino}`,
      usuario: usuarioActual?.nombre ? `${usuarioActual.nombre} ${usuarioActual.apellido}` : "Sistema",
      usuarioId: usuarioActual?.id || "system",
    });

    toast.success(`Lead movido a ${nombreEtapaDestino}`, {
      description: `${leadMovido.nombre} ${leadMovido.apellido} avanzó de etapa`,
    });
  }, [leadsFiltrados, moverEtapa, agregarActividad, usuarioActual]);

  const forzarAvance = () => {
    if (!validacionModal.lead || !validacionModal.etapaDestino) return;

    moverEtapa(validacionModal.lead.id, validacionModal.etapaDestino as Etapa);

    // Registrar actividad de avance forzado
    const nombreEtapaOrigen = ETAPAS_CONFIG[validacionModal.lead.etapa]?.label || validacionModal.lead.etapa;
    const nombreEtapaDestino = ETAPAS_CONFIG[validacionModal.etapaDestino as Etapa]?.label || validacionModal.etapaDestino;
    agregarActividad({
      leadId: validacionModal.lead.id,
      tipo: "cambio_estado",
      titulo: "Avance forzado",
      descripcion: `${validacionModal.lead.nombre} ${validacionModal.lead.apellido} movido de ${nombreEtapaOrigen} a ${nombreEtapaDestino} (avance forzado)`,
      usuario: usuarioActual?.nombre ? `${usuarioActual.nombre} ${usuarioActual.apellido}` : "Sistema",
      usuarioId: usuarioActual?.id || "system",
    });

    toast.success(`Avance forzado a ${nombreEtapaDestino}`, {
      description: `${validacionModal.lead.nombre} ${validacionModal.lead.apellido} movido manualmente`,
    });

    setValidacionModal({ open: false, resultado: null, lead: null, etapaDestino: "" });
  };

  const handleEliminarLead = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setLeadAEliminar(lead);
    setEliminarDialogOpen(true);
  };

  const handleConfirmarEliminar = () => {
    if (leadAEliminar) {
      const nombre = `${leadAEliminar.nombre} ${leadAEliminar.apellido}`;
      eliminarLead(leadAEliminar.id);
      setLeadAEliminar(null);
      toast.success("Lead eliminado", {
        description: `${nombre} fue eliminado del pipeline`,
      });
    }
  };

  const handleNuevoLead = () => {
    setLeadSeleccionado(null);
    setFormularioOpen(true);
  };

  const handleEditarLead = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setLeadSeleccionado(lead);
    setFormularioOpen(true);
  };

  const handleAsignarEjecutivo = async (leadId: string, nombreEjecutivo: string) => {
    const lead = leads.find(l => l.id === leadId);
    try {
      const updateResponse = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreEjecutivo: nombreEjecutivo || null }),
      });

      if (updateResponse.ok) {
        // Actualizar estado local
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, nombreEjecutivo: nombreEjecutivo || undefined } : l
          )
        );
        if (lead) {
          toast.success("Ejecutivo asignado", {
            description: nombreEjecutivo
              ? `${lead.nombre} ${lead.apellido} asignado a ${nombreEjecutivo}`
              : `${lead.nombre} ${lead.apellido} sin asignar`,
          });
        }
      } else {
        const err = await updateResponse.json().catch(() => ({}));
        toast.error("Error al asignar", { description: err.error || "Intenta de nuevo" });
      }
    } catch {
      toast.error("Error de conexion");
    }
  };

  const handleSubmitLead = (data: Partial<Lead>) => {
    if (leadSeleccionado) {
      actualizarLead(leadSeleccionado.id, data);
      toast.success("Lead actualizado", {
        description: `${data.nombre} ${data.apellido} fue actualizado`,
      });
    } else {
      const newLead: Lead = {
        id: `lead-${Date.now()}`,
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
        creadoEn: new Date(),
        diasEnEtapa: 0,
        nombreEjecutivo: `${usuarioActual.nombre} ${usuarioActual.apellido}`,
      };
      agregarLead(newLead);
      toast.success("Lead creado", {
        description: `${newLead.nombre} ${newLead.apellido} fue agregado al pipeline`,
      });
    }
    setFormularioOpen(false);
    setLeadSeleccionado(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-100 dark:from-slate-900 via-slate-50 dark:via-slate-800 to-blue-50 dark:to-blue-950 overflow-hidden">
      {/* Header fijo */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-3 sm:px-4 py-2.5 sm:py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
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
                  {esSuperAdmin ? "Pipeline" : `Pipeline`}
                </h1>
                <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium hidden sm:block">
                  {esSuperAdmin ? "Gestión de oportunidades de crédito hipotecario" : "Tus oportunidades de crédito"}
                </p>
              </div>
            </div>
          </div>

          {/* Stats compactos - ocultos en móvil pequeño */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg">
               <Users size={12} className="text-slate-400 dark:text-slate-400" />
               <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{stats.total}</span>
               <span className="text-[11px] text-slate-400 dark:text-slate-500">leads</span>
             </div>
             <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
               <DollarSign size={12} className="text-blue-500 dark:text-blue-400" />
               <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">{formatoMonedaAbreviado(stats.montoTotal)}</span>
             </div>
             <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
               <Banknote size={12} className="text-purple-500 dark:text-purple-400" />
               <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">{formatoMonedaAbreviado(stats.valorPropiedad)}</span>
             </div>
             <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
               <TrendingUp size={12} className="text-emerald-500 dark:text-emerald-400" />
               <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">{stats.aprobados}</span>
             </div>
          </div>

          {/* Mobile stats - simplified */}
          <div className="flex sm:hidden items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{stats.total} leads</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">{stats.aprobados} OK</span>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative hidden sm:block">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
               <input
                 type="text"
                 placeholder="Buscar lead..."
                 value={busqueda}
                 onChange={(e) => setBusqueda(e.target.value)}
                 className="w-52 pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white dark:focus:bg-slate-600 transition-all"
               />
            </div>
             <select
               value={filtroEjecutivo}
               onChange={(e) => setFiltroEjecutivo(e.target.value)}
               className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400"
             >
              <option value="todos">Todos</option>
              {ejecutivos.map((ej) => (
                <option key={ej} value={ej}>{ej}</option>
              ))}
            </select>
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
              <button
                onClick={() => setVistaModo("kanban")}
                className={`p-1.5 rounded-md transition-colors ${vistaModo === "kanban" ? "bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                title="Vista Kanban"
              >
                <LayoutList size={14} />
              </button>
              <button
                onClick={() => setVistaModo("ejecutivos")}
                className={`p-1.5 rounded-md transition-colors ${vistaModo === "ejecutivos" ? "bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                title="Vista por Ejecutivo"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
            <Button onClick={handleNuevoLead} className="gap-1.5 shadow-lg shadow-blue-600/15 text-[11px] sm:text-sm">
              <Plus size={14} /> <span className="hidden sm:inline">Nuevo Lead</span><span className="sm:hidden">Nuevo</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Board - ocupa todo el espacio restante */}
      <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
        <div className="flex-1 flex overflow-hidden p-2 sm:p-4 pt-3">
          {vistaModo === "kanban" ? (
            <>
              {/* Kanban columns */}
              <div className="flex-1 flex gap-2 sm:gap-3 overflow-x-auto scroll-smooth">
          {etapasPipeline.map((etapa) => {
            const config = ETAPAS_CONFIG[etapa];
            const leadsEnEtapa = leadsFiltrados.filter((l) => l.etapa === etapa);
            const montoEtapa = leadsEnEtapa.reduce((acc, l) => acc + (l.montoSolicitado || 0), 0);
            const valorEtapa = leadsEnEtapa.reduce((acc, l) => acc + (l.valorPropiedad || 0), 0);

            return (
              <div key={etapa} className="min-w-[260px] sm:min-w-[280px] w-[260px] sm:w-[280px] flex-shrink-0 flex flex-col">
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
                      {leadsEnEtapa.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center text-center p-4 min-h-[200px]">
                           <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-3">
                             <AlertCircle size={20} className="text-slate-300 dark:text-slate-500" />
                           </div>
                           <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Sin leads</p>
                           <p className="text-[11px] text-slate-300 dark:text-slate-600 mt-1">Arrastra leads aquí</p>
                         </div>
                      ) : (
                        leadsEnEtapa.map((lead, index) => (
                          <TarjetaLead
                            key={lead.id}
                            lead={lead}
                            index={index}
                            onVer={() => router.push(`/clientes/${lead.id}`)}
                            onEditar={(e) => handleEditarLead(lead, e)}
                            onEliminar={(e) => handleEliminarLead(lead, e)}
                            onAsignar={handleAsignarEjecutivo}
                            carga={cargaPorEjecutivo}
                          />
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
              </div>

              {/* Sidebar de ejecutivos */}
              <div className="hidden lg:flex flex-col w-[200px] flex-shrink-0 ml-3 border-l border-slate-200 dark:border-slate-700 pl-3">
                <div className="mb-3">
                  <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Ejecutivos</h3>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500">Arrastra un ejecutivo a un lead para asignar</p>
                </div>
                <Droppable droppableId="ejec-sidebar" direction="vertical">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 overflow-y-auto space-y-2"
                    >
                      {usuarios.filter(u => u.estado === "ACTIVO" && u.rol !== "SUPER_ADMIN").map((user, index) => {
                        const nombreCompleto = `${user.nombre} ${user.apellido}`;
                        const userRol = ROLES_CONFIG[user.rol];
                        const leadsCount = cargaPorEjecutivo[nombreCompleto] || 0;

                        return (
                          <Draggable key={user.id} draggableId={`ejec-drag-${nombreCompleto}`} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                                  snapshot.isDragging
                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-lg scale-[1.03] rotate-[2deg] z-50"
                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shadow-sm flex-shrink-0"
                                    style={{
                                      background:
                                        user.rol === "ADMIN"
                                          ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                                          : user.rol === "GERENTE"
                                          ? "linear-gradient(135deg, #d97706, #b45309)"
                                          : "linear-gradient(135deg, #64748b, #475569)",
                                    }}
                                  >
                                    {user.nombre[0]}{user.apellido[0]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-semibold text-slate-800 dark:text-slate-100 truncate">{nombreCompleto}</div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className={`text-[8px] font-semibold px-1 py-0.5 rounded ${userRol.color}`}>{userRol.label}</span>
                                    </div>
                                  </div>
                                  <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    leadsCount === 0 ? "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500" :
                                    leadsCount <= 3 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                    leadsCount <= 6 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                    "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                  }`}>
                                    {leadsCount}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </>
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
                                : user.rol === "GERENTE"
                                ? "linear-gradient(135deg, #d97706, #b45309)"
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
                    <Droppable droppableId={`ejec-view-${nombreCompleto}`}>
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
                              <TarjetaLead
                                key={lead.id}
                                lead={lead}
                                index={index}
                                onVer={() => router.push(`/clientes/${lead.id}`)}
                                onEditar={(e) => handleEditarLead(lead, e)}
                                onEliminar={(e) => handleEliminarLead(lead, e)}
                                onAsignar={handleAsignarEjecutivo}
                                carga={cargaPorEjecutivo}
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
                        <Droppable droppableId="ejec-view-Sin asignar">
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
                                <TarjetaLead
                                  key={lead.id}
                                  lead={lead}
                                  index={index}
                                  onVer={() => router.push(`/clientes/${lead.id}`)}
                                  onEditar={(e) => handleEditarLead(lead, e)}
                                  onEliminar={(e) => handleEliminarLead(lead, e)}
                                  onAsignar={handleAsignarEjecutivo}
                                  carga={cargaPorEjecutivo}
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
