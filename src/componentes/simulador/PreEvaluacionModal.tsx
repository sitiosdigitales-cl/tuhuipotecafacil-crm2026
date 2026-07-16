"use client";

import { useState } from "react";
import { X, Send, CheckCircle, AlertCircle, User, Phone, Mail, FileText, Briefcase, Home } from "lucide-react";
import { toast } from "sonner";

interface PreEvaluacionModalProps {
  open: boolean;
  onClose: () => void;
  datosSimulador?: {
    valorPropiedad?: number;
    pie?: number;
    plazo?: number;
    tasa?: number;
    banco?: string;
    tipoCredito?: string;
  };
}

const SITUACION_LABORAL = ["Dependiente", "Independiente", "Empresa / Pyme"];
const TIPOS_CREDITO = ["Crédito Hipotecario", "Crédito de Consumo", "Fines Generales", "Capital para Empresas"];

export function PreEvaluacionModal({ open, onClose, datosSimulador }: PreEvaluacionModalProps) {
  const [paso, setPaso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    nombre: "", apellido: "", rut: "", edad: "",
    telefono: "", email: "", situacionLaboral: "Dependiente",
    dicom: "No", tipoCredito: datosSimulador?.tipoCredito || "Crédito Hipotecario",
    rentaMensual: "", complementarRenta: "No", comentarios: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errores[field]) setErrores((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const formatRUT = (v: string) => {
    const clean = v.replace(/[^0-9kK]/g, "");
    if (clean.length < 2) return clean;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    return body.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv;
  };

  const validarPaso1 = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = "Requerido";
    if (!form.apellido.trim()) e.apellido = "Requerido";
    if (!form.rut.trim()) e.rut = "Requerido";
    if (!form.telefono.trim()) e.telefono = "Requerido";
    if (!form.email.trim()) e.email = "Requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email inválido";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setEnviando(true);
    try {
      const res = await fetch("/api/pre-evaluacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          rut: form.rut.trim(),
          edad: parseInt(form.edad) || undefined,
          email: form.email.trim(),
          telefono: form.telefono.trim(),
          situacionLaboral: form.situacionLaboral === "Independiente" ? "INDEPENDIENTE" : "DEPENDIENTE",
          enDicom: form.dicom === "Sí",
          tipoCredito: form.tipoCredito,
          rentaMensual: form.rentaMensual,
          complementarRenta: form.complementarRenta === "Sí",
          comentarios: form.comentarios,
          origen: "WEB",
          etapa: "NUEVO_LEAD",
          prioridad: "MEDIA",
          montoSolicitado: datosSimulador?.valorPropiedad ? datosSimulador.valorPropiedad - (datosSimulador.pie || 0) : undefined,
          banco: datosSimulador?.banco || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEnviado(true);
        toast.success("¡Solicitud enviada correctamente!");
      } else {
        toast.error("Error al enviar. Intenta nuevamente.");
      }
    } catch {
      toast.error("Error de conexión. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#1E40AF] to-[#2563EB] px-6 py-5 rounded-t-2xl z-10">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X size={18} className="text-white" />
          </button>
          {enviado ? (
            <div className="text-center py-2">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={28} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">¡Solicitud Enviada!</h2>
              <p className="text-xs text-blue-100 mt-1">Nuestro equipo se contactará contigo pronto</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Pre Evaluación Gratuita</h2>
                  <p className="text-[10px] text-blue-100">Paso {paso} de 3 — {paso === 1 ? "Datos personales" : paso === 2 ? "Situacion laboral" : "Confirmar"}</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${(paso / 3) * 100}%` }} />
              </div>
            </>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {enviado ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-600 mb-6">
                Hemos recibido tu solicitud de pre evaluación. Nuestro equipo financiero analizará tu perfil y se contactará contigo en las próximas 24 horas.
              </p>
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-xs text-blue-700 font-semibold">¿Necesitas ayuda ahora?</p>
                <a href="https://wa.me/56966842168" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-green-500 text-white rounded-lg text-[11px] font-semibold hover:bg-green-600 transition-colors">
                  Escríbenos por WhatsApp
                </a>
              </div>
              <button onClick={onClose} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                Cerrar
              </button>
            </div>
          ) : paso === 1 ? (
            /* Paso 1: Datos personales */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Nombre <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={form.nombre} onChange={(e) => updateField("nombre", e.target.value)}
                      placeholder="Tu nombre"
                      className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border-2 rounded-xl text-sm font-medium focus:outline-none transition-all ${errores.nombre ? "border-red-400 bg-red-50/50" : "border-slate-200 focus:border-blue-500"}`} />
                  </div>
                  {errores.nombre && <p className="text-[10px] text-red-500 mt-0.5">{errores.nombre}</p>}
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Apellido <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={form.apellido} onChange={(e) => updateField("apellido", e.target.value)}
                      placeholder="Tu apellido"
                      className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border-2 rounded-xl text-sm font-medium focus:outline-none transition-all ${errores.apellido ? "border-red-400 bg-red-50/50" : "border-slate-200 focus:border-blue-500"}`} />
                  </div>
                  {errores.apellido && <p className="text-[10px] text-red-500 mt-0.5">{errores.apellido}</p>}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">RUT <span className="text-red-500">*</span></label>
                <input type="text" value={form.rut} onChange={(e) => updateField("rut", formatRUT(e.target.value))}
                  placeholder="12.345.678-9" maxLength={12}
                  className={`w-full px-3 py-2.5 bg-slate-50 border-2 rounded-xl text-sm font-medium font-mono tracking-wider focus:outline-none transition-all ${errores.rut ? "border-red-400 bg-red-50/50" : "border-slate-200 focus:border-blue-500"}`} />
                {errores.rut && <p className="text-[10px] text-red-500 mt-0.5">{errores.rut}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Edad</label>
                  <input type="number" value={form.edad} onChange={(e) => updateField("edad", e.target.value)}
                    placeholder="33" min="18" max="99"
                    className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Teléfono *</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="tel" value={form.telefono} onChange={(e) => updateField("telefono", e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border-2 rounded-xl text-sm font-medium focus:outline-none transition-all ${errores.telefono ? "border-red-400 bg-red-50/50" : "border-slate-200 focus:border-blue-500"}`} />
                  </div>
                  {errores.telefono && <p className="text-[10px] text-red-500 mt-0.5">{errores.telefono}</p>}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Correo Electrónico *</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)}
                    placeholder="correo@ejemplo.cl"
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border-2 rounded-xl text-sm font-medium focus:outline-none transition-all ${errores.email ? "border-red-400 bg-red-50/50" : "border-slate-200 focus:border-blue-500"}`} />
                </div>
                {errores.email && <p className="text-[10px] text-red-500 mt-0.5">{errores.email}</p>}
              </div>

              <button onClick={() => { if (validarPaso1()) setPaso(2); }}
                className="w-full py-3 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                Siguiente <span className="text-blue-300">→</span>
              </button>
            </div>
          ) : (
            /* Paso 2: Situacion laboral y financiera */
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">¿Cual es tu situacion laboral? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {SITUACION_LABORAL.map((s) => (
                    <button key={s} onClick={() => updateField("situacionLaboral", s)}
                      className={`p-2.5 rounded-xl border-2 text-[10px] font-semibold transition-all text-center ${
                        form.situacionLaboral === s ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">¿Estas en DICOM?</label>
                <div className="grid grid-cols-2 gap-2">
                  {["No", "Sí"].map((v) => (
                    <button key={v} onClick={() => updateField("dicom", v)}
                      className={`p-2.5 rounded-xl border-2 text-[10px] font-semibold transition-all ${
                        form.dicom === v
                          ? v === "No" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">¿Que tipo de credito buscas? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS_CREDITO.map((t) => (
                    <button key={t} onClick={() => updateField("tipoCredito", t)}
                      className={`p-2.5 rounded-xl border-2 text-[10px] font-semibold transition-all text-left ${
                        form.tipoCredito === t ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">¿Complementar renta?</label>
                <div className="grid grid-cols-2 gap-2">
                  {["No", "Sí"].map((v) => (
                    <button key={v} onClick={() => updateField("complementarRenta", v)}
                      className={`p-2.5 rounded-xl border-2 text-[10px] font-semibold transition-all ${
                        form.complementarRenta === v
                          ? v === "Sí" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Comentarios adicionales</label>
                <textarea value={form.comentarios} onChange={(e) => updateField("comentarios", e.target.value)}
                  placeholder="Cuéntanos tu situación..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-all resize-none" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPaso(1)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                  ← Anterior
                </button>
                <button onClick={handleSubmit} disabled={enviando}
                  className="flex-[2] py-3 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {enviando ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
                  ) : (
                    <><Send size={14} /> Enviar Solicitud</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
