"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Zap } from "lucide-react";
import { StatsBar, KPIGrid } from "@/componentes/flujos/StatsBar";
import { FlujoCard } from "@/componentes/flujos/FlujoCard";
import { FlujoEditorPanel } from "@/componentes/flujos/FlujoEditorPanel";
import { FlujoDetalleModal } from "@/componentes/flujos/FlujoDetalleModal";
import { useFlujos } from "@/modulos/automatizacion/hooks";
import { TRIGGERS_TIPOS, TRIGGER_CATEGORIAS } from "@/modulos/automatizacion/config";
import { toast } from "sonner";

type TabFlujo = "todos" | "activos" | "pausados" | "borrador";

export default function FlujosPage() {
  const { flujos, setFlujos, cargando } = useFlujos();
  const [tabActiva, setTabActiva] = useState<TabFlujo>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [editorAbierto, setEditorAbierto] = useState(false);
  const [flujoEditando, setFlujoEditando] = useState<any>(null);
  const [modalDetalle, setModalDetalle] = useState<string | null>(null);

  // Si no hay flujos reales, usar datos de ejemplo
  const flujosConFallback = useMemo(() => {
    if (flujos.length > 0) return flujos;
    return FLUJOS_EJEMPLO;
  }, [flujos]);

  // Filtros
  const flujosFiltrados = useMemo(() => {
    return flujosConFallback.filter((f) => {
      const coincideTab =
        tabActiva === "todos" ||
        (tabActiva === "activos" && f.estado === "ACTIVO") ||
        (tabActiva === "pausados" && f.estado === "PAUSADO") ||
        (tabActiva === "borrador" && f.estado === "BORRADOR");
      const coincideBusqueda =
        !busqueda ||
        f.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      return coincideTab && coincideBusqueda;
    });
  }, [tabActiva, busqueda, flujosConFallback]);

  // Estadisticas
  const stats = useMemo(() => ({
    total: flujosConFallback.length,
    activos: flujosConFallback.filter((f) => f.estado === "ACTIVO").length,
    pausados: flujosConFallback.filter((f) => f.estado === "PAUSADO").length,
    borrador: flujosConFallback.filter((f) => f.estado === "BORRADOR").length,
    ejecuciones: flujosConFallback.reduce((sum, f) => sum + (f.ejecuciones || 0), 0),
    exitosas: flujosConFallback.reduce((sum, f) => sum + (f.exitosas || 0), 0),
    fallidas: flujosConFallback.reduce((sum, f) => sum + (f.fallidas || 0), 0),
  }), [flujosConFallback]);

  const tasaExito = stats.ejecuciones > 0 ? Math.round((stats.exitosas / stats.ejecuciones) * 100) : 0;

  // Toggle estado
  const toggleEstado = async (flujoId: string) => {
    const flujo = flujosConFallback.find((f) => f.id === flujoId);
    if (!flujo) return;
    const nuevoEstado = flujo.estado === "ACTIVO" ? "PAUSADO" : "ACTIVO";
    try {
      const res = await fetch(`/api/flujos/${flujoId}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.ok) {
        setFlujos((prev) => prev.map((f) => f.id === flujoId ? { ...f, estado: nuevoEstado } : f));
        toast.success(`Flujo ${nuevoEstado === "ACTIVO" ? "activado" : "pausado"}`);
      }
    } catch { toast.error("Error al cambiar estado"); }
  };

  // Eliminar flujo
  const eliminarFlujo = async (flujoId: string) => {
    if (!confirm("¿Estas seguro de eliminar este flujo?")) return;
    try {
      const res = await fetch(`/api/flujos/${flujoId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setFlujos((prev) => prev.filter((f) => f.id !== flujoId));
        toast.success("Flujo eliminado");
      }
    } catch { toast.error("Error al eliminar"); }
  };

  // Abrir editor
  const abrirEditor = (flujo?: any) => {
    setFlujoEditando(flujo || null);
    setEditorAbierto(true);
  };

  // Guardar flujo
  const guardarFlujo = async (data: any) => {
    try {
      const url = flujoEditando ? `/api/flujos/${flujoEditando.id}` : "/api/flujos";
      const method = flujoEditando ? "PUT" : "POST";
      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        if (flujoEditando) {
          setFlujos((prev) => prev.map((f) => f.id === flujoEditando.id ? { ...f, ...data } : f));
          toast.success("Flujo actualizado");
        } else {
          setFlujos((prev) => [json.data || { ...data, id: crypto.randomUUID() }, ...prev]);
          toast.success("Flujo creado");
        }
        setEditorAbierto(false);
        setFlujoEditando(null);
      }
    } catch { toast.error("Error al guardar"); }
  };

  return (
    <div className="space-y-5">
      {/* Header con stats */}
      <StatsBar
        total={stats.total}
        activos={stats.activos}
        ejecuciones={stats.ejecuciones}
        tasaExito={tasaExito}
      />

      {/* KPIs */}
      <KPIGrid stats={stats} />

      {/* Filtros y Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {[
              { id: "todos", label: "Todos", count: stats.total },
              { id: "activos", label: "Activos", count: stats.activos },
              { id: "pausados", label: "Pausados", count: stats.pausados },
              { id: "borrador", label: "Borrador", count: stats.borrador },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id as TabFlujo)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                  tabActiva === tab.id
                    ? "bg-violet-500 text-white shadow-md shadow-violet-500/20"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {tab.label}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  tabActiva === tab.id ? "bg-white/20" : "bg-slate-200"
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar flujo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-48 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-400 transition-all"
              />
            </div>
            <button
              onClick={() => abrirEditor()}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-500 text-white rounded-xl text-[11px] font-semibold hover:bg-violet-600 transition-colors shadow-md shadow-violet-500/20"
            >
              <Plus size={14} /> Nuevo Flujo
            </button>
          </div>
        </div>
      </div>

      {/* Lista de flujos */}
      {cargando ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : flujosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100/80 p-12 shadow-soft text-center">
          <Zap size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-sm font-bold text-slate-600 mb-2">No hay flujos</h3>
          <p className="text-[11px] text-slate-400 mb-4">
            {busqueda ? "No se encontraron flujos" : "Crea tu primer flujo para automatizar tareas"}
          </p>
          {!busqueda && (
            <button onClick={() => abrirEditor()} className="px-4 py-2 bg-violet-500 text-white rounded-xl text-[11px] font-semibold hover:bg-violet-600 transition-colors">
              <Plus size={14} className="inline mr-1" /> Crear Flujo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {flujosFiltrados.map((flujo) => (
            <FlujoCard
              key={flujo.id}
              flujo={flujo}
              onToggleEstado={toggleEstado}
              onVerDetalle={setModalDetalle}
              onEditar={abrirEditor}
              onEliminar={eliminarFlujo}
            />
          ))}
        </div>
      )}

      {/* Editor Panel */}
      {editorAbierto && (
        <FlujoEditorPanel
          flujo={flujoEditando}
          onGuardar={guardarFlujo}
          onCerrar={() => { setEditorAbierto(false); setFlujoEditando(null); }}
        />
      )}

      {/* Modal Detalle */}
      {modalDetalle && (
        <FlujoDetalleModal
          flujoId={modalDetalle}
          onCerrar={() => setModalDetalle(null)}
          onEditar={(f) => { setModalDetalle(null); abrirEditor(f); }}
        />
      )}
    </div>
  );
}

// ─── Datos de Ejemplo ───
const FLUJOS_EJEMPLO = [
  {
    id: "f1",
    nombre: "Bienvenida Nuevo Lead",
    descripcion: "Enviar email y WhatsApp de bienvenida cuando se registra un nuevo lead",
    trigger: "lead:created",
    categoria: "lead",
    condiciones: [{ campo: "origen", operador: "igual", valor: "WEB" }],
    acciones: [
      { tipo: "enviar_email", configuracion: { plantilla: "Bienvenida Lead" }, delay: 0, orden: 1 },
      { tipo: "enviar_whatsapp", configuracion: { plantilla: "Saludo WhatsApp" }, delay: 30, orden: 2 },
    ],
    estado: "ACTIVO", ejecuciones: 1247, exitosas: 1180, fallidas: 67,
    ultimoEjecucion: "2026-07-04T09:00:00Z", creadoEn: "2026-06-04T10:00:00Z", creadoPor: "Andres Perez",
  },
  {
    id: "f2",
    nombre: "Reactivacion Lead Inactivo",
    descripcion: "Cuando un lead lleva 30 dias sin actividad, enviar serie de reactivacion",
    trigger: "lead:inactive",
    categoria: "lead",
    condiciones: [
      { campo: "dias_sin_contacto", operador: "mayor_igual", valor: "30" },
      { campo: "etapa", operador: "no_es", valor: "CLIENTE_FINALIZADO" },
    ],
    acciones: [
      { tipo: "enviar_email", configuracion: { plantilla: "Reactivacion Lead" }, delay: 0, orden: 1 },
      { tipo: "agregar_etiqueta", configuracion: { etiqueta: "reactivacion-iniciada" }, delay: 0, orden: 2 },
      { tipo: "crear_tarea", configuracion: { titulo: "Seguimiento post reactivacion" }, delay: 720, orden: 3 },
    ],
    estado: "ACTIVO", ejecuciones: 534, exitosas: 489, fallidas: 45,
    ultimoEjecucion: "2026-07-04T06:00:00Z", creadoEn: "2026-06-09T10:00:00Z", creadoPor: "Diego Silva",
  },
  {
    id: "f3",
    nombre: "Documentos Pendientes",
    descripcion: "Enviar recordatorio cada 3 dias mientras haya documentos pendientes",
    trigger: "document:uploaded",
    categoria: "documento",
    condiciones: [{ campo: "documentos_pendientes", operador: "mayor", valor: "0" }],
    acciones: [
      { tipo: "enviar_whatsapp", configuracion: { plantilla: "Recordatorio Documentos" }, delay: 4320, orden: 1 },
      { tipo: "crear_tarea", configuracion: { titulo: "Verificar documentos del cliente" }, delay: 4320, orden: 2 },
    ],
    estado: "ACTIVO", ejecuciones: 423, exitosas: 410, fallidas: 13,
    ultimoEjecucion: "2026-07-03T23:00:00Z", creadoEn: "2026-06-14T10:00:00Z", creadoPor: "Valentina Torres",
  },
  {
    id: "f4",
    nombre: "Felicitacion Credito Aprobado",
    descripcion: "Enviar felicitacion al cliente y notificar al equipo cuando se aprueba un credito",
    trigger: "bank:approved",
    categoria: "credito",
    condiciones: [],
    acciones: [
      { tipo: "enviar_whatsapp", configuracion: { plantilla: "Felicitacion WhatsApp" }, delay: 0, orden: 1 },
      { tipo: "enviar_email", configuracion: { plantilla: "Felicitacion Credito" }, delay: 0, orden: 2 },
      { tipo: "notificar_equipo", configuracion: { mensaje: "Credito aprobado!" }, delay: 0, orden: 3 },
    ],
    estado: "ACTIVO", ejecuciones: 189, exitosas: 189, fallidas: 0,
    ultimoEjecucion: "2026-07-04T03:00:00Z", creadoEn: "2026-05-20T10:00:00Z", creadoPor: "Javier Morales",
  },
  {
    id: "f5",
    nombre: "Asignacion Automatica Lead",
    descripcion: "Asignar lead al ejecutivo con menos carga cuando se registra por telefono",
    trigger: "lead:created",
    categoria: "lead",
    condiciones: [{ campo: "origen", operador: "igual", valor: "TELEFONO" }],
    acciones: [
      { tipo: "asignar_ejecutivo", configuracion: { estrategia: "menor_carga" }, delay: 0, orden: 1 },
      { tipo: "agregar_etiqueta", configuracion: { etiqueta: "auto-asignado" }, delay: 0, orden: 2 },
    ],
    estado: "ACTIVO", ejecuciones: 312, exitosas: 308, fallidas: 4,
    ultimoEjecucion: "2026-07-04T08:00:00Z", creadoEn: "2026-06-19T10:00:00Z", creadoPor: "Andres Perez",
  },
];