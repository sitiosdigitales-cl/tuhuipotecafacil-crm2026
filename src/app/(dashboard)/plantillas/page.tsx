"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Mail,
  MessageSquare,
  Smartphone,
  Plus,
  Search,
  Edit,
  Eye,
  Copy,
  Trash2,
  Upload,
  CheckCircle,
  Clock,
  GitBranch,
  Tag,
  User,
  Variable,
  Image,
  Signature,
  Palette,
  Layout,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Code,
  Quote,
  Minus,
  ChevronDown,
  ChevronRight,
  X,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Download,
  Printer,
} from "lucide-react";

// Variables disponibles para plantillas
const VARIABLES = [
  { variable: "{{nombre}}", descripcion: "Nombre del lead/cliente", ejemplo: "María González", categoria: "cliente" },
  { variable: "{{apellido}}", descripcion: "Apellido del lead/cliente", ejemplo: "González", categoria: "cliente" },
  { variable: "{{rut}}", descripcion: "RUT del lead/cliente", ejemplo: "15.234.567-8", categoria: "cliente" },
  { variable: "{{email}}", descripcion: "Email del lead/cliente", ejemplo: "maria@email.com", categoria: "cliente" },
  { variable: "{{telefono}}", descripcion: "Teléfono del lead/cliente", ejemplo: "+56 9 1234 5678", categoria: "cliente" },
  { variable: "{{monto_credito}}", descripcion: "Monto del crédito solicitado", ejemplo: "$ 150.000.000", categoria: "credito" },
  { variable: "{{monto_uf}}", descripcion: "Monto en UF", ejemplo: "3.849,87 UF", categoria: "credito" },
  { variable: "{{banco}}", descripcion: "Banco asignado", ejemplo: "Banco Estado", categoria: "credito" },
  { variable: "{{tipo_credito}}", descripcion: "Tipo de crédito", ejemplo: "Hipotecario", categoria: "credito" },
  { variable: "{{etapa}}", descripcion: "Etapa actual del lead", ejemplo: "Evaluación Bancaria", categoria: "sistema" },
  { variable: "{{ejecutivo}}", descripcion: "Nombre del ejecutivo", ejemplo: "Andrés Pérez", categoria: "equipo" },
  { variable: "{{telefono_ejecutivo}}", descripcion: "Teléfono del ejecutivo", ejemplo: "+56 9 1234 5678", categoria: "equipo" },
  { variable: "{{empresa}}", descripcion: "Nombre de la empresa", ejemplo: "TuHipotecaFacil", categoria: "sistema" },
  { variable: "{{fecha}}", descripcion: "Fecha actual", ejemplo: "03 Julio 2026", categoria: "sistema" },
  { variable: "{{hora}}", descripcion: "Hora actual", ejemplo: "10:30 AM", categoria: "sistema" },
  { variable: "{{logo_empresa}}", descripcion: "Logo de la empresa (imagen)", ejemplo: "[Logo]", categoria: "imagen" },
  { variable: "{{firma_ejecutivo}}", descripcion: "Firma del ejecutivo (imagen)", ejemplo: "[Firma]", categoria: "imagen" },
  { variable: "{{firma_empresa}}", descripcion: "Firma oficial de la empresa", ejemplo: "[Firma]", categoria: "imagen" },
  { variable: "{{banner}}", descripcion: "Banner promocional (imagen)", ejemplo: "[Banner]", categoria: "imagen" },
  { variable: "{{qr_code}}", descripcion: "Código QR personalizado", ejemplo: "[QR]", categoria: "imagen" },
];

