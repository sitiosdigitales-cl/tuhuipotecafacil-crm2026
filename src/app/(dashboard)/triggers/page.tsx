"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Zap } from "lucide-react";
import { StatsBar, KPIGrid } from "@/componentes/triggers/StatsBar";
import { TriggerCard } from "@/componentes/triggers/TriggerCard";
import { useTriggers, useTriggerHistorial } from "@/modulos/automatizacion/hooks";
import { TRIGGERS_TIPOS, ACCIONES_TIPOS, CONDICION_OPERADORES, TRIGGER_CATEGORIAS, CAMPOS_POR_CATEGORIA } from "@/modulos/automatizacion/config";
import { toast } from "sonner";

type TabTrigger = "todos" | "activos" | "pausados" | "borrador";

export default function TriggersPage() {
  const { triggers, setTriggers, cargando } = useTriggers();
  const [tabActiva, setTabActiva] = useState<TabTrigger>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalle, setModalDetalle] = useState<string | null>(null);
  const [triggerEditando, setTriggerEditando] = useState<any>(null);

  const triggersFiltrados = useMemo(() => {
    return triggers.filter((t) => {
      const coincideTab =
        tabActiva === "todos" ||
        (tabActiva === "activos" && t.estado === "ACTIVO") ||
        (tabActiva === "pausados" && t.estado === "PAUSADO") ||
        (tabActiva === "borrador" && t.estado === "BORRADOR");
      const coincideBusqueda =
        !busqueda ||
        t.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        t.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      return coincideTab && coincideBusqueda;
    });
  }, [tabActiva, busqueda, triggers]);

  const stats = useMemo(() => ({
    total: triggers.length,
    activos: triggers.filter((t) => t.estado === "ACTIVO").length,
    pausados: triggers.filter((t) => t.estado === "PAUSADO").length,
    borrador: triggers.filter((t) => t.estado === "BORRADOR").length,
    ejecuciones: triggers.reduce((sum, t) => sum + (t.ejecuciones || 0), 0),
    exitosas: triggers.reduce((sum, t) => sum + (t.exitosas || 0), 0),
    fallidas: triggers.reduce((sum, t) => sum + (t.fallidas || 0), 0),
  }), [triggers]);

  const tasaExito = stats.ejecuciones > 0 ? Math.round((stats.exitosas / stats.ejecuciones) * 100) : 0;

  const toggleEstado = async (triggerId: string) => {
    const trigger = triggers.find((t) => t.id === triggerId);
    if (!trigger) return;
    const nuevoEstado = trigger.estado === "ACTIVO" ? "PAUSADO" : "ACTIVO";
    try {
      const res = await fetch(`/api/triggers/${triggerId}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.ok) {
        setTriggers((prev) => prev.map((t) => t.id === triggerId ? { ...t, estado: nuevoEstado } : t));
        toast.success(`Trigger ${nuevoEstado === "ACTIVO" ? "activado" : "pausado"}`);
      }
    } catch { toast.error("Error al cambiar estado"); }
  };

  const eliminarTrigger = async (triggerId: string) => {
    if (!confirm("Ã‚Â¿EstÃƒÂ¡s seguro de eliminar este trigger?")) return;
    try {
      const res = await fetch(`/api/triggers/${triggerId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setTriggers((prev) => prev.filter((t) => t.id !== triggerId));
        toast.success("Trigger eliminado");
      }
    } catch { toast.error("Error al eliminar"); }
  };

  const abrirEditor = (trigger?: any) => {
    setTriggerEditando(trigger || null);
    setModalCrear(true);
  };

  const guardarTrigger = async (data: any) => {
    try {
      const url = triggerEditando ? `/api/triggers/${triggerEditando.id}` : "/api/triggers";
      const method = triggerEditando ? "PUT" : "POST";
      const res = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        if (triggerEditando) {
          setTriggers((prev) => prev.map((t) => t.id === triggerEditando.id ? { ...t, ...data } : t));
          toast.success("Trigger actualizado");
        } else {
          setTriggers((prev) => [json.data || { ...data, id: crypto.randomUUID() }, ...prev]);
          toast.success("Trigger creado");
        }
        setModalCrear(false);
        setTriggerEditando(null);
      }
    } catch { toast.error("Error al guardar"); }
  };

  return (
    <div className="space-y-5">
      <StatsBar total={stats.total} activos={stats.activos} ejecuciones={stats.ejecuciones} tasaExito={tasaExito} />
      <KPIGrid stats={stats} />
      <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {[
              { id: "todos", label: "Todos", count: stats.total },
              { id: "activos", label: "Activos", count: stats.activos },
              { id: "pausados", label: "Pausados", count: stats.pausados },
              { id: "borrador", label: "Borrador", count: stats.borrador },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setTabActiva(tab.id as TabTrigger)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                  tabActiva === tab.id ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}>
                {tab.label}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${tabActiva === tab.id ? "bg-white/20" : "bg-slate-200"}`}>{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Buscar trigger..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                className="w-48 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400 transition-all" />
            </div>
            <button onClick={() => abrirEditor()}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-[11px] font-semibold hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20">
              <Plus size={14} /> Nuevo Trigger
            </button>
          </div>
        </div>
      </div>
      {cargando ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft animate-pulse">
              <div className="flex items-start gap-4"><div className="w-12 h-12 bg-slate-200 rounded-xl" /><div className="flex-1 space-y-2"><div className="h-4 bg-slate-200 rounded w-1/3" /><div className="h-3 bg-slate-200 rounded w-2/3" /></div></div>
            </div>
          ))}
        </div>
      ) : triggersFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100/80 p-12 shadow-soft text-center">
          <Zap size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-sm font-bold text-slate-600 mb-2">No hay triggers</h3>
          <p className="text-[11px] text-slate-400 mb-4">{busqueda ? "No se encontraron triggers" : "Crea tu primer trigger para automatizar tareas"}</p>
          {!busqueda && <button onClick={() => abrirEditor()} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[11px] font-semibold hover:bg-amber-600 transition-colors"><Plus size={14} className="inline mr-1" /> Crear Trigger</button>}
        </div>
      ) : (
        <div className="space-y-4">
          {triggersFiltrados.map((trigger) => (
            <TriggerCard key={trigger.id} trigger={trigger} onToggleEstado={toggleEstado} onVerDetalle={setModalDetalle} onEditar={abrirEditor} onEliminar={eliminarTrigger} />
          ))}
        </div>
      )}
      {modalCrear && <TriggerEditorModal trigger={triggerEditando} onGuardar={guardarTrigger} onCerrar={() => { setModalCrear(false); setTriggerEditando(null); }} />}
      {modalDetalle && <TriggerDetalleModal triggerId={modalDetalle} onCerrar={() => setModalDetalle(null)} onEditar={(t) => { setModalDetalle(null); abrirEditor(t); }} />}
    </div>
  );
}
// --- Modal Editor de Trigger ---
function TriggerEditorModal({ trigger, onGuardar, onCerrar }: { trigger: any; onGuardar: (data: any) => void; onCerrar: () => void }) {
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState({
    nombre: trigger?.nombre || "", descripcion: trigger?.descripcion || "",
    trigger: trigger?.trigger || TRIGGERS_TIPOS[0].id, categoria: trigger?.categoria || "lead",
    condiciones: trigger?.condiciones || [], logica_condiciones: trigger?.logica_condiciones || "AND",
    acciones: trigger?.acciones || [], estado: trigger?.estado || "BORRADOR",
  });
  const camposDisponibles = CAMPOS_POR_CATEGORIA[form.categoria] || [];
  const agregarCondicion = () => setForm((p) => ({ ...p, condiciones: [...p.condiciones, { campo: camposDisponibles[0]?.id || "", operador: "igual", valor: "" }] }));
  const eliminarCondicion = (idx: number) => setForm((p) => ({ ...p, condiciones: p.condiciones.filter((_: any, i: number) => i !== idx) }));
  const actualizarCondicion = (idx: number, campo: string, valor: any) => setForm((p) => ({ ...p, condiciones: p.condiciones.map((c: any, i: number) => i === idx ? { ...c, [campo]: valor } : c) }));
  const agregarAccion = (tipo: string) => setForm((p) => ({ ...p, acciones: [...p.acciones, { tipo, configuracion: {}, delay: 0, orden: p.acciones.length + 1 }] }));
  const eliminarAccion = (idx: number) => setForm((p) => ({ ...p, acciones: p.acciones.filter((_: any, i: number) => i !== idx).map((a: any, i: number) => ({ ...a, orden: i + 1 })) }));
  const handleSubmit = () => { if (!form.nombre || !form.trigger || form.acciones.length === 0) { toast.error("Completa todos los campos obligatorios"); return; } onGuardar(form); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div><h3 className="text-base font-bold text-slate-800">{trigger ? "Editar Trigger" : "Nuevo Trigger"}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Paso {paso} de 3: {paso === 1 ? "Configuracion" : paso === 2 ? "Condiciones" : "Acciones"}</p></div>
            <button onClick={onCerrar} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><span className="text-slate-400">?</span></button>
          </div>
          <div className="flex gap-2 mt-4">{[1, 2, 3].map((p) => <div key={p} className={`h-1 flex-1 rounded-full transition-colors ${p <= paso ? "bg-amber-500" : "bg-slate-200"}`} />)}</div>
        </div>
        <div className="p-6">
          {paso === 1 && (
            <div className="space-y-5">
              <div className="space-y-1.5"><label className="text-[11px] font-semibold text-slate-700">Nombre del Trigger *</label>
                <input type="text" placeholder="Ej: Bienvenida Nuevo Lead" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400 transition-all" /></div>
              <div className="space-y-1.5"><label className="text-[11px] font-semibold text-slate-700">Descripcion</label>
                <textarea placeholder="Describe que hace este trigger..." rows={2} value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400 resize-none transition-all" /></div>
              <div className="space-y-1.5"><label className="text-[11px] font-semibold text-slate-700">Evento Trigger *</label>
                <select value={form.trigger} onChange={(e) => { const val = e.target.value; const cat = TRIGGERS_TIPOS.find((t) => t.id === val)?.categoria || "lead"; setForm((p) => ({ ...p, trigger: val, categoria: cat })); }}
                  className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400">
                  {TRIGGER_CATEGORIAS.map((cat) => <optgroup key={cat.id} label={cat.label}>{TRIGGERS_TIPOS.filter((t) => t.categoria === cat.id).map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.label} - {tipo.descripcion}</option>)}</optgroup>)}
                </select></div>
            </div>
          )}
          {paso === 2 && (
            <div className="space-y-5">
              <div className="space-y-1.5"><label className="text-[11px] font-semibold text-slate-700">Logica entre condiciones</label>
                <div className="flex gap-2">{(["AND", "OR"] as const).map((logica) => (
                  <button key={logica} onClick={() => setForm((p) => ({ ...p, logica_condiciones: logica }))}
                    className={`px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${form.logica_condiciones === logica ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                    {logica === "AND" ? "Todas (AND)" : "Cualquiera (OR)"}</button>))}</div></div>
              <div className="space-y-3"><label className="text-[11px] font-semibold text-slate-700">Condiciones</label>
                {form.condiciones.length === 0 ? <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center"><p className="text-[10px] text-slate-400">Sin condiciones = se ejecuta siempre</p></div> : (
                  form.condiciones.map((cond: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                      <select value={cond.campo} onChange={(e) => actualizarCondicion(idx, "campo", e.target.value)} className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600">{camposDisponibles.map((campo) => <option key={campo.id} value={campo.id}>{campo.label}</option>)}</select>
                      <select value={cond.operador} onChange={(e) => actualizarCondicion(idx, "operador", e.target.value)} className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600">{CONDICION_OPERADORES.map((op) => <option key={op.id} value={op.id}>{op.label}</option>)}</select>
                      {!["esta_vacio", "no_vacio"].includes(cond.operador) && <input type="text" placeholder="Valor" value={cond.valor || ""} onChange={(e) => actualizarCondicion(idx, "valor", e.target.value)} className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 flex-1" />}
                      <button onClick={() => eliminarCondicion(idx)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">?</button>
                    </div>
                  )))}
                <button onClick={agregarCondicion} className="text-[11px] font-semibold text-amber-600 hover:text-amber-700">+ Agregar condicion</button></div>
            </div>
          )}
          {paso === 3 && (
            <div className="space-y-5">
              <div className="space-y-3"><label className="text-[11px] font-semibold text-slate-700">Acciones del Trigger *</label>
                {form.acciones.length === 0 ? <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center"><p className="text-[10px] text-slate-400">Agrega al menos una accion</p></div> : (
                  <div className="space-y-2">{form.acciones.map((accion: any, idx: number) => {
                    const config = ACCIONES_TIPOS.find((a) => a.id === accion.tipo);
                    return (<div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-400 w-6">{idx + 1}</span>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${config?.color || "#64748B"}15` }}><Zap size={14} style={{ color: config?.color || "#64748B" }} /></div>
                      <div className="flex-1"><span className="text-[11px] font-semibold text-slate-700">{config?.label || accion.tipo}</span></div>
                      <input type="number" placeholder="Delay (min)" value={accion.delay || ""} onChange={(e) => { const val = parseInt(e.target.value) || 0; setForm((p) => ({ ...p, acciones: p.acciones.map((a: any, i: number) => i === idx ? { ...a, delay: val } : a) })); }} className="w-24 h-8 px-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600" />
                      <button onClick={() => eliminarAccion(idx)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">?</button>
                    </div>);
                  })}</div>)}</div>
              <div className="space-y-2"><label className="text-[11px] font-semibold text-slate-700">Agregar accion</label>
                <div className="grid grid-cols-2 gap-2">{ACCIONES_TIPOS.map((accion) => (
                  <button key={accion.id} onClick={() => agregarAccion(accion.id)} className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-amber-50 rounded-xl border border-slate-200 hover:border-amber-300 transition-all text-left">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accion.color}15` }}><Zap size={14} style={{ color: accion.color }} /></div>
                    <span className="text-[10px] font-semibold text-slate-700">{accion.label}</span>
                  </button>))}</div></div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
          <div className="flex gap-2">{paso > 1 && <button onClick={() => setPaso((p) => p - 1)} className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Anterior</button>}</div>
          <div className="flex gap-2">
            <button onClick={onCerrar} className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
            {paso < 3 ? <button onClick={() => setPaso((p) => p + 1)} className="px-5 py-2 bg-amber-500 text-white text-[11px] font-semibold rounded-xl hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20">Siguiente</button> : <button onClick={handleSubmit} className="px-5 py-2 bg-amber-500 text-white text-[11px] font-semibold rounded-xl hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20">{trigger ? "Actualizar" : "Crear"} Trigger</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Modal Detalle de Trigger ---
function TriggerDetalleModal({ triggerId, onCerrar, onEditar }: { triggerId: string; onCerrar: () => void; onEditar: (trigger: any) => void }) {
  const [trigger, setTrigger] = useState<any>(null);
  const [tabActiva, setTabActiva] = useState<"general" | "historial">("general");

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/triggers");
        const json = await res.json();
        if (json.success) { const found = json.data.find((t: any) => t.id === triggerId); setTrigger(found); }
      } catch {}
    }
    cargar();
  }, [triggerId]);

  if (!trigger) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"><div className="bg-white rounded-2xl w-full max-w-3xl mx-4 p-12 text-center"><div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" /></div></div>;

  const triggerConfig = TRIGGERS_TIPOS.find((t) => t.id === trigger.trigger);
  const categoria = TRIGGER_CATEGORIAS.find((c) => c.id === (trigger.categoria || triggerConfig?.categoria)) || TRIGGER_CATEGORIAS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${categoria.color}15` }}><Zap size={24} style={{ color: categoria.color }} /></div>
              <div><h3 className="text-lg font-bold text-slate-800">{trigger.nombre}</h3><p className="text-[11px] text-slate-500 mt-0.5">{trigger.descripcion}</p>
                <div className="flex items-center gap-2 mt-2"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${trigger.estado === "ACTIVO" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{trigger.estado}</span><span className="text-[11px] text-slate-400">{triggerConfig?.label}</span></div></div>
            </div>
            <button onClick={onCerrar} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><span className="text-slate-400">?</span></button>
          </div>
        </div>
        <div className="border-b border-slate-100 px-6"><div className="flex gap-4">{(["general", "historial"] as const).map((tab) => (
          <button key={tab} onClick={() => setTabActiva(tab)} className={`py-3 text-[11px] font-semibold border-b-2 transition-colors ${tabActiva === tab ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>{tab === "general" ? "General" : "Historial"}</button>))}</div></div>
        <div className="p-6">
          {tabActiva === "general" ? (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-4"><h4 className="text-[11px] font-bold text-slate-600 mb-3">Flujo del Trigger</h4>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <div className="flex flex-col items-center min-w-[80px]"><div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><Zap size={18} className="text-amber-500" /></div><span className="text-[10px] font-semibold text-slate-600 mt-1">{triggerConfig?.label}</span></div>
                  {(trigger.acciones || []).map((accion: any, idx: number) => { const config = ACCIONES_TIPOS.find((a) => a.id === accion.tipo); return (<div key={idx} className="flex items-center gap-1"><span className="text-slate-300">?</span><div className="flex flex-col items-center min-w-[70px]"><div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${config?.color || "#64748B"}15` }}><Zap size={14} style={{ color: config?.color || "#64748B" }} /></div><span className="text-[9px] font-semibold text-slate-600 mt-1 text-center">{config?.label || accion.tipo}</span></div></div>); })}
                </div></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center"><div className="text-xl font-bold text-blue-700">{(trigger.ejecuciones || 0).toLocaleString()}</div><div className="text-[10px] text-blue-500">Ejecuciones</div></div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center"><div className="text-xl font-bold text-emerald-700">{trigger.exitosas || 0}</div><div className="text-[10px] text-emerald-500">Exitosas</div></div>
                <div className="bg-red-50 rounded-xl p-4 text-center"><div className="text-xl font-bold text-red-700">{trigger.fallidas || 0}</div><div className="text-[10px] text-red-500">Fallidas</div></div>
              </div>
              <div><h4 className="text-[11px] font-bold text-slate-600 mb-2">Condiciones</h4>
                {(!trigger.condiciones || trigger.condiciones.length === 0) ? <p className="text-[10px] text-slate-400 italic">Se ejecuta siempre</p> : (
                  <div className="space-y-1">{trigger.condiciones.map((cond: any, idx: number) => <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-[11px]"><span className="font-semibold text-slate-600">{cond.campo}</span><span className="text-slate-400">{cond.operador}</span><span className="font-bold text-slate-800">{cond.valor}</span></div>)}</div>)}</div>
              <div><h4 className="text-[11px] font-bold text-slate-600 mb-2">Acciones</h4>
                <div className="space-y-1">{trigger.acciones?.map((accion: any, idx: number) => { const config = ACCIONES_TIPOS.find((a) => a.id === accion.tipo); return (<div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg"><span className="text-[10px] font-bold text-slate-400 w-5">{idx + 1}</span><span className="text-[11px] font-semibold text-slate-700">{config?.label || accion.tipo}</span>{accion.delay > 0 && <span className="text-[10px] text-slate-400">+{accion.delay >= 60 ? `${Math.round(accion.delay / 60)}h` : `${accion.delay}m`}</span>}</div>); })}</div></div>
            </div>
          ) : <TriggerHistorialContent triggerId={triggerId} />}
        </div>
        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-2">
          <button onClick={onCerrar} className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cerrar</button>
          <button onClick={() => onEditar(trigger)} className="px-4 py-2 bg-amber-500 text-white text-[11px] font-semibold rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-1.5">Editar</button>
        </div>
      </div>
    </div>
  );
}

// --- Contenido del Historial ---
function TriggerHistorialContent({ triggerId }: { triggerId: string }) {
  const { historial, stats, cargando, pagina, setPagina, total } = useTriggerHistorial(triggerId);
  if (cargando) return <div className="text-center py-8 text-[11px] text-slate-400">Cargando historial...</div>;
  return (
    <div className="space-y-4">
      {stats && <div className="grid grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 text-center"><div className="text-lg font-bold text-slate-700">{stats.total}</div><div className="text-[10px] text-slate-400">Total</div></div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center"><div className="text-lg font-bold text-emerald-700">{stats.exitosas}</div><div className="text-[10px] text-emerald-500">Exitosas</div></div>
        <div className="bg-red-50 rounded-lg p-3 text-center"><div className="text-lg font-bold text-red-700">{stats.fallidas}</div><div className="text-[10px] text-red-500">Fallidas</div></div>
        <div className="bg-amber-50 rounded-lg p-3 text-center"><div className="text-lg font-bold text-amber-700">{stats.tasaExito}%</div><div className="text-[10px] text-amber-500">Exito</div></div>
      </div>}
      {historial.length === 0 ? <div className="text-center py-8"><p className="text-[11px] text-slate-400">No hay ejecuciones registradas</p></div> : (
        <div className="space-y-2">{historial.map((ejec: any) => (
          <div key={ejec.id} className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ejec.estado === "EXITOSO" ? "bg-emerald-100 text-emerald-700" : ejec.estado === "FALLIDO" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{ejec.estado}</span><span className="text-[11px] font-semibold text-slate-700">{ejec.leadNombre || "Sin lead"}</span></div>
              <span className="text-[10px] text-slate-400">{new Date(ejec.ejecutadoEn || ejec.ejecutado_en).toLocaleString("es-CL")}</span>
            </div>
            {ejec.accionesEjecutadas && <div className="flex flex-wrap gap-1 mt-1">{JSON.parse(typeof ejec.accionesEjecutadas === "string" ? ejec.accionesEjecutadas : "[]").map((a: any, idx: number) => <span key={idx} className={`text-[9px] px-1.5 py-0.5 rounded ${a.estado === "EXITOSO" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{a.tipo}: {a.estado}</span>)}</div>}
            {ejec.errorMensaje && <p className="text-[10px] text-red-500 mt-1">{ejec.errorMensaje}</p>}
          </div>))}</div>)}
      {total > 20 && <div className="flex items-center justify-center gap-2 pt-2">
        <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1} className="px-3 py-1 text-[10px] font-semibold bg-slate-100 rounded-lg disabled:opacity-50">Anterior</button>
        <span className="text-[10px] text-slate-400">Pagina {pagina}</span>
        <button onClick={() => setPagina((p) => p + 1)} disabled={historial.length < 20} className="px-3 py-1 text-[10px] font-semibold bg-slate-100 rounded-lg disabled:opacity-50">Siguiente</button>
      </div>}
    </div>
  );
}
