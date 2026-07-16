"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
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
import { Lead, RENTAS_MENSUALES } from "@/tipos";
import {
  User,
  Mail,
  Phone,
  Building2,
  DollarSign,
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
  Hash,
  Check,
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

const TIPOS_CREDITO = ["Créditos Hipotecarios", "Créditos de Consumos", "Fines Generales", "Capital para Empresas"];

const EJECUTIVOS = [
  "Andrés Pérez",
  "Carolina Muñoz",
  "Diego Silva",
  "Valentina Torres",
  "Javier Morales",
];

const PASOS_CONFIG = [
  { id: 1, label: "Datos Personales", icono: User, color: "blue" },
  { id: 2, label: "Situación", icono: Briefcase, color: "purple" },
  { id: 3, label: "Crédito", icono: DollarSign, color: "emerald" },
];

function formatRUT(value: string): string {
  const clean = value.replace(/[^0-9kK]/g, "");
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted}-${dv}`;
}

function formatPhone(value: string): string {
  const clean = value.replace(/[^0-9]/g, "");
  if (clean.length <= 2) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 2)} ${clean.slice(2)}`;
  return `${clean.slice(0, 2)} ${clean.slice(2, 6)} ${clean.slice(6, 10)}`;
}

export function FormularioLead({ open, onOpenChange, lead, onSubmit }: FormularioLeadProps) {
  const [paso, setPaso] = useState(1);
  const [formData, setFormData] = useState<Partial<Lead>>({
    nombre: "",
    apellido: "",
    rut: "",
    edad: 0,
    email: "",
    telefono: "",
    situacionLaboral: "DEPENDIENTE",
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
    montoSolicitado: 0,
    valorPropiedad: 0,
    pieDisponible: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [direccionTransicion, setDireccionTransicion] = useState<"adelante" | "atras">("adelante");

  useEffect(() => {
    if (lead) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        edad: 0,
        email: "",
        telefono: "",
        situacionLaboral: "DEPENDIENTE",
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
        montoSolicitado: 0,
        valorPropiedad: 0,
        pieDisponible: 0,
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

  const irAPaso = useCallback((nuevoPaso: number) => {
    if (nuevoPaso > paso) {
      if (paso === 1 && !validatePaso1()) return;
      setDireccionTransicion("adelante");
    } else {
      setDireccionTransicion("atras");
    }
    setPaso(nuevoPaso);
  }, [paso]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
        {/* Header con gradiente */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-bold text-white">
                {lead ? "Editar Lead" : "Nuevo Lead"}
              </SheetTitle>
              <SheetDescription className="text-[11px] text-blue-100 mt-0.5">
                {lead ? "Modifica la información del lead" : "Completa los datos del formulario web"}
              </SheetDescription>
            </div>
            <button onClick={() => onOpenChange(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X size={18} className="text-white/70" />
            </button>
          </div>

          {/* Progress Steps mejorados */}
          <div className="flex items-center gap-1 mt-4">
            {PASOS_CONFIG.map((p, idx) => (
              <div key={p.id} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => irAPaso(p.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-semibold transition-all flex-1 ${
                    paso === p.id
                      ? "bg-white text-blue-700 shadow-lg"
                      : paso > p.id
                      ? "bg-white/20 text-white"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {paso > p.id ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      paso === p.id ? "bg-blue-600 text-white" : "bg-white/20 text-white/70"
                    }`}>
                      {p.id}
                    </span>
                  )}
                  <span className="hidden sm:inline">{p.label}</span>
                </button>
                {idx < 2 && (
                  <div className={`w-4 h-0.5 mx-1 rounded-full transition-colors ${
                    paso > p.id ? "bg-white/40" : "bg-white/10"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {/* Paso 1: Datos Personales */}
          {paso === 1 && (
            <div className="space-y-5" key="paso1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <User size={18} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Datos Personales</h4>
                  <p className="text-[10px] text-slate-400">Información del formulario web</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <User size={11} className="text-slate-400" /> Nombre *
                  </Label>
                  <div className="relative">
                    <Input
                      value={formData.nombre || ""}
                      onChange={(e) => updateField("nombre", e.target.value)}
                      placeholder="Jorge"
                      className={`h-11 pl-3 pr-8 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 ${
                        errors.nombre ? "border-red-400 bg-red-50/50" : formData.nombre ? "border-emerald-200 bg-emerald-50/30" : ""
                      }`}
                    />
                    {formData.nombre && !errors.nombre && (
                      <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                    )}
                  </div>
                  {errors.nombre && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {errors.nombre}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <User size={11} className="text-slate-400" /> Apellido *
                  </Label>
                  <div className="relative">
                    <Input
                      value={formData.apellido || ""}
                      onChange={(e) => updateField("apellido", e.target.value)}
                      placeholder="Naranjo"
                      className={`h-11 pl-3 pr-8 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 ${
                        errors.apellido ? "border-red-400 bg-red-50/50" : formData.apellido ? "border-emerald-200 bg-emerald-50/30" : ""
                      }`}
                    />
                    {formData.apellido && !errors.apellido && (
                      <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                    )}
                  </div>
                  {errors.apellido && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {errors.apellido}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Hash size={11} className="text-slate-400" /> RUT *
                </Label>
                <div className="relative">
                  <Input
                    value={formData.rut || ""}
                    onChange={(e) => updateField("rut", formatRUT(e.target.value))}
                    placeholder="12.679.334-3"
                    maxLength={12}
                    className={`h-11 pl-3 pr-8 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 font-mono tracking-wide ${
                      errors.rut ? "border-red-400 bg-red-50/50" : formData.rut && validateRUT(formData.rut) ? "border-emerald-200 bg-emerald-50/30" : ""
                    }`}
                  />
                  {formData.rut && (
                    validateRUT(formData.rut)
                      ? <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                      : <AlertCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500" />
                  )}
                </div>
                {errors.rut && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {errors.rut}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar size={11} className="text-slate-400" /> Edad
                  </Label>
                  <Input
                    type="number"
                    value={formData.edad || ""}
                    onChange={(e) => updateField("edad", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="33"
                    min={18}
                    max={99}
                    className="h-11 pl-3 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Phone size={11} className="text-slate-400" /> Teléfono
                  </Label>
                  <Input
                    value={formData.telefono || ""}
                    onChange={(e) => updateField("telefono", formatPhone(e.target.value))}
                    placeholder="+56 9 6684 2168"
                    className="h-11 pl-3 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Mail size={11} className="text-slate-400" /> Correo Electrónico
                </Label>
                <div className="relative">
                  <Input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className={`h-11 pl-3 pr-8 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 ${
                      errors.email ? "border-red-400 bg-red-50/50" : formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? "border-emerald-200 bg-emerald-50/30" : ""
                    }`}
                  />
                  {formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                    <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                  )}
                </div>
                {errors.email && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {errors.email}</p>}
              </div>
            </div>
          )}

          {/* Paso 2: Situación Laboral y Financiera */}
          {paso === 2 && (
            <div className="space-y-5" key="paso2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Briefcase size={18} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Situación Laboral</h4>
                  <p className="text-[10px] text-slate-400">Información del formulario web</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Briefcase size={11} className="text-slate-400" /> Situación laboral *
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateField("situacionLaboral", "DEPENDIENTE")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.situacionLaboral === "DEPENDIENTE"
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">👔</div>
                    <div className="text-[11px] font-bold text-slate-800">Dependiente</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Trabaja para una empresa</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("situacionLaboral", "INDEPENDIENTE")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.situacionLaboral === "INDEPENDIENTE"
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">💼</div>
                    <div className="text-[11px] font-bold text-slate-800">Independiente</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Trabaja por cuenta propia</div>
                  </button>
                </div>
              </div>

              {/* DICOM como toggle */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Shield size={11} className="text-slate-400" /> ¿Estás en DICOM? *
                </Label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <button
                    type="button"
                    onClick={() => updateField("enDicom", !formData.enDicom)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      formData.enDicom ? "bg-red-500" : "bg-slate-300"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      formData.enDicom ? "translate-x-[22px]" : "translate-x-0.5"
                    }`} />
                  </button>
                  <span className="text-[11px] font-medium text-slate-700">
                    {formData.enDicom ? (
                      <span className="text-red-600">Sí, estoy en DICOM</span>
                    ) : (
                      "No estoy en DICOM"
                    )}
                  </span>
                </div>
              </div>

              {formData.enDicom && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1">
                  <Label className="text-[11px] font-semibold text-slate-700">¿Corresponde a?</Label>
                  <Input
                    value={formData.dicomDetalle || ""}
                    onChange={(e) => updateField("dicomDetalle", e.target.value)}
                    placeholder="Describe el motivo del DICOM"
                    className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <DollarSign size={11} className="text-slate-400" /> Renta mensual *
                </Label>
                <Select value={formData.rentaMensual || ""} onValueChange={(v) => updateField("rentaMensual", v)}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                    <SelectValue placeholder="Seleccionar rango de renta" />
                  </SelectTrigger>
                  <SelectContent>
                    {RENTAS_MENSUALES.map((renta) => (
                      <SelectItem key={renta} value={renta}>{renta}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Complementar renta como toggle */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700">¿Deseas complementar renta?</Label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <button
                    type="button"
                    onClick={() => updateField("complementarRenta", !formData.complementarRenta)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      formData.complementarRenta ? "bg-blue-500" : "bg-slate-300"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      formData.complementarRenta ? "translate-x-[22px]" : "translate-x-0.5"
                    }`} />
                  </button>
                  <span className="text-[11px] font-medium text-slate-700">
                    {formData.complementarRenta ? "Sí, deseo complementar" : "No, solo mi renta principal"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Tipo de Crédito */}
          {paso === 3 && (
            <div className="space-y-5" key="paso3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <DollarSign size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Tipo de Crédito</h4>
                  <p className="text-[10px] text-slate-400">Información del formulario web</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <TrendingUp size={11} className="text-slate-400" /> Tipo de crédito *
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {TIPOS_CREDITO.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => updateField("tipoCredito", tipo)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        formData.tipoCredito === tipo
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-[11px] font-bold text-slate-800">{tipo}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pie como toggle */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <PieChart size={11} className="text-slate-400" /> ¿Cuentas con pie o ahorro inicial? *
                </Label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <button
                    type="button"
                    onClick={() => updateField("cuentaPie", !formData.cuentaPie)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      formData.cuentaPie ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      formData.cuentaPie ? "translate-x-[22px]" : "translate-x-0.5"
                    }`} />
                  </button>
                  <span className="text-[11px] font-medium text-slate-700">
                    {formData.cuentaPie ? "Sí, cuento con pie" : "No, necesito financiar el pie"}
                  </span>
                </div>
              </div>

              {/* Datos internos CRM */}
              <div className="pt-4 mt-4 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Building2 size={18} className="text-slate-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Datos CRM</h4>
                    <p className="text-[10px] text-slate-400">Información adicional del sistema</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <Building2 size={11} className="text-slate-400" /> Banco
                    </Label>
                    <Select value={formData.banco} onValueChange={(v) => updateField("banco", v)}>
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANCOS.map((banco) => (
                          <SelectItem key={banco} value={banco}>{banco}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <UserCheck size={11} className="text-slate-400" /> Ejecutivo
                    </Label>
                    <Select value={formData.nombreEjecutivo || ""} onValueChange={(v) => updateField("nombreEjecutivo", v)}>
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
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

                <div className="space-y-1.5 mt-4">
                  <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <MessageSquare size={11} className="text-slate-400" /> Comentarios
                  </Label>
                  <textarea
                    value={formData.comentarios || ""}
                    onChange={(e) => updateField("comentarios", e.target.value)}
                    placeholder="Notas adicionales sobre el lead..."
                    rows={3}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
            {paso > 1 ? (
              <button type="button" onClick={() => irAPaso(paso - 1)} className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
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
                onClick={() => irAPaso(paso + 1)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
              >
                Siguiente <ChevronRight size={14} />
              </button>
            ) : (
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[11px] font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">
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