// Imágenes de ejemplo
const IMAGENES_EJEMPLO = [
  { id: "img1", nombre: "Logo TuHipotecaFacil", tipo: "logo", url: "/logo-empresa.png", preview: "https://via.placeholder.com/150x50/3B82F6/FFFFFF?text=TuHipotecaFacil" },
  { id: "img2", nombre: "Firma Andrés Pérez", tipo: "firma", url: "/firma-andres.png", preview: "https://via.placeholder.com/150x50/8B5CF6/FFFFFF?text=Firma+Andrés" },
  { id: "img3", nombre: "Banner Black Friday", tipo: "banner", url: "/banner-bf.png", preview: "https://via.placeholder.com/300x100/EF4444/FFFFFF?text=Black+Friday" },
  { id: "img4", nombre: "Logo Banco Estado", tipo: "logo", url: "/banco-estado.png", preview: "https://via.placeholder.com/150x50/003DA5/FFFFFF?text=Banco+Estado" },
  { id: "img5", nombre: "Firma Carolina Muñoz", tipo: "firma", url: "/firma-carolina.png", preview: "https://via.placeholder.com/150x50/10B981/FFFFFF?text=Firma+Carolina" },
  { id: "img6", nombre: "Ícono WhatsApp", tipo: "icono", url: "/whatsapp.png", preview: "https://via.placeholder.com/50x50/25D366/FFFFFF?text=WA" },
];

