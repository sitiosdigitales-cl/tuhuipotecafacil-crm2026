"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lead, ETAPAS_CONFIG, ORIGEN_LABELS, RENTAS_MENSUALES, SITUACION_LABORAL_CONFIG } from "@/tipos";
import type { SituacionLaboral } from "@/tipos";
import { formatoMoneda, formatoUF } from "@/lib/utils";
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Building2, 
  FileText, 
  DollarSign,
  Home,
  PieChart,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Save,
  X,
  Briefcase,
  UserCheck,
  Calendar,
  Shield,
  TrendingUp,
} from "lucide-react";

interface FormularioLeadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSubmit: (lead: Partial<Lead>) => void;
}

const BANCOS = [
  "Banco de Chile",
  "Santander",
  "Bci",
  "Itaú",
  "Scotiabank",
  "Banco Estado",
  "Falabella",
  "CorpGroup",
];

const TIPOS_CREDITO = ["Crédito Hipotecario", "Crédito de Consumo", "Fines Generales", "Capital para Empresas"];

const EJECUTIVOS = [
  "Andrés Pérez",
  "Carolina Muñoz",
  "Diego Silva",
  "Valentina Torres",
  "Javier Morales",
];

export function FormularioLead({ open, onOpenChange, lead, onSubmit }: FormularioLeadProps) {
  const [paso, setPaso] = useState(1);
  const [formData, setFormData] = useState<Partial<Lead>>({
    nombre: "",
    apellido: "",
    rut: "",
    edad: undefined,
    email: "",
    telefono: "",
    situacionLaboral: "INDEPENDIENTE",
    enDicom: false,
    dicomDetalle: "",
    rentaMensual: "",
    complementarRenta: false,
    tipoCredito: "",
    cuentaPie: false,
    comentarios: "",
    origen: "WEB",
    etapa: "NUEVO_LEAD",
    prioridad: "MEDIA",
    banco: "",
    montoSolicitado: undefined,
    valorPropiedad: undefined,
    pieDisponible: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lead) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Inicializacion intencional del formulario al recibir prop
      setFormData({
        nombre: lead.nombre,
        apellido: lead.apellido,
        rut: lead.rut,
        edad: lead.edad,
        email: lead.email || "",
        telefono: lead.telefono || "",
        situacionLaboral: lead.situacionLaboral || "INDEPENDIENTE",
        enDicom: lead.enDicom || false,
        dicomDetalle: lead.dicomDetalle || "",
        rentaMensual: lead.rentaMensual || "",
        complementarRenta: lead.complementarRenta || false,
        tipoCredito: lead.tipoCredito || "",
        cuentaPie: lead.cuentaPie || false,
        comentarios: lead.comentarios || lead.notas || "",
        origen: lead.origen,
        etapa: lead.etapa,
        prioridad: lead.prioridad,
        banco: lead.banco || "",
        montoSolicitado: lead.montoSolicitado,
        valorPropiedad: lead.valorPropiedad,
        pieDisponible: lead.pieDisponible,
      });
    } else {
      setFormData({
        nombre: "",
        apellido: "",
        rut: "",
        edad: undefined,
        email: "",
        telefono: "",
        situacionLaboral: "INDEPENDIENTE",
        enDicom: false,
        dicomDetalle: "",
        rentaMensual: "",
        complementarRenta: false,
        tipoCredito: "",
        cuentaPie: false,
        comentarios: "",
        origen: "WEB",
        etapa: "NUEVO_LEAD",
        prioridad: "MEDIA",
        banco: "",
        montoSolicitado: undefined,
        valorPropiedad: undefined,
        pieDisponible: undefined,
      });
    }
    setErrors({});
    setPaso(1);
  }, [lead, open]);

  const validateRUT = (rut: string): boolean => {
    const cleanRut = rut.replace(/[.\-]/g, "");
    if (cleanRut.length < 8) return false;
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();
    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const remainder = sum % 11;
    const expectedDV = remainder === 0 ? "0" : remainder === 1 ? "K" : String(11 - remainder);
    return dv === expectedDV;
  };

  const validatePaso1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre?.trim()) newErrors.nombre = "El nombre es requerido";
    if (!formData.apellido?.trim()) newErrors.apellido = "El apellido es requerido";
    if (!formData.rut?.trim()) {
      newErrors.rut = "El RUT es requerido";
    } else if (!validateRUT(formData.rut)) {
      newErrors.rut = "RUT inválido";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePaso1()) {
      onSubmit({ ...formData, notas: formData.comentarios });
      onOpenChange(false);
    }
  };

  const updateField = (field: keyof Lead, value: string | number | boolean | undefined | null) => {
    setFormData((prev) => ({ ...prev, [field]: value ?? undefined }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-bold text-slate-900">
                {lead ? "Editar Lead" : "Nuevo Lead"}
              </SheetTitle>
              <SheetDescription className="text-[11px] text-slate-400 mt-0.5">
                {lead ? "Modifica la información del lead" : "Completa los datos del formulario web"}
              </SheetDescription>
            </div>
            <button onClick={() => onOpenChange(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold ${
              paso >= 1 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"
            }`}>
              {paso > 1 ? <CheckCircle2 size={12} /> : <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center">1</span>}
              Datos Personales
            </div>
            <ChevronRight size={12} className="text-slate-300" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold ${
              paso >= 2 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"
            }`}>
              {paso > 2 ? <CheckCircle2 size={12} /> : <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center">2</span>}
              Situación
            </div>
            <ChevronRight size={12} className="text-slate-300" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold ${
              paso >= 3 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"
            }`}>
              <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center">3</span>
              Crédito
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {/* Paso 1: Datos Personales */}
          {paso === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User size={16} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Datos Personales</h4>
                  <p className="text-[10px] text-slate-400">Información del formulario web</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold text-slate-700">Nombre *</Label>
                  <Input value={formData.nombre || ""} onChange={(e) => updateField("nombre", e.target.value)} placeholder="Jorge" className={`h-11 ${errors.nombre ? "border-red-500" : ""}`} />
                  {errors.nombre && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {errors.nombre}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold text-slate-700">Apellido *</Label>
                  <Input value={formData.apellido || ""} onChange={(e) => updateField("apellido", e.target.value)} placeholder="Naranjo" className={`h-11 ${errors.apellido ? "border-red-500" : ""}`} />
                  {errors.apellido && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {errors.apellido}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700">RUT *</Label>
                <Input value={formData.rut || ""} onChange={(e) => updateField("rut", e.target.value)} placeholder="18.211.210-0" className={`h-11 ${errors.rut ? "border-red-500" : ""}`} />
                {errors.rut && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {errors.rut}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold text-slate-700">Edad</Label>
                  <Input type="number" value={formData.edad || ""} onChange={(e) => updateField("edad", e.target.value ? Number(e.target.value) : undefined)} placeholder="33" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold text-slate-700">Teléfono</Label>
                  <Input value={formData.telefono || ""} onChange={(e) => updateField("telefono", e.target.value)} placeholder="+56966842168" className="h-11" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700">Correo Electrónico</Label>
                <Input type="email" value={formData.email || ""} onChange={(e) => updateField("email", e.target.value)} placeholder="sitiosdigitales.cl@gmail.com" className={`h-11 ${errors.email ? "border-red-500" : ""}`} />
                {errors.email && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {errors.email}</p>}
              </div>
            </div>
          )}

          {/* Paso 2: Situación Laboral y Financiera */}
          {paso === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Briefcase size={16} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Situación Laboral</h4>
                  <p className="text-[10px] text-slate-400">Información del formulario web</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700">¿Cuál es tu situación laboral? *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateField("situacionLaboral", "DEPENDIENTE")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.situacionLaboral === "DEPENDIENTE"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">👔</div>
                    <div className="text-[11px] font-bold text-slate-800">Dependiente</div>
                    <div className="text-[9px] text-slate-400">Trabaja para una empresa</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("situacionLaboral", "INDEPENDIENTE")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.situacionLaboral === "INDEPENDIENTE"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">💼</div>
                    <div className="text-[11px] font-bold text-slate-800">Independiente</div>
                    <div className="text-[9px] text-slate-400">Trabaja por cuenta propia</div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700">¿Estás actualmente en DICOM? *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { updateField("enDicom", true); updateField("dicomDetalle", ""); }}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.enDicom === true
                        ? "border-red-500 bg-red-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-[11px] font-bold text-slate-800">Sí</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { updateField("enDicom", false); updateField("dicomDetalle", "No aplica"); }}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.enDicom === false
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-[11px] font-bold text-slate-800">No</div>
                  </button>
                </div>
              </div>

              {formData.enDicom && (
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold text-slate-700">¿Corresponde a?</Label>
                  <Input value={formData.dicomDetalle || ""} onChange={(e) => updateField("dicomDetalle", e.target.value)} placeholder="Describe el motivo del DICOM" className="h-11" />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700">¿Cuál es tu renta mensual aproximada? *</Label>
                <Select value={formData.rentaMensual || ""} onValueChange={(v) => updateField("rentaMensual", v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Seleccionar rango de renta" />
                  </SelectTrigger>
                  <SelectContent>
                    {RENTAS_MENSUALES.map((renta) => (
                      <SelectItem key={renta} value={renta}>{renta}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700">¿Deseas complementar renta?</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateField("complementarRenta", true)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.complementarRenta === true
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-[11px] font-bold text-slate-800">Sí</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("complementarRenta", false)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.complementarRenta === false
                        ? "border-slate-200"
                        : "border-blue-500 bg-blue-50"
                    }`}
                  >
                    <div className="text-[11px] font-bold text-slate-800">No</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Tipo de Crédito */}
          {paso === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign size={16} className="text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Tipo de Crédito</h4>
                  <p className="text-[10px] text-slate-400">Información del formulario web</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700">¿Qué tipo de crédito buscas? *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {TIPOS_CREDITO.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => updateField("tipoCredito", tipo)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        formData.tipoCredito === tipo
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-[11px] font-bold text-slate-800">{tipo}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700">¿Cuentas con pie o ahorro inicial? *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateField("cuentaPie", true)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.cuentaPie === true
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-[11px] font-bold text-slate-800">Sí</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("cuentaPie", false)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.cuentaPie === false
                        ? "border-red-500 bg-red-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-[11px] font-bold text-slate-800">No</div>
                  </button>
                </div>
              </div>

              {/* Datos internos CRM */}
              <div className="pt-4 mt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Building2 size={16} className="text-slate-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Datos CRM (Internos)</h4>
                    <p className="text-[10px] text-slate-400">Información adicional del sistema</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold text-slate-700">Banco</Label>
                    <Select value={formData.banco} onValueChange={(v) => updateField("banco", v)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANCOS.map((banco) => (
                          <SelectItem key={banco} value={banco}>{banco}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold text-slate-700">Ejecutivo</Label>
                    <Select value={formData.nombreEjecutivo || ""} onValueChange={(v) => updateField("nombreEjecutivo", v)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {EJECUTIVOS.map((ej) => (
                          <SelectItem key={ej} value={ej}>{ej}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label className="text-[11px] font-semibold text-slate-700">Comentarios Adicionales</Label>
                  <textarea
                    value={formData.comentarios || ""}
                    onChange={(e) => updateField("comentarios", e.target.value)}
                    placeholder="prueba 2"
                    className="w-full min-h-[80px] px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
            {paso > 1 ? (
              <button type="button" onClick={() => setPaso(paso - 1)} className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <ChevronLeft size={14} /> Anterior
              </button>
            ) : (
              <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                Cancelar
              </button>
            )}

            {paso < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (paso === 1 && validatePaso1()) {
                    setPaso(2);
                  } else {
                    setPaso(3);
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 gradient-primary text-white rounded-xl text-[11px] font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15"
              >
                Siguiente <ChevronRight size={14} />
              </button>
            ) : (
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 gradient-primary text-white rounded-xl text-[11px] font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15">
                <Save size={14} />
                {lead ? "Guardar Cambios" : "Crear Lead"}
              </button>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}