// Plantillas mock mejoradas
const PLANTILLAS_MOCK = [
  {
    id: "p1",
    nombre: "Bienvenida Nuevo Lead",
    tipo: "EMAIL",
    categoria: "BIEVENIDA",
    asunto: "¡Bienvenido a TuHipotecaFacil, {{nombre}}!",
    contenido: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #3B82F6, #8B5CF6); border-radius: 10px 10px 0 0;">
    {{logo_empresa}}
    <h1 style="margin: 10px 0 5px; font-size: 24px;">¡Bienvenido!</h1>
    <p style="margin: 0; opacity: 0.9;">TuHipotecaFacil</p>
  </div>
  
  <div style="padding: 30px; background: #fff;">
    <p style="font-size: 16px; color: #333;">Estimado/a <strong>{{nombre}} {{apellido}}</strong>,</p>
    
    <p style="font-size: 14px; color: #555; line-height: 1.6;">
      ¡Gracias por contactarnos! Soy <strong>{{ejecutivo}}</strong>, tu asesor hipotecario en TuHipotecaFacil.
    </p>
    
    <div style="background: #f8fafc; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px; color: #333;">
        <strong>Tu solicitud:</strong><br>
        • Crédito: {{tipo_credito}}<br>
        • Monto: {{monto_credito}}<br>
        • Banco: {{banco}}
      </p>
    </div>
    
    <p style="font-size: 14px; color: #555; line-height: 1.6;">
      En los próximos días nos pondremos en contacto contigo para avanzar con el proceso.
    </p>
    
    <div style="margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">
      {{firma_ejecutivo}}
      <p style="margin: 10px 0 0; font-size: 14px; color: #333;"><strong>{{ejecutivo}}</strong></p>
      <p style="margin: 2px 0 0; font-size: 12px; color: #666;">Asesor Hipotecario</p>
      <p style="margin: 2px 0 0; font-size: 12px; color: #666;">{{telefono_ejecutivo}}</p>
    </div>
  </div>
  
  <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 0 0 10px 10px; border-top: 1px solid #e2e8f0;">
    {{logo_empresa}}
    <p style="margin: 5px 0 0; font-size: 11px; color: #94a3b8;">
      © 2026 TuHipotecaFacil.cl - Todos los derechos reservados
    </p>
  </div>
</div>`,
    activa: true,
    uso: 1247,
    creadoEn: new Date(2026, 5, 4),
    flujos: ["Bienvenida Nuevo Lead"],
    imagenes: ["img1", "img2"],
  },
  {
    id: "p2",
    nombre: "Recordatorio Documentos Pendientes",
    tipo: "EMAIL",
    categoria: "SEGUIMIENTO",
    asunto: "Recordatorio: Documentos pendientes - {{nombre}} {{apellido}}",
    contenido: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="padding: 20px; background: #fff; border-radius: 10px;">
    {{logo_empresa}}
    
    <h2 style="color: #1e293b; margin: 20px 0 10px;">Documentos Pendientes</h2>
    
    <p style="font-size: 14px; color: #555;">Estimado/a <strong>{{nombre}}</strong>,</p>
    
    <p style="font-size: 14px; color: #555; line-height: 1.6;">
      Te recordamos que aún tenemos documentos pendientes para avanzar con tu solicitud de crédito:
    </p>
    
    <div style="margin: 20px 0;">
      <div style="display: flex; align-items: center; padding: 12px; background: #fef3c7; border-radius: 8px; margin-bottom: 8px;">
        <span style="margin-right: 10px;">📋</span>
        <span style="font-size: 14px; color: #92400e;">Certificado de AFP</span>
      </div>
      <div style="display: flex; align-items: center; padding: 12px; background: #fef3c7; border-radius: 8px; margin-bottom: 8px;">
        <span style="margin-right: 10px;">📄</span>
        <span style="font-size: 14px; color: #92400e;">Comprobante de domicilio</span>
      </div>
      <div style="display: flex; align-items: center; padding: 12px; background: #fef3c7; border-radius: 8px;">
        <span style="margin-right: 10px;">📊</span>
        <span style="font-size: 14px; color: #92400e;">Última declaración de renta</span>
      </div>
    </div>
    
    <p style="font-size: 14px; color: #555; line-height: 1.6;">
      Por favor, envíalos a la brevedad para poder continuar con el proceso.
    </p>
    
    <div style="margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">
      {{firma_ejecutivo}}
      <p style="margin: 10px 0 0; font-size: 14px; color: #333;"><strong>{{ejecutivo}}</strong></p>
      <p style="margin: 2px 0 0; font-size: 12px; color: #666;">{{telefono_ejecutivo}}</p>
    </div>
  </div>
</div>`,
    activa: true,
    uso: 856,
    creadoEn: new Date(2026, 5, 9),
    flujos: ["Recordatorio Documentos Pendientes"],
    imagenes: ["img1", "img2"],
  },
  {
    id: "p5",
    nombre: "Saludo WhatsApp",
    tipo: "WHATSAPP",
    categoria: "BIEVENIDA",
    contenido: `Hola {{nombre}} 👋

Soy {{ejecutivo}} de TuHipotecaFacil.

Vi que estuviste interesado en un crédito {{tipo_credito}}. ¿Tienes alguna consulta?

Estoy aquí para ayudarte. 🏠

{{logo_empresa}}`,
    activa: true,
    uso: 2156,
    creadoEn: new Date(2026, 5, 6),
    flujos: ["Bienvenida Nuevo Lead", "Seguimiento Post Llamada"],
    imagenes: ["img1", "img6"],
  },
  {
    id: "p9",
    nombre: "Contrato Promesa Compraventa",
    tipo: "DOCUMENTO",
    categoria: "LEGAL",
    descripcion: "Modelo de contrato de promesa de compraventa para crédito hipotecario",
    contenido: `<div style="font-family: 'Times New Roman', serif; max-width: 700px; margin: 0 auto; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px;">
    {{logo_empresa}}
    <h1 style="font-size: 18px; margin: 15px 0 5px; color: #1e293b;">CONTRATO DE PROMESA DE COMPRAVENTA</h1>
    <p style="font-size: 12px; color: #64748b;">Crédito Hipotecario</p>
  </div>
  
  <div style="font-size: 12px; line-height: 1.8; color: #334155;">
    <p>En la ciudad de Santiago, a los ___ días del mes de ___ de 2026,</p>
    
    <p><strong>ENTRE:</strong></p>
    
    <p><strong>EL/LA COMPRADOR(A):</strong><br>
    Nombre: {{nombre}} {{apellido}}<br>
    RUT: {{rut}}<br>
    Email: {{email}}<br>
    Teléfono: {{telefono}}</p>
    
    <p><strong>EL/LA VENDEDOR(A):</strong><br>
    [Datos del vendedor]</p>
    
    <p><strong>PRECIO DE VENTA:</strong> {{monto_credito}}</p>
    
    <p><strong>PROPIEDAD:</strong> [Dirección de la propiedad]</p>
    
    <div style="margin: 30px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <p style="font-size: 11px; color: #64748b; text-align: center;">
        Firmas de las partes
      </p>
      <div style="display: flex; justify-content: space-between; margin-top: 20px;">
        <div style="text-align: center;">
          {{firma_empresa}}
          <p style="font-size: 10px; color: #64748b; margin-top: 5px;">Comprador(a)</p>
          <p style="font-size: 10px; color: #334155;">{{nombre}} {{apellido}}</p>
        </div>
        <div style="text-align: center;">
          {{firma_empresa}}
          <p style="font-size: 10px; color: #64748b; margin-top: 5px;">Vendedor(a)</p>
          <p style="font-size: 10px; color: #334155;">[Nombre Vendedor]</p>
        </div>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      {{firma_empresa}}
      <p style="font-size: 10px; color: #94a3b8; margin-top: 10px;">
        TuHipotecaFacil.cl - {{empresa}}
      </p>
    </div>
  </div>
</div>`,
    activa: true,
    uso: 156,
    creadoEn: new Date(2026, 4, 5),
    flujos: [],
    imagenes: ["img1"],
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string; icono: any }> = {
  EMAIL: { label: "Email", color: "text-blue-600", bg: "bg-blue-50", icono: Mail },
  WHATSAPP: { label: "WhatsApp", color: "text-green-600", bg: "bg-green-50", icono: MessageSquare },
  SMS: { label: "SMS", color: "text-purple-600", bg: "bg-purple-50", icono: Smartphone },
  DOCUMENTO: { label: "Documento", color: "text-amber-600", bg: "bg-amber-50", icono: FileText },
};

const CATEGORIA_CONFIG: Record<string, { label: string; color: string }> = {
  BIEVENIDA: { label: "Bienvenida", color: "text-emerald-600" },
  SEGUIMIENTO: { label: "Seguimiento", color: "text-blue-600" },
  APROBACION: { label: "Aprobación", color: "text-purple-600" },
  LEGAL: { label: "Legal", color: "text-red-600" },
  CREDITO: { label: "Crédito", color: "text-amber-600" },
};

type TabPlantilla = "todas" | "email" | "whatsapp" | "sms" | "documento";

export default function PlantillasPage() {
  const [tabActiva, setTabActiva] = useState<TabPlantilla>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState<string | null>(null);
  const [modalDetalle, setModalDetalle] = useState<string | null>(null);
  const [modalPreview, setModalPreview] = useState<string | null>(null);
  const [modalVariables, setModalVariables] = useState(false);
  const [modalImagenes, setModalImagenes] = useState(false);
  const [plantillas, setPlantillas] = useState(PLANTILLAS_MOCK);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);

  const plantillasFiltradas = useMemo(() => {
    return plantillas.filter((p) => {
      const coincideTab =
        tabActiva === "todas" ||
        (tabActiva === "email" && p.tipo === "EMAIL") ||
        (tabActiva === "whatsapp" && p.tipo === "WHATSAPP") ||
        (tabActiva === "sms" && p.tipo === "SMS") ||
        (tabActiva === "documento" && p.tipo === "DOCUMENTO");
      const coincideBusqueda =
        !busqueda ||
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      return coincideTab && coincideBusqueda;
    });
  }, [tabActiva, busqueda, plantillas]);

  const plantillaEditar = plantillas.find((p) => p.id === modalEditar);
  const plantillaPreview = plantillas.find((p) => p.id === modalPreview);

  const stats = useMemo(() => ({
    total: plantillas.length,
    email: plantillas.filter((p) => p.tipo === "EMAIL").length,
    whatsapp: plantillas.filter((p) => p.tipo === "WHATSAPP").length,
    sms: plantillas.filter((p) => p.tipo === "SMS").length,
    documento: plantillas.filter((p) => p.tipo === "DOCUMENTO").length,
    activas: plantillas.filter((p) => p.activa).length,
    usoTotal: plantillas.reduce((sum, p) => sum + p.uso, 0),
  }), [plantillas]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Plantillas
            </h1>
            <p className="text-emerald-200 text-[11px] font-medium">
              Emails, mensajes y documentos reutilizables con imágenes y firmas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-[10px] text-emerald-200">Total</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-300">{stats.activas}</div>
              <div className="text-[10px] text-emerald-200">Activas</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-300">{stats.usoTotal.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-200">Usos totales</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Mail size={18} className="text-blue-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Emails</span>
          </div>
          <div className="text-xl font-bold text-blue-600">{stats.email}</div>
          <div className="text-[10px] text-slate-400 mt-1">plantillas</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <MessageSquare size={18} className="text-green-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">WhatsApp</span>
          </div>
          <div className="text-xl font-bold text-green-600">{stats.whatsapp}</div>
          <div className="text-[10px] text-slate-400 mt-1">plantillas</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Smartphone size={18} className="text-purple-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">SMS</span>
          </div>
          <div className="text-xl font-bold text-purple-600">{stats.sms}</div>
          <div className="text-[10px] text-slate-400 mt-1">plantillas</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-amber-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Documentos</span>
          </div>
          <div className="text-xl font-bold text-amber-600">{stats.documento}</div>
          <div className="text-[10px] text-slate-400 mt-1">plantillas</div>
        </div>
      </div>

      {/* Variables e Imágenes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Variables */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Variable size={16} className="text-violet-500" />
              Variables Disponibles
            </h3>
            <button
              onClick={() => setModalVariables(!modalVariables)}
              className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              {modalVariables ? "Ocultar" : "Ver todas"}
              {modalVariables ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {VARIABLES.slice(0, modalVariables ? VARIABLES.length : 8).map((v) => (
              <div
                key={v.variable}
                className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200/60 cursor-pointer hover:bg-violet-50 hover:border-violet-200 transition-colors"
                onClick={() => navigator.clipboard.writeText(v.variable)}
                title={`Clic para copiar: ${v.ejemplo}`}
              >
                <span className="text-[11px] font-mono font-semibold text-violet-600">{v.variable}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Imágenes */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Image size={16} className="text-blue-500" />
              Imágenes y Firmas
            </h3>
            <button
              onClick={() => setModalImagenes(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-semibold hover:bg-blue-200 transition-colors"
            >
              <Upload size={12} /> Subir
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {IMAGENES_EJEMPLO.map((img) => (
              <div
                key={img.id}
                className="flex-shrink-0 w-24 cursor-pointer group"
                onClick={() => navigator.clipboard.writeText(`{{${img.tipo === "logo" ? "logo_empresa" : img.tipo === "firma" ? "firma_ejecutivo" : "banner"}}}`)}
              >
                <div className="w-24 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group-hover:border-blue-300 transition-colors">
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                    {img.tipo === "logo" ? "🏢 Logo" : img.tipo === "firma" ? "✍️ Firma" : "🖼️ Banner"}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 truncate text-center">{img.nombre}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros y Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {[
              { id: "todas", label: "Todas", count: stats.total },
              { id: "email", label: "Email", count: stats.email, icono: Mail },
              { id: "whatsapp", label: "WhatsApp", count: stats.whatsapp, icono: MessageSquare },
              { id: "sms", label: "SMS", count: stats.sms, icono: Smartphone },
              { id: "documento", label: "Documentos", count: stats.documento, icono: FileText },
            ].map((tab) => {
              const IconoTab = tab.icono;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabActiva(tab.id as TabPlantilla)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                    tabActiva === tab.id
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {IconoTab && <IconoTab size={12} />}
                  {tab.label}
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    tabActiva === tab.id ? "bg-white/20" : "bg-slate-200"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar plantilla..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-48 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all"
              />
            </div>
            <button
              onClick={() => setModalCrear(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[11px] font-semibold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20"
            >
              <Plus size={14} /> Nueva Plantilla
            </button>
          </div>
        </div>
      </div>

      {/* Lista de plantillas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plantillasFiltradas.map((plantilla) => {
          const configTipo = TIPO_CONFIG[plantilla.tipo];
          const configCategoria = CATEGORIA_CONFIG[plantilla.categoria];
          const IconoTipo = configTipo?.icono;

          return (
            <div
              key={plantilla.id}
              className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft hover:shadow-md transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${configTipo?.bg} rounded-xl flex items-center justify-center`}>
                    {IconoTipo && <IconoTipo size={16} className={configTipo?.color} />}
                  </div>
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-800">{plantilla.nombre}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[11px] font-semibold ${configCategoria?.color}`}>
                        {configCategoria?.label}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${configTipo?.bg} ${configTipo?.color}`}>
                        {configTipo?.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {plantilla.imagenes && plantilla.imagenes.length > 0 && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
                      🖼️ {plantilla.imagenes.length}
                    </span>
                  )}
                  <div className={`w-2 h-2 rounded-full ${plantilla.activa ? "bg-emerald-500" : "bg-slate-300"}`} />
                </div>
              </div>

              {/* Preview del contenido */}
              <div className="bg-slate-50 rounded-xl p-3 mb-3 max-h-24 overflow-hidden">
                <pre className="text-[11px] text-slate-500 whitespace-pre-wrap font-sans line-clamp-4">
                  {plantilla.asunto && (
                    <span className="font-semibold text-slate-600">Asunto: {plantilla.asunto}</span>
                  )}
                  {plantilla.asunto && "\n\n"}
                  {plantilla.contenido.replace(/<[^>]*>/g, "").substring(0, 200)}...
                </pre>
              </div>

              {/* Variables usadas */}
              <div className="flex flex-wrap gap-1 mb-3">
                {plantilla.tipo !== "DOCUMENTO" && (
                  <>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded">
                      {"{{nombre}}"}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                      {"{{logo_empresa}}"}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">
                      {"{{firma_ejecutivo}}"}
                    </span>
                  </>
                )}
              </div>

              {/* Flujos asociados */}
              {plantilla.flujos.length > 0 && (
                <div className="flex items-center gap-1.5 mb-3">
                  <GitBranch size={10} className="text-emerald-500" />
                  <span className="text-[11px] text-slate-400">
                    {plantilla.flujos.length} flujo{plantilla.flujos.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Usado {plantilla.uso.toLocaleString()} veces</span>
                  <span>•</span>
                  <span>{plantilla.creadoEn.toLocaleDateString("es-CL")}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setModalPreview(plantilla.id)}
                    className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Vista previa"
                  >
                    <Eye size={12} className="text-blue-500" />
                  </button>
                  <button
                    onClick={() => setModalEditar(plantilla.id)}
                    className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit size={12} className="text-emerald-500" />
                  </button>
                  <button
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Copiar"
                  >
                    <Copy size={12} className="text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Preview */}
      {plantillaPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${TIPO_CONFIG[plantillaPreview.tipo]?.bg} rounded-xl flex items-center justify-center`}>
                    {TIPO_CONFIG[plantillaPreview.tipo]?.icono && (
                      <span className={TIPO_CONFIG[plantillaPreview.tipo]?.color}>
                        {TIPO_CONFIG[plantillaPreview.tipo]?.icono({ size: 16 })}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{plantillaPreview.nombre}</h3>
                    <p className="text-[11px] text-slate-400">Vista previa con datos de ejemplo</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalPreview(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <PreviewPlantilla plantilla={plantillaPreview} />
            </div>
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setModalPreview(null)}
                className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cerrar
              </button>
              <button className="px-4 py-2 bg-emerald-500 text-white text-[11px] font-semibold rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-1.5">
                <Copy size={14} /> Copiar Plantilla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {plantillaEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Edit size={18} className="text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Editar Plantilla</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Modifica el contenido y configuración</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalEditar(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Toolbar del editor */}
              <div className="flex items-center gap-1 p-2 bg-slate-50 rounded-xl mb-4 border border-slate-200/60">
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Negrita">
                  <Bold size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Cursiva">
                  <Italic size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Subrayado">
                  <Underline size={14} className="text-slate-600" />
                </button>
                <div className="w-px h-6 bg-slate-300 mx-1" />
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Alinear izquierda">
                  <AlignLeft size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Centrar">
                  <AlignCenter size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Alinear derecha">
                  <AlignRight size={14} className="text-slate-600" />
                </button>
                <div className="w-px h-6 bg-slate-300 mx-1" />
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Lista">
                  <List size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Lista numerada">
                  <ListOrdered size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Enlace">
                  <Link size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Código">
                  <Code size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Cita">
                  <Quote size={14} className="text-slate-600" />
                </button>
                <div className="w-px h-6 bg-slate-300 mx-1" />
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Insertar imagen">
                  <Image size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Insertar firma">
                  <Signature size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Insertar variable">
                  <Variable size={14} className="text-violet-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Nombre *</label>
                  <input
                    type="text"
                    defaultValue={plantillaEditar.nombre}
                    className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Tipo</label>
                  <select
                    defaultValue={plantillaEditar.tipo}
                    className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-400"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="SMS">SMS</option>
                    <option value="DOCUMENTO">Documento</option>
                  </select>
                </div>
              </div>

              {plantillaEditar.tipo === "EMAIL" && (
                <div className="space-y-1.5 mt-4">
                  <label className="text-[11px] font-semibold text-slate-700">Asunto</label>
                  <input
                    type="text"
                    defaultValue={plantillaEditar.asunto}
                    className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5 mt-4">
                <label className="text-[11px] font-semibold text-slate-700">Contenido *</label>
                <textarea
                  defaultValue={plantillaEditar.contenido}
                  rows={15}
                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-400 resize-none transition-all font-mono"
                />
              </div>

              {/* Imágenes de la plantilla */}
              <div className="mt-4">
                <label className="text-[11px] font-semibold text-slate-700 mb-2 block">Imágenes Asociadas</label>
                <div className="flex gap-2 flex-wrap">
                  {plantillaEditar.imagenes?.map((imgId) => {
                    const img = IMAGENES_EJEMPLO.find((i) => i.id === imgId);
                    return img ? (
                      <div key={imgId} className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                        <Image size={12} className="text-blue-500" />
                        <span className="text-[10px] font-semibold text-blue-700">{img.nombre}</span>
                      </div>
                    ) : null;
                  })}
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-lg border border-dashed border-slate-300 text-[10px] text-slate-500 hover:bg-slate-200 transition-colors">
                    <Plus size={12} /> Agregar imagen
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setPlantillas((prev) => prev.filter((p) => p.id !== modalEditar));
                  setModalEditar(null);
                }}
                className="px-4 py-2 bg-red-50 text-red-600 text-[11px] font-semibold rounded-xl hover:bg-red-100 transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Eliminar
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalEditar(null)}
                  className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setModalEditar(null)}
                  className="px-5 py-2 bg-emerald-500 text-white text-[11px] font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <Save size={14} /> Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear */}
      {modalCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Nueva Plantilla</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Crea una plantilla personalizada con imágenes y firmas
                  </p>
                </div>
                <button
                  onClick={() => setModalCrear(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Toolbar */}
              <div className="flex items-center gap-1 p-2 bg-slate-50 rounded-xl mb-4 border border-slate-200/60">
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Negrita">
                  <Bold size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Cursiva">
                  <Italic size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Subrayado">
                  <Underline size={14} className="text-slate-600" />
                </button>
                <div className="w-px h-6 bg-slate-300 mx-1" />
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Alinear izquierda">
                  <AlignLeft size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Centrar">
                  <AlignCenter size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Alinear derecha">
                  <AlignRight size={14} className="text-slate-600" />
                </button>
                <div className="w-px h-6 bg-slate-300 mx-1" />
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Lista">
                  <List size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Lista numerada">
                  <ListOrdered size={14} className="text-slate-600" />
                </button>
                <div className="w-px h-6 bg-slate-300 mx-1" />
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Insertar imagen">
                  <Image size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Insertar firma">
                  <Signature size={14} className="text-slate-600" />
                </button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors" title="Insertar variable">
                  <Variable size={14} className="text-violet-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Nombre *</label>
                  <input
                    type="text"
                    placeholder="Ej: Bienvenida Nuevo Lead"
                    className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">Tipo</label>
                  <select className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-400">
                    <option value="EMAIL">Email</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="SMS">SMS</option>
                    <option value="DOCUMENTO">Documento</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <label className="text-[11px] font-semibold text-slate-700">Asunto (solo Email)</label>
                <input
                  type="text"
                  placeholder="Usa {{variable}} para personalizar"
                  className="w-full h-10 px-3 bg-white border border-slate-200/60 rounded-xl text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all"
                />
              </div>

              <div className="space-y-1.5 mb-4">
                <label className="text-[11px] font-semibold text-slate-700">Contenido *</label>
                <textarea
                  placeholder="Escribe el contenido de la plantilla. Usa {{variable}} para personalizar."
                  rows={15}
                  className="w-full px-3 py-2 bg-white border border-slate-200/60 rounded-xl text-[11px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-400 resize-none transition-all font-mono"
                />
              </div>

              {/* Imágenes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Imágenes Asociadas</label>
                <div className="flex gap-2 flex-wrap">
                  {IMAGENES_EJEMPLO.slice(0, 4).map((img) => (
                    <div
                      key={img.id}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <Image size={12} className="text-slate-400" />
                      <span className="text-[10px] font-semibold text-slate-600">{img.nombre}</span>
                    </div>
                  ))}
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-lg border border-dashed border-slate-300 text-[10px] text-slate-500 hover:bg-slate-200 transition-colors">
                    <Plus size={12} /> Subir nueva
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setModalCrear(false)}
                className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setModalCrear(false)}
                className="px-5 py-2 bg-emerald-500 text-white text-[11px] font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20"
              >
                Crear Plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para previsualizar plantillas
function PreviewPlantilla({ plantilla }: { plantilla: { nombre: string; contenido: string; tipo: string; asunto?: string } }) {
  const reemplazarVariables = (texto: string) => {
    return texto
      .replace(/\{\{nombre\}\}/g, "María")
      .replace(/\{\{apellido\}\}/g, "González")
      .replace(/\{\{monto_credito\}\}/g, "$ 150.000.000")
      .replace(/\{\{tipo_credito\}\}/g, "Hipotecario")
      .replace(/\{\{ejecutivo\}\}/g, "Andrés Pérez")
      .replace(/\{\{telefono_ejecutivo\}\}/g, "+56 9 1234 5678")
      .replace(/\{\{empresa\}\}/g, "TuHipotecaFacil")
      .replace(/\{\{fecha\}\}/g, "03 Julio 2026")
      .replace(/\{\{banco\}\}/g, "Banco Estado")
      .replace(/\{\{monto_uf\}\}/g, "3.849,87 UF")
      .replace(/\{\{etapa\}\}/g, "Evaluación Bancaria")
      .replace(/\{\{rut\}\}/g, "15.234.567-8")
      .replace(/\{\{email\}\}/g, "maria@email.com")
      .replace(/\{\{telefono\}\}/g, "+56 9 1234 5678")
      .replace(/\{\{monto\}\}/g, "$ 150.000.000")
      .replace(/\{\{logo_empresa\}\}/g, '<div style="text-align:center;padding:10px;background:#3B82F6;border-radius:8px;color:white;font-weight:bold;">TuHipotecaFacil</div>')
      .replace(/\{\{firma_ejecutivo\}\}/g, '<div style="text-align:center;padding:10px;"><div style="font-style:italic;font-size:18px;color:#333;">Andrés Pérez</div><div style="font-size:10px;color:#666;">Firma digital</div></div>')
      .replace(/\{\{firma_empresa\}\}/g, '<div style="text-align:center;padding:10px;border-top:2px solid #333;"><div style="font-style:italic;font-size:16px;color:#333;">TuHipotecaFacil</div><div style="font-size:10px;color:#666;">Representante Legal</div></div>')
      .replace(/\{\{banner\}\}/g, '<div style="background:linear-gradient(135deg,#F59E0B,#EF4444);padding:20px;border-radius:8px;text-align:center;color:white;font-weight:bold;">Oferta Especial Black Friday</div>')
      .replace(/\{\{qr_code\}\}/g, '<div style="text-align:center;padding:15px;background:#f8fafc;border-radius:8px;"><div style="width:80px;height:80px;background:#333;margin:0 auto;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;">QR Code</div><div style="font-size:9px;color:#666;margin-top:5px;">Escanea para más info</div></div>');
  };

  if (plantilla.tipo === "EMAIL") {
    return (
      <div>
        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <div className="text-[10px] text-slate-400 mb-1">Asunto:</div>
          <div className="text-[12px] font-semibold text-slate-700">
            {reemplazarVariables(plantilla.asunto || "")}
          </div>
        </div>
        <div
          className="bg-white border border-slate-200 rounded-xl p-4 overflow-auto max-h-[500px]"
          dangerouslySetInnerHTML={{ __html: reemplazarVariables(plantilla.contenido) }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <pre className="text-[11px] text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
        {reemplazarVariables(plantilla.contenido)}
      </pre>
    </div>
  );
}
