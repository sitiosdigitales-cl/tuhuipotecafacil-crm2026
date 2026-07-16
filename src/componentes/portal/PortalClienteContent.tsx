"use client";

import { useState } from "react";
import {
  Search,
  FileText,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  User,
  Home,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Upload,
  Edit,
  Save,
  Info,
  Bell,
  MapPin,
  Briefcase,
  AlertCircle,
  FileCheck,
  Trash2, X, ChevronDown,
  Download,
} from "lucide-react";
import { useLeads } from "@/modulos/leads";
import { ETAPAS_CONFIG, SITUACION_LABORAL_CONFIG } from "@/tipos";
import { formatoMonedaAbreviado, formatoUF, formatoMoneda } from "@/lib/utils";
import { toast } from "sonner";
import type { Lead, Etapa, SituacionLaboral } from "@/tipos";

const PASOS_PROGRESO = [
  { paso: 1, label: "Registro", etapa: "NUEVO_LEAD" as Etapa },
  { paso: 2, label: "Contacto", etapa: "CONTACTADO" as Etapa },
  { paso: 3, label: "Calificación", etapa: "CALIFICACION_COMERCIAL" as Etapa },
  { paso: 4, label: "Documentación", etapa: "DOCS_COMPLETAS" as Etapa },
  { paso: 5, label: "Evaluación", etapa: "EVALUACION_BANCARIA" as Etapa },
  { paso: 6, label: "Aprobado", etapa: "APROBADO" as Etapa },
];

const DOCUMENTOS_CONFIG = {
  DEPENDIENTE: {
    comun: [
      { id: "cedula", nombre: "Cédula de Identidad por ambos lados (vigente)", obligatorio: true },
      { id: "dicom", nombre: "Certificado de Deudas CMF", obligatorio: true },
      { id: "domicilio", nombre: "Cuenta Casa (luz, agua, gas, internet, celular o cartola AFP)", obligatorio: true },
    ],
    hipotecario: [
      { id: "liq-sueldo", nombre: "6 Últimas Liquidaciones de Sueldo", obligatorio: true },
      { id: "afp", nombre: "Certificado de Cotizaciones AFP (24 meses)", obligatorio: true },
      { id: "anexo-laboral", nombre: "Anexo o Permanencia Laboral", obligatorio: true },
      { id: "titulo", nombre: "Título Universitario o Certificado de Título (si aplica)", obligatorio: false },
    ],
    consumo: [
      { id: "liq-sueldo", nombre: "3 Últimas Liquidaciones de Sueldo", obligatorio: true },
      { id: "afp", nombre: "Certificado de Cotizaciones AFP (12 meses)", obligatorio: true },
    ],
    generales: [
      { id: "liq-sueldo", nombre: "6 Últimas Liquidaciones de Sueldo", obligatorio: true },
      { id: "afp", nombre: "Certificado de Cotizaciones AFP (24 meses)", obligatorio: true },
      { id: "anexo-laboral", nombre: "Anexo o Permanencia Laboral", obligatorio: true },
    ],
    patrimonio: [
      { id: "padron-vehiculo", nombre: "Padrón de Vehículo (para apalancar patrimonio)", obligatorio: false },
      { id: "dominio-propiedad", nombre: "Dominio Vigente de Propiedad (para apalancar patrimonio)", obligatorio: false },
    ],
  },
  INDEPENDIENTE: {
    comun: [
      { id: "cedula", nombre: "Cédula de Identidad por ambos lados (vigente)", obligatorio: true },
      { id: "dicom", nombre: "Certificado de Deudas CMF", obligatorio: true },
      { id: "domicilio", nombre: "Cuenta Casa (luz, agua, gas, internet, celular o cartola AFP)", obligatorio: true },
    ],
    hipotecario: [
      { id: "boletas", nombre: "6 Últimas Boletas con Impuesto", obligatorio: true },
      { id: "resumen-mensual", nombre: "6 Últimos Resúmenes Mensuales de Boletas", obligatorio: true },
      { id: "resumen-anual-2026", nombre: "Resumen Anual de Boletas Año 2026", obligatorio: true },
      { id: "resumen-anual-2025", nombre: "Resumen Anual de Boletas Año 2025", obligatorio: true },
      { id: "renta-2026", nombre: "Declaración de Renta 2026", obligatorio: true },
      { id: "aceptacion-renta-2026", nombre: "Aceptación de Renta 2026", obligatorio: true },
      { id: "cartera-trib", nombre: "Cartera Tributaria Actualizada 36 meses", obligatorio: true },
      { id: "titulo", nombre: "Título Universitario o Certificado de Título (si aplica)", obligatorio: false },
    ],
    consumo: [
      { id: "boletas", nombre: "3 Últimas Boletas con Impuesto", obligatorio: true },
      { id: "resumen-mensual", nombre: "3 Últimos Resúmenes Mensuales de Boletas", obligatorio: true },
      { id: "renta-2026", nombre: "Declaración de Renta 2026", obligatorio: true },
    ],
    generales: [
      { id: "boletas", nombre: "6 Últimas Boletas con Impuesto", obligatorio: true },
      { id: "resumen-mensual", nombre: "6 Últimos Resúmenes Mensuales de Boletas", obligatorio: true },
      { id: "resumen-anual-2026", nombre: "Resumen Anual de Boletas Año 2026", obligatorio: true },
      { id: "renta-2026", nombre: "Declaración de Renta 2026", obligatorio: true },
      { id: "aceptacion-renta-2026", nombre: "Aceptación de Renta 2026", obligatorio: true },
      { id: "cartera-trib", nombre: "Cartera Tributaria Actualizada 36 meses", obligatorio: true },
    ],
    patrimonio: [
      { id: "padron-vehiculo", nombre: "Padrón de Vehículo (para apalancar patrimonio)", obligatorio: false },
      { id: "dominio-propiedad", nombre: "Dominio Vigente de Propiedad (para apalancar patrimonio)", obligatorio: false },
    ],
  },
  EMPRESA: {
    comun: [
      { id: "cedula-socios", nombre: "CI por ambos lados de los socios o dueños", obligatorio: true },
      { id: "dicom", nombre: "Certificado de Deudas CMF", obligatorio: true },
      { id: "rol-empresa", nombre: "Rol Empresa", obligatorio: true },
      { id: "cert-tgr", nombre: "Certificado de Deuda de TGR", obligatorio: true },
    ],
    hipotecario: [
      { id: "cartera-trib-36", nombre: "Cartera Tributaria Actualizada 36 meses", obligatorio: true },
      { id: "cartera-trib-credito", nombre: "Cartera Tributaria para Solicitar Créditos", obligatorio: true },
      { id: "balance-2025", nombre: "Balance 2025 firmado por contador", obligatorio: true },
      { id: "balance-2024", nombre: "Balance 2024 firmado por contador", obligatorio: true },
      { id: "renta-f22-2026", nombre: "Declaración de Renta F22 Compacto 2026", obligatorio: true },
      { id: "renta-f22-2025", nombre: "Declaración de Renta F22 Compacto 2025", obligatorio: true },
      { id: "aceptacion-renta-2026", nombre: "Aceptación de Renta 2026", obligatorio: true },
      { id: "aceptacion-renta-2025", nombre: "Aceptación de Renta 2025", obligatorio: true },
    ],
    consumo: [
      { id: "cartera-trib-36", nombre: "Cartera Tributaria Actualizada 36 meses", obligatorio: true },
      { id: "balance-2025", nombre: "Balance 2025 firmado por contador", obligatorio: true },
      { id: "renta-f22-2026", nombre: "Declaración de Renta F22 Compacto 2026", obligatorio: true },
      { id: "aceptacion-renta-2026", nombre: "Aceptación de Renta 2026", obligatorio: true },
    ],
    generales: [
      { id: "cartera-trib-36", nombre: "Cartera Tributaria Actualizada 36 meses", obligatorio: true },
      { id: "cartera-trib-credito", nombre: "Cartera Tributaria para Solicitar Créditos", obligatorio: true },
      { id: "balance-2025", nombre: "Balance 2025 firmado por contador", obligatorio: true },
      { id: "renta-f22-2026", nombre: "Declaración de Renta F22 Compacto 2026", obligatorio: true },
      { id: "aceptacion-renta-2026", nombre: "Aceptación de Renta 2026", obligatorio: true },
    ],
    patrimonio: [],
  },
};

interface PortalClienteContentProps {
  className?: string;
}

export function PortalClienteContent({ className = "" }: PortalClienteContentProps) {
  const { leads } = useLeads();
  const [rut, setRut] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [cliente, setCliente] = useState<Lead | null>(null);
  const [error, setError] = useState("");
  const [tabActiva, setTabActiva] = useState<"resumen" | "perfil" | "documentos">("resumen");
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [perfilEditado, setPerfilEditado] = useState({
    nombre: "", apellido: "", email: "", telefono: "",
    domicilioParticular: "", comunaCiudad: "",
    estadoCivil: "", fechaNacimiento: "", profesion: "",
    nombreEmpleador: "", cargo: "", rentaLiquida: "",
    situacionLaboral: "" as SituacionLaboral,
    cargasLegales: "", regimenMatrimonial: "", estudios: "", afp: "",
    valorArriendo: "", rutEmpresa: "", fechaIngreso: "",
    bancoAbonoRenta: "", fechaPago: "", direccionLaboral: "",
    comunaCiudadLaboral: "", telefonoLaboralFijo: "", emailLaboral: "",
    otrosIngresos: "",
    patrimonioVehiculo: "", patrimonioVivienda: "", patrimonioOtros: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [documentos, setDocumentos] = useState<{ id: string; nombre: string; estado: string; fecha?: string; tamaño?: number; archivoUrl?: string }[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [mostrarSidebar, setMostrarSidebar] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const [asesor, setAsesor] = useState<{ nombre: string; apellido: string; email: string; telefono: string; cargo: string } | null>(null);

  // Función para cargar datos del asesor
  const cargarAsesor = async (asignadoA: string | undefined, nombreEjecutivo: string | undefined) => {
    if (asignadoA) {
      try {
        const res = await fetch(`/api/usuarios?id=${asignadoA}`);
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          const usuario = data.data[0];
          setAsesor({
            nombre: usuario.nombre || "",
            apellido: usuario.apellido || "",
            email: usuario.email || "",
            telefono: usuario.telefono || "",
            cargo: usuario.cargo || "Asesor Hipotecario Senior",
          });
          return;
        }
      } catch { /* fallback */ }
    }
    if (nombreEjecutivo) {
      try {
        const res = await fetch(`/api/usuarios?busqueda=${encodeURIComponent(nombreEjecutivo)}`);
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          const usuario = data.data.find((u: any) => {
            return `${u.nombre} ${u.apellido}`.toLowerCase().includes(nombreEjecutivo.toLowerCase());
          }) || data.data[0];
          setAsesor({
            nombre: usuario.nombre || "",
            apellido: usuario.apellido || "",
            email: usuario.email || "",
            telefono: usuario.telefono || "",
            cargo: usuario.cargo || "Asesor Hipotecario Senior",
          });
          return;
        }
      } catch { /* fallback */ }
      const partes = nombreEjecutivo.split(' ');
      setAsesor({
        nombre: partes[0] || "",
        apellido: partes.slice(1).join(" ") || "",
        email: "",
        telefono: "",
        cargo: "Asesor Hipotecario Senior",
      });
    }
  };

  
  // Verificar si es la primera vez del cliente
  const verificarPrimeraVez = (clienteData: Lead) => {
    const clave = `portal_welcome_${clienteData.id}`;
    const yaVisto = localStorage.getItem(clave);
    if (!yaVisto) {
      const camposIncompletos = !clienteData.email || !clienteData.telefono || !clienteData.estadoCivil || !clienteData.profesion;
      if (camposIncompletos) {
        setShowWelcome(true);
      }
      localStorage.setItem(clave, "visto");
    }
  };

  const handleBuscar = async () => {
    if (!rut.trim()) { setError("Ingresa un RUT"); return; }
    setBuscando(true); setError("");
    const norm = (r: string) => r.replace(/\./g, "").replace("-", "").replace(/\s/g, "").toLowerCase();
    const rutBuscado = norm(rut);
    const found = leads.find((l) => {
      const rutLead = norm(l.rut);
      return rutLead === rutBuscado || (rutBuscado.length >= 6 && rutLead.includes(rutBuscado));
    });
    if (found) {
      setCliente(found); setError("");
      verificarPrimeraVez(found);
      // Cargar documentos reales del lead
      try {
        const resDocs = await fetch(`/api/documentos?leadId=${found.id}`);
        const dataDocs = await resDocs.json();
        if (dataDocs.success && dataDocs.data) {
          setDocumentos(dataDocs.data.map((d: any) => ({
            id: d.id || d.id,
            nombre: d.nombre || d.nombre,
            estado: d.estado || "PENDIENTE",
            fecha: d.creadoen || d.creadoEn,
            tamaño: d.tamanio || d.tamaño || 0,
          })));
        }
      } catch { /* documentos no disponibles */ }
      // Cargar datos del asesor
      await cargarAsesor(found.asignadoA, found.nombreEjecutivo);
    } else {
      setError("RUT no encontrado"); setCliente(null);
    }
    setBuscando(false);
  };

  const etapaActual = cliente ? PASOS_PROGRESO.findIndex((p) => p.etapa === cliente.etapa) + 1 : 0;
  const totalPasos = PASOS_PROGRESO.length;
  const progreso = Math.max(1, Math.min(etapaActual, totalPasos));
  const pasoActual = PASOS_PROGRESO.find((p) => p.etapa === cliente?.etapa);
  const configEstado = cliente ? ETAPAS_CONFIG[cliente.etapa] : null;
  const docsConfigBase = DOCUMENTOS_CONFIG[cliente?.situacionLaboral || "DEPENDIENTE"];
  
  // Combinar documentos según tipo de crédito
  const tipoCredito = cliente?.tipoCredito || "";
  let docsConfig: { id: string; nombre: string; obligatorio: boolean }[] = docsConfigBase.comun || [];
  
  if (tipoCredito.includes("Hipotecario")) {
    docsConfig = [...docsConfig, ...(docsConfigBase.hipotecario || [])];
  } else if (tipoCredito.includes("Consumo")) {
    docsConfig = [...docsConfig, ...(docsConfigBase.consumo || [])];
  } else if (tipoCredito.includes("Fines") || tipoCredito.includes("General")) {
    docsConfig = [...docsConfig, ...(docsConfigBase.generales || [])];
  } else if (tipoCredito.includes("Empresa") || tipoCredito.includes("Capital")) {
    docsConfig = [...docsConfig, ...(docsConfigBase.generales || [])];
  }
  
  // Agregar documentos de patrimonio siempre
  docsConfig = [...docsConfig, ...(docsConfigBase.patrimonio || [])];
  
  const docsAprobados = documentos.filter(d => d.estado === "APROBADO" || d.estado === "RECIBIDO" || d.estado === "EN_REVISION").length;
  const docsTotal = docsConfig.length;

  const iniciarEdicion = () => {
    if (!cliente) return;
    setPerfilEditado({
      nombre: cliente.nombre, apellido: cliente.apellido,
      email: cliente.email || "", telefono: cliente.telefono || "",
      domicilioParticular: cliente.domicilioParticular || "",
      comunaCiudad: cliente.comunaCiudad || "",
      estadoCivil: cliente.estadoCivil || "",
      fechaNacimiento: cliente.fechaNacimiento || "",
      profesion: cliente.profesion || "",
      nombreEmpleador: cliente.nombreEmpleador || "",
      cargo: cliente.cargo || "",
      rentaLiquida: cliente.rentaLiquida?.toString() || "",
      situacionLaboral: cliente.situacionLaboral || "DEPENDIENTE",
      cargasLegales: cliente.cargasLegales || "",
      regimenMatrimonial: cliente.regimenMatrimonial || "",
      estudios: cliente.estudios || "",
      afp: cliente.afp || "",
      valorArriendo: cliente.valorArriendo?.toString() || "",
      rutEmpresa: cliente.rutEmpresa || "",
      fechaIngreso: cliente.fechaIngreso || "",
      bancoAbonoRenta: cliente.bancoAbonoRenta || "",
      fechaPago: cliente.fechaPago || "",
      direccionLaboral: cliente.direccionLaboral || "",
      comunaCiudadLaboral: cliente.comunaCiudadLaboral || "",
      telefonoLaboralFijo: cliente.telefonoLaboralFijo || "",
      emailLaboral: cliente.emailLaboral || "",
      otrosIngresos: cliente.otrosIngresos || "",
      patrimonioVehiculo: cliente.patrimonioVehiculo || "",
      patrimonioVivienda: cliente.patrimonioVivienda || "",
      patrimonioOtros: cliente.patrimonioOtros || "",
    });
    setEditandoPerfil(true);
  };

  const guardarPerfil = async () => {
    if (!cliente) return;
    setGuardando(true);
    try {
      await fetch(`/api/leads/${cliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: perfilEditado.nombre, apellido: perfilEditado.apellido,
          email: perfilEditado.email, telefono: perfilEditado.telefono,
          domicilioParticular: perfilEditado.domicilioParticular,
          comunaCiudad: perfilEditado.comunaCiudad,
          estadoCivil: perfilEditado.estadoCivil,
          fechaNacimiento: perfilEditado.fechaNacimiento,
          profesion: perfilEditado.profesion,
          nombreEmpleador: perfilEditado.nombreEmpleador,
          cargo: perfilEditado.cargo,
          rentaLiquida: perfilEditado.rentaLiquida ? parseFloat(perfilEditado.rentaLiquida) : undefined,
          situacionLaboral: perfilEditado.situacionLaboral,
          cargasLegales: perfilEditado.cargasLegales,
          regimenMatrimonial: perfilEditado.regimenMatrimonial,
          estudios: perfilEditado.estudios,
          afp: perfilEditado.afp,
          valorArriendo: perfilEditado.valorArriendo ? parseFloat(perfilEditado.valorArriendo) : undefined,
          rutEmpresa: perfilEditado.rutEmpresa,
          fechaIngreso: perfilEditado.fechaIngreso,
          bancoAbonoRenta: perfilEditado.bancoAbonoRenta,
          fechaPago: perfilEditado.fechaPago,
          direccionLaboral: perfilEditado.direccionLaboral,
          comunaCiudadLaboral: perfilEditado.comunaCiudadLaboral,
          telefonoLaboralFijo: perfilEditado.telefonoLaboralFijo,
          emailLaboral: perfilEditado.emailLaboral,
          otrosIngresos: perfilEditado.otrosIngresos,
          patrimonioVehiculo: perfilEditado.patrimonioVehiculo,
          patrimonioVivienda: perfilEditado.patrimonioVivienda,
          patrimonioOtros: perfilEditado.patrimonioOtros,
        }),
      });
      setCliente({
        ...cliente,
        nombre: perfilEditado.nombre,
        apellido: perfilEditado.apellido,
        email: perfilEditado.email,
        telefono: perfilEditado.telefono,
        domicilioParticular: perfilEditado.domicilioParticular,
        comunaCiudad: perfilEditado.comunaCiudad,
        estadoCivil: perfilEditado.estadoCivil,
        fechaNacimiento: perfilEditado.fechaNacimiento,
        profesion: perfilEditado.profesion,
        nombreEmpleador: perfilEditado.nombreEmpleador,
        cargo: perfilEditado.cargo,
        rentaLiquida: perfilEditado.rentaLiquida ? parseFloat(perfilEditado.rentaLiquida) : undefined,
        situacionLaboral: perfilEditado.situacionLaboral,
        cargasLegales: perfilEditado.cargasLegales,
        regimenMatrimonial: perfilEditado.regimenMatrimonial,
        estudios: perfilEditado.estudios,
        afp: perfilEditado.afp,
        valorArriendo: perfilEditado.valorArriendo ? parseFloat(perfilEditado.valorArriendo) : undefined,
        rutEmpresa: perfilEditado.rutEmpresa,
        fechaIngreso: perfilEditado.fechaIngreso,
        bancoAbonoRenta: perfilEditado.bancoAbonoRenta,
        fechaPago: perfilEditado.fechaPago,
        direccionLaboral: perfilEditado.direccionLaboral,
        comunaCiudadLaboral: perfilEditado.comunaCiudadLaboral,
        telefonoLaboralFijo: perfilEditado.telefonoLaboralFijo,
        emailLaboral: perfilEditado.emailLaboral,
        otrosIngresos: perfilEditado.otrosIngresos,
        patrimonioVehiculo: perfilEditado.patrimonioVehiculo,
        patrimonioVivienda: perfilEditado.patrimonioVivienda,
        patrimonioOtros: perfilEditado.patrimonioOtros,
      });
      setEditandoPerfil(false);
      toast.success("Perfil actualizado correctamente");

      // Notificar al ejecutivo
      await notificarEjecutivo(
        "perfil",
        "Perfil actualizado por cliente",
        `${cliente.nombre} ${cliente.apellido} actualizó su información de perfil`
      );
    } catch { toast.error("Error al guardar"); }
    setGuardando(false);
  };

  // Función para notificar al ejecutivo
  const notificarEjecutivo = async (tipo: string, titulo: string, descripcion: string) => {
    if (!cliente?.nombreEjecutivo) return;
    try {
      await fetch("/api/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          titulo,
          descripcion,
          leadId: cliente.id,
          accionUrl: `/clientes/${cliente.id}`,
        }),
      });
    } catch {
      // Silenciar errores de notificación
    }
  };

  // Funciones de documentos
  const subirDocumento = async (file: File, nombreDoc: string) => {
    if (!cliente) return;
    setSubiendo(true);
    const nuevoDoc = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nombre: nombreDoc,
      estado: "subido",
      fecha: new Date().toLocaleDateString("es-CL"),
      tamaño: file.size,
      archivoUrl: URL.createObjectURL(file),
    };
    setDocumentos((prev) => [...prev, nuevoDoc]);
    toast.success("Documento subido", { description: nombreDoc });
    await notificarEjecutivo(
      "documento",
      "Documento subido por cliente",
      `${cliente.nombre} ${cliente.apellido} subió: ${nombreDoc}`
    );
    setSubiendo(false);
  };

  const eliminarDocumento = (id: string) => {
    setDocumentos((prev) => prev.filter((d) => d.id !== id));
    toast.success("Documento eliminado");
  };

  const formatTamano = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Vista de búsqueda
  if (!cliente) {
    return (
      <div className={`min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 rounded-2xl ${className}`}>
        <div className="w-full max-w-md px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-600/25">
              <Home size={36} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Portal del Cliente</h1>
            <p className="text-sm text-slate-500">Consulta el estado de tu solicitud hipotecaria</p>
          </div>
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8">
            <div className="text-center mb-6"><div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><Search size={20} className="text-blue-600" /></div><h2 className="text-sm font-bold text-slate-800">Ingresa tu RUT</h2><p className="text-[11px] text-slate-400 mt-1">El RUT del titular de la solicitud</p></div>
            <div className="space-y-3">
              <input type="text" placeholder="12.345.678-9" value={rut}
                onChange={(e) => { setRut(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                className="w-full h-14 px-4 pr-12 bg-slate-50 border-2 border-slate-200 rounded-2xl text-lg font-mono font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              <button onClick={handleBuscar} disabled={buscando}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {buscando ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={16} />}
                Buscar
              </button>
            </div>
            {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl"><AlertCircle size={16} className="text-red-500 flex-shrink-0" /><p className="text-xs text-red-600 font-medium">{error}</p></div>}

          </div>
        </div>
      </div>
    );
  }

  const situacionConfig = SITUACION_LABORAL_CONFIG[cliente.situacionLaboral];

  return (
    <div className={`space-y-5 ${className}`}>
      
      {/* Modal de Bienvenida */}
      {showWelcome && cliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowWelcome(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fade-in">
            <button onClick={() => setShowWelcome(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={18} className="text-slate-400" />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                <span className="text-2xl">👋</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Bienvenido, {cliente.nombre}</h2>
              <p className="text-sm text-slate-500">Tu solicitud hipotecaria esta en proceso</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Completa tu perfil</p>
                  <p className="text-[11px] text-slate-500">Actualiza tus datos personales y de empleo para agilizar tu solicitud.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={14} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Sube tus documentos</p>
                  <p className="text-[11px] text-slate-500">Revisa la seccion de documentos y sube los requeridos.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={14} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Sigue tu progreso</p>
                  <p className="text-[11px] text-slate-500">En el resumen puedes ver en que etapa va tu credito.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowWelcome(false)}
                className="flex-1 h-11 px-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors">
                Despues
              </button>
              <button onClick={() => { setShowWelcome(false); setTabActiva("perfil"); }}
                className="flex-1 h-11 px-4 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20">
                Completar Perfil
              </button>
            </div>
          </div>
        </div>
      )}

{/* Banner de Bienvenida */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Hola, {cliente.nombre} <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="text-sm text-slate-500 max-w-md">
              Bienvenido a tu portal. Aquí puedes hacer seguimiento de tu solicitud hipotecaria en tiempo real.
            </p>
          </div>
          <div className="hidden md:block w-72 bg-gradient-to-br from-blue-500 via-blue-400 to-blue-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Home size={14} className="text-blue-700" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-800">Tu hogar te espera</div>
                    <div className="text-[9px] text-slate-500">Estamos trabajando para ti</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {[
            { id: "resumen" as const, label: "Resumen", icono: <TrendingUp size={15} /> },
            { id: "documentos" as const, label: "Documentos", icono: <FileText size={15} /> },
            { id: "perfil" as const, label: "Mi Perfil", icono: <User size={15} /> },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setTabActiva(tab.id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-[12px] font-semibold transition-all whitespace-nowrap ${
                tabActiva === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}>
              {tab.icono} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tab Resumen */}
          {tabActiva === "resumen" && (
            <>
          {/* Estado de la Solicitud */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText size={18} className="text-blue-700" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Progreso de tu Crédito</h2>
                <p className="text-xs text-blue-700 font-semibold">{configEstado?.label || "En proceso"}</p>
              </div>
            </div>

            {/* Progreso - Vertical en mobile, Horizontal en desktop */}
            <div className="mb-6">
              {/* Mobile: Vertical stepper */}
              <div className="md:hidden px-2 space-y-0">
                {PASOS_PROGRESO.map((paso, i) => {
                  const completado = progreso > i + 1;
                  const actual = progreso === i + 1;
                  return (
                    <div key={paso.paso} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all flex-shrink-0 ${completado ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : actual ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg shadow-blue-600/30 scale-110" : "bg-slate-100 text-slate-400 border-2 border-slate-200"}`}>
                          {completado ? <CheckCircle size={18} /> : i + 1}
                        </div>
                        {i < PASOS_PROGRESO.length - 1 && (
                          <div className={`w-0.5 h-12 ${completado ? "bg-blue-600" : actual ? "bg-gradient-to-b from-blue-600 to-slate-200" : "bg-slate-200"}`} />
                        )}
                      </div>
                      <div className="pb-6 pt-1.5 flex-1">
                        <div className={`text-sm font-bold ${actual ? "text-blue-700" : completado ? "text-blue-700" : "text-slate-400"}`}>{paso.label}</div>
                        <div className={`text-[11px] font-medium mt-0.5 ${completado ? "text-emerald-500" : actual ? "text-blue-600" : "text-slate-300"}`}>
                          {completado ? "Completado" : actual ? "En progreso" : "Pendiente"}
                        </div>
                        {actual && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-[11px] text-blue-700">{paso.label === "Documentacion" ? "Sube los documentos requeridos para avanzar" : "Te notificaremos cuando avances"}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: Banner de etapa + stepper horizontal mejorado */}
              <div className="hidden md:block">
                {/* Banner de etapa actual */}
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-5 mb-5 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 text-[10px] font-medium uppercase tracking-wider mb-1">Etapa actual</p>
                      <h3 className="text-xl font-bold">{configEstado?.label || "En proceso"}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{progreso}<span className="text-blue-300 text-lg">/{totalPasos}</span></div>
                      <p className="text-[10px] text-blue-200">pasos completados</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-white via-blue-100 to-white rounded-full transition-all duration-1000" style={{ width: `${Math.max(5, (progreso / totalPasos) * 100)}%` }} />
                  </div>
                </div>

                {/* Stepper horizontal */}
                <div className="relative px-4">
                  <div className="flex items-start justify-between relative">
                    <div className="absolute top-5 left-[8%] right-[8%] h-1 bg-slate-100 rounded-full" />
                    <div className="absolute top-5 left-[8%] h-1 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-1000" style={{ width: `${Math.max(0, ((progreso - 1) / (totalPasos - 1)) * 84)}%` }} />
                    {PASOS_PROGRESO.map((paso, i) => {
                      const completado = progreso > i + 1;
                      const actual = progreso === i + 1;
                      return (
                        <div key={paso.paso} className="flex flex-col items-center relative z-10 flex-1">
                          <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold transition-all ${completado ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : actual ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg shadow-blue-600/30 scale-110" : "bg-white text-slate-400 border-2 border-slate-200"}`}>
                            {completado ? <CheckCircle size={18} /> : i + 1}
                          </div>
                          <span className={`text-[11px] lg:text-xs font-bold mt-2 text-center ${actual ? "text-blue-700" : completado ? "text-blue-700" : "text-slate-400"}`}>{paso.label}</span>
                          <span className={`text-[9px] lg:text-[10px] mt-1 ${completado ? "text-emerald-500 font-semibold" : actual ? "text-blue-600 font-semibold" : "text-slate-300"}`}>
                            {completado ? "Completado" : actual ? "En progreso" : "Pendiente"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>{/* Mensaje Informativo */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info size={16} className="text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  {pasoActual?.label === "Documentación"
                    ? "Hemos recibido tus documentos. Nuestro equipo los está revisando y pronto avanzaremos a la evaluación de tu perfil."
                    : `Tu solicitud se encuentra en la etapa: ${configEstado?.label}. Te notificaremos cuando haya novedades.`}
                </p>
              </div>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap flex items-center gap-1">
                Ver detalles <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Resumen de la Solicitud */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Resumen de tu solicitud</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {[
                  { icon: <Calendar size={16} />, label: "Fecha de inicio", value: cliente.creadoEn.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" }) },
                  { icon: <Home size={16} />, label: "Tipo de propiedad", value: "Propiedad residencial" },
                  { icon: <MapPin size={16} />, label: "Banco asignado", value: cliente.banco || "Por asignar" },
                  { icon: <DollarSign size={16} />, label: "Valor del crédito", value: `${formatoMonedaAbreviado(cliente.montoSolicitado || 0)} (${formatoUF(cliente.montoSolicitado || 0)})` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">{item.label}</div>
                      <div className="text-xs font-semibold text-slate-700">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock size={14} className="text-blue-700" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Próximo paso</div>
                    <div className="text-xs font-bold text-slate-800">{pasoActual?.label || "En proceso"}</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Te notificaremos por email cuando tengamos novedades sobre tu evaluación.
                </p>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button className="flex items-center gap-2 text-xs text-blue-700 hover:text-blue-800 font-semibold">
                <Info size={14} /> ¿Tienes dudas sobre el proceso? Revisa nuestras preguntas frecuentes
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Pasos para completar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4">Pasos para completar tu solicitud</h2>
            <div className="space-y-3">
              {[
                { paso: 1, titulo: "Completa tu perfil", desc: "Actualiza tus datos personales y de empleo", icon: <User size={16} className="text-blue-600" />, color: "bg-blue-50 border-blue-100", completado: !!(cliente.email && cliente.telefono && cliente.estadoCivil && cliente.profesion && cliente.domicilioParticular && cliente.nombreEmpleador && cliente.cargo && cliente.rentaLiquida) },
                { paso: 2, titulo: "Sube tus documentos", desc: "Carga los documentos requeridos para tu credito", icon: <FileText size={16} className="text-emerald-600" />, color: "bg-emerald-50 border-emerald-100", completado: documentos.length > 0 },
                { paso: 3, titulo: "Revisa tu progreso", desc: "Consulta en que etapa va tu solicitud", icon: <TrendingUp size={16} className="text-amber-600" />, color: "bg-amber-50 border-amber-100", completado: progreso > 1 },
              ].map((item) => (
                <div key={item.paso} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${item.completado ? "bg-emerald-50/50 border-emerald-200" : item.color}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.completado ? "bg-emerald-100" : "bg-white"}`}>
                    {item.completado ? <CheckCircle size={16} className="text-emerald-500" /> : item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold ${item.completado ? "text-emerald-700" : "text-slate-800"}`}>{item.titulo}</div>
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  </div>
                  {item.completado && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Listo</span>}
                </div>
              ))}
            </div>
            <button onClick={() => setTabActiva("perfil")}
              className="w-full mt-4 h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-600/20">
              <User size={14} /> Completar mi perfil
            </button>
          </div>
          </>
          )}

          {/* Tab Documentos */}
          {tabActiva === "documentos" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Mis Documentos</h2>
                  <p className="text-[11px] text-slate-400">Sube los documentos requeridos para tu solicitud</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-700">{documentos.length}</div>
                  <div className="text-[10px] text-slate-400">documentos</div>
                </div>
              </div>

              {/* Documentos Requeridos */}
              <div className="mb-6">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Documentos Requeridos</h3>
                <div className="space-y-2">
                  {docsConfig.map((doc) => {
                    const docSubido = documentos.find((d) => d.nombre.toLowerCase().includes(doc.id));
                    const subido = !!docSubido;
                    return (
                      <div key={doc.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                        subido ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"
                      }`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          subido ? "bg-emerald-100" : "bg-slate-100"
                        }`}>
                          {subido ? <CheckCircle size={16} className="text-emerald-500" /> : <FileText size={16} className="text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-slate-700 truncate">{doc.nombre}</div>
                          <div className="flex items-center gap-2">
                            {doc.obligatorio && <span className="text-[9px] text-red-500 font-semibold">Obligatorio</span>}
                            {subido && <span className="text-[9px] text-emerald-600 font-semibold">Subido</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* Botón Subir */}
                          <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors ${
                            subido 
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}>
                            <Upload size={12} />
                            {subido ? "Reemplazar" : "Subir"}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) subirDocumento(file, doc.nombre);
                              }}
                            />
                          </label>
                          {/* Botón Descargar */}
                          {subido && docSubido?.archivoUrl && (
                            <a
                              href={docSubido.archivoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                              <Download size={12} />
                              Ver
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lista de documentos subidos (otros) */}
              {documentos.filter(d => !docsConfig.some(dc => d.nombre.toLowerCase().includes(dc.id))).length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Otros Documentos</h3>
                  <div className="space-y-2">
                    {documentos.filter(d => !docsConfig.some(dc => d.nombre.toLowerCase().includes(dc.id))).map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <FileCheck size={16} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-slate-700 truncate">{doc.nombre}</div>
                          <div className="text-[10px] text-slate-400">
                            {doc.tamaño ? formatTamano(doc.tamaño) : ""} {doc.fecha && `• ${doc.fecha}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={doc.archivoUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                          >
                            <Download size={12} />
                            Ver
                          </a>
                          <button
                            onClick={() => eliminarDocumento(doc.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Mi Perfil */}
          {tabActiva === "perfil" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Mi Perfil</h2>
                  <p className="text-[11px] text-slate-400">Completa tu información para agilizar el proceso</p>
                </div>
                {!editandoPerfil && (
                  <button onClick={iniciarEdicion}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20">
                    <Edit size={12} /> Editar
                  </button>
                )}
              </div>

              {editandoPerfil ? (
                <div className="space-y-5">
                  {/* Datos del Cliente */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Datos del Cliente</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Nombre Completo</label>
                        <input type="text" value={`${perfilEditado.nombre} ${perfilEditado.apellido}`}
                          className="w-full h-10 px-3 bg-slate-100 border border-slate-200 rounded-xl text-[12px] text-slate-500" disabled />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">RUT</label>
                        <input type="text" value={cliente?.rut || ""} disabled
                          className="w-full h-10 px-3 bg-slate-100 border border-slate-200 rounded-xl text-[12px] text-slate-500" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Cargas Legales</label>
                        <input type="text" value={perfilEditado.cargasLegales}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, cargasLegales: e.target.value })}
                          placeholder="Ej: 3 (Caja Compensación)"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Estado Civil</label>
                        <select value={perfilEditado.estadoCivil}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, estadoCivil: e.target.value })}
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all">
                          <option value="">Seleccionar</option>
                          <option value="Soltero/a">Soltero/a</option>
                          <option value="Casado/a">Casado/a</option>
                          <option value="Divorciado/a">Divorciado/a</option>
                          <option value="Viudo/a">Viudo/a</option>
                          <option value="Unión Civil">Unión Civil</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Régimen Matrimonial</label>
                        <select value={perfilEditado.regimenMatrimonial}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, regimenMatrimonial: e.target.value })}
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all">
                          <option value="">Seleccionar</option>
                          <option value="Separación de Bienes">Separación de Bienes</option>
                          <option value="Sociedad Conyugal">Sociedad Conyugal</option>
                          <option value="No aplica">No aplica</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Fecha de Nacimiento</label>
                        <input type="date" value={perfilEditado.fechaNacimiento}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, fechaNacimiento: e.target.value })}
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Estudios</label>
                        <input type="text" value={perfilEditado.estudios}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, estudios: e.target.value })}
                          placeholder="Ej: Universitario"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Profesión</label>
                        <input type="text" value={perfilEditado.profesion}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, profesion: e.target.value })}
                          placeholder="Ej: Ingeniero"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Domicilio Particular</label>
                        <input type="text" value={perfilEditado.domicilioParticular}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, domicilioParticular: e.target.value })}
                          placeholder="Dirección completa"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Comuna - Ciudad</label>
                        <input type="text" value={perfilEditado.comunaCiudad}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, comunaCiudad: e.target.value })}
                          placeholder="Ej: Las Condes"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Celular</label>
                        <input type="tel" value={perfilEditado.telefono}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, telefono: e.target.value })}
                          placeholder="+56 9 1234 5678"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Correo Electrónico</label>
                        <input type="email" value={perfilEditado.email}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, email: e.target.value })}
                          placeholder="tu@email.com"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">AFP</label>
                        <select value={perfilEditado.afp}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, afp: e.target.value })}
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all">
                          <option value="">Seleccionar</option>
                          <option value="Capital">Capital</option>
                          <option value="Cuprum">Cuprum</option>
                          <option value="Habitat">Habitat</option>
                          <option value="Planvital">Planvital</option>
                          <option value="Provida">Provida</option>
                          <option value="Rencoret">Rencoret</option>
                          <option value="Santa Maria">Santa Maria</option>
                          <option value="Otros">Otros</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Patrimonio */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Patrimonio</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Vehículo (adjuntar padrón)</label>
                        <input type="text" value={perfilEditado.patrimonioVehiculo}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, patrimonioVehiculo: e.target.value })}
                          placeholder="$0"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Vivienda</label>
                        <input type="text" value={perfilEditado.patrimonioVivienda}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, patrimonioVivienda: e.target.value })}
                          placeholder="$0"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Otros (especificar)</label>
                        <input type="text" value={perfilEditado.patrimonioOtros}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, patrimonioOtros: e.target.value })}
                          placeholder="$0"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Datos del Empleador */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Datos del Empleador</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Nombre del Empleador</label>
                        <input type="text" value={perfilEditado.nombreEmpleador}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, nombreEmpleador: e.target.value })}
                          placeholder="Nombre empresa"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">RUT Empresa</label>
                        <input type="text" value={perfilEditado.rutEmpresa}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, rutEmpresa: e.target.value })}
                          placeholder="12.345.678-9"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Fecha de Ingreso</label>
                        <input type="date" value={perfilEditado.fechaIngreso}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, fechaIngreso: e.target.value })}
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Cargo</label>
                        <input type="text" value={perfilEditado.cargo}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, cargo: e.target.value })}
                          placeholder="Ej: Gerente"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Renta Líquida</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">$</span>
                          <input type="number" value={perfilEditado.rentaLiquida}
                            onChange={(e) => setPerfilEditado({ ...perfilEditado, rentaLiquida: e.target.value })}
                            placeholder="0"
                            className="w-full h-10 pl-7 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Banco Abono Renta</label>
                        <select value={perfilEditado.bancoAbonoRenta}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, bancoAbonoRenta: e.target.value })}
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all">
                          <option value="">Seleccionar</option>
                          <option value="Banco de Chile">Banco de Chile</option>
                          <option value="Santander">Santander</option>
                          <option value="Banco Estado">Banco Estado</option>
                          <option value="BCI">BCI</option>
                          <option value="Itaú">Itaú</option>
                          <option value="Scotiabank">Scotiabank</option>
                          <option value="Falabella">Falabella</option>
                          <option value="Corpbanca">Corpbanca</option>
                          <option value="Otros">Otros</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Fecha de Pago</label>
                        <select value={perfilEditado.fechaPago}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, fechaPago: e.target.value })}
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all">
                          <option value="">Seleccionar</option>
                          <option value="1">1</option>
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="15">15</option>
                          <option value="20">20</option>
                          <option value="25">25</option>
                          <option value="30">30</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Dirección Laboral</label>
                        <input type="text" value={perfilEditado.direccionLaboral}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, direccionLaboral: e.target.value })}
                          placeholder="Dirección"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Comuna - Ciudad</label>
                        <input type="text" value={perfilEditado.comunaCiudadLaboral}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, comunaCiudadLaboral: e.target.value })}
                          placeholder="Comuna"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Teléfono Laboral FIJO</label>
                        <input type="tel" value={perfilEditado.telefonoLaboralFijo}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, telefonoLaboralFijo: e.target.value })}
                          placeholder="02 2 123 4567"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Correo Electrónico Laboral</label>
                        <input type="email" value={perfilEditado.emailLaboral}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, emailLaboral: e.target.value })}
                          placeholder="empresa@empresa.com"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-semibold text-slate-600 mb-1 block">Otros Ingresos (detallar)</label>
                        <input type="text" value={perfilEditado.otrosIngresos}
                          onChange={(e) => setPerfilEditado({ ...perfilEditado, otrosIngresos: e.target.value })}
                          placeholder="Ej: Arriendos $500.000, Freelance $300.000"
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Situación Laboral */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Situación Laboral</h4>
                    <select value={perfilEditado.situacionLaboral}
                      onChange={(e) => setPerfilEditado({ ...perfilEditado, situacionLaboral: e.target.value as SituacionLaboral })}
                      className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all">
                      <option value="DEPENDIENTE">Dependiente</option>
                      <option value="INDEPENDIENTE">Independiente (Boleta de Honorarios)</option>
                      <option value="EMPRESA">Empresa</option>
                    </select>
                  </div>

                  {/* Botones */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button onClick={() => setEditandoPerfil(false)}
                      className="px-5 py-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                      Cancelar
                    </button>
                    <button onClick={guardarPerfil} disabled={guardando}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50">
                      {guardando ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
                      ) : (
                        <><Save size={12} /> Guardar Cambios</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Información Personal */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <User size={14} className="text-blue-500" /> Información Personal
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        ["Nombre Completo", `${cliente.nombre} ${cliente.apellido}`],
                        ["RUT", cliente.rut],
                        ["Teléfono", cliente.telefono || "No registrado"],
                        ["Email", cliente.email || "No registrado"],
                        ["Situación Laboral", situacionConfig?.label || "No definida"],
                        ["En DICOM", cliente.enDicom ? "Sí" : "No"],
                        ["Renta Mensual", cliente.rentaMensual || "No especificada"],
                        ["Cargas Legales", cliente.cargasLegales || "No especificado"],
                        ["Estado Civil", cliente.estadoCivil || "No especificado"],
                        ["Régimen Matrimonial", cliente.regimenMatrimonial || "No especificado"],
                        ["Fecha Nacimiento", cliente.fechaNacimiento || "No especificado"],
                        ["Estudios", cliente.estudios || "No especificado"],
                        ["Profesión", cliente.profesion || "No especificado"],
                        ["Domicilio Particular", cliente.domicilioParticular || "No especificado"],
                        ["Comuna - Ciudad", cliente.comunaCiudad || "No especificado"],
                        ["Valor Arriendo", cliente.valorArriendo ? `$${cliente.valorArriendo.toLocaleString()}` : "No aplica"],
                        ["AFP", cliente.afp || "No especificado"],
                      ].map(([label, value]) => (
                        <div key={label} className="p-3 bg-slate-50 rounded-xl">
                          <div className="text-[9px] text-slate-400 font-medium uppercase">{label}</div>
                          <div className="text-[12px] font-semibold text-slate-700 mt-0.5">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Datos del Empleador */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Briefcase size={14} className="text-purple-500" /> Datos del Empleador
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ["Nombre del Empleador", cliente.nombreEmpleador || "No especificado"],
                        ["RUT Empresa", cliente.rutEmpresa || "No especificado"],
                        ["Fecha de Ingreso", cliente.fechaIngreso || "No especificado"],
                        ["Cargo", cliente.cargo || "No especificado"],
                        ["Renta Líquida", cliente.rentaLiquida ? formatoMoneda(cliente.rentaLiquida) : "No especificado"],
                        ["Banco Abono Renta", cliente.bancoAbonoRenta || "No especificado"],
                        ["Fecha de Pago", cliente.fechaPago || "No especificado"],
                        ["Dirección Laboral", cliente.direccionLaboral || "No especificado"],
                        ["Comuna - Ciudad", cliente.comunaCiudadLaboral || "No especificado"],
                        ["Teléfono Laboral FIJO", cliente.telefonoLaboralFijo || "No especificado"],
                        ["Correo Electrónico Laboral", cliente.emailLaboral || "No especificado"],
                        ["Otros Ingresos", cliente.otrosIngresos || "No especificado"],
                      ].map(([label, value]) => (
                        <div key={label} className="p-3 bg-slate-50 rounded-xl">
                          <div className="text-[9px] text-slate-400 font-medium uppercase">{label}</div>
                          <div className="text-[12px] font-semibold text-slate-700 mt-0.5">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Patrimonio */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Home size={14} className="text-emerald-500" /> Patrimonio
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        ["Vehículo", cliente.patrimonioVehiculo || "No especificado"],
                        ["Vivienda", cliente.patrimonioVivienda || "No especificado"],
                        ["Otros", cliente.patrimonioOtros || "No especificado"],
                      ].map(([label, value]) => (
                        <div key={label} className="p-3 bg-slate-50 rounded-xl">
                          <div className="text-[9px] text-slate-400 font-medium uppercase">{label}</div>
                          <div className="text-[12px] font-semibold text-slate-700 mt-0.5">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ejecutivo Asignado */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <User size={14} className="text-orange-500" /> Ejecutivo Asignado
                    </h4>
                    {asesor ? (
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-sm font-bold">
                            {asesor.nombre?.[0]}{asesor.apellido?.[0]}
                          </div>
                          <div>
                            <div className="text-[12px] font-semibold text-slate-700">{asesor.nombre} {asesor.apellido}</div>
                            <div className="text-[10px] text-slate-500">{asesor.cargo || "Asesor Hipotecario"}</div>
                            {asesor.email && <div className="text-[10px] text-slate-500">{asesor.email}</div>}
                            {asesor.telefono && <div className="text-[10px] text-slate-500">{asesor.telefono}</div>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl text-center">
                        <div className="text-[11px] text-slate-400">Sin ejecutivo asignado</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna Lateral - colapsable en mobile */}
        <div className="space-y-4 sm:space-y-5">
          {/* Boton toggle sidebar en mobile */}
          <button onClick={() => setMostrarSidebar(!mostrarSidebar)}
            className="w-full lg:hidden flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[52px]">
            <span className="text-sm font-bold text-slate-900">Tu asesor y documentos</span>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${mostrarSidebar ? "rotate-180" : ""}`} />
          </button>

          <div className={`${mostrarSidebar ? "block" : "hidden"} lg:block space-y-4 sm:space-y-5`}>
          {/* Tu Asesor */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Tu asesor</h3>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {asesor ? `${asesor.nombre[0]}${asesor.apellido[0]}` : "TH"}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">{asesor ? `${asesor.nombre} ${asesor.apellido}` : "Sin asignar"}</div>
                <div className="text-[11px] text-slate-500">{asesor?.cargo || "Asesor Hipotecario"}</div>
              </div>
            </div>
            <div className="space-y-3">
              <a href={`tel:${asesor?.telefono || "+56988182221"}`}
                className="flex items-center gap-3 text-xs text-slate-600 hover:text-blue-700 transition-colors">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                  <Phone size={14} className="text-slate-400" />
                </div>
                <span>{asesor?.telefono || "+56 9 8818 2221"}</span>
              </a>
              <a href={`mailto:${asesor?.email || "asesor@tuhipotecafacil.cl"}`}
                className="flex items-center gap-3 text-xs text-slate-600 hover:text-blue-700 transition-colors">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                  <Mail size={14} className="text-slate-400" />
                </div>
                <span>{asesor?.email || "asesor@tuhipotecafacil.cl"}</span>
              </a>
              <a href={`https://wa.me/56${(asesor?.telefono || "983300597").replace(/[^0-9]/g, "").replace(/^56/, "")}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 text-xs text-green-600 hover:text-green-700 font-semibold transition-colors">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <MessageSquare size={14} className="text-green-600" />
                </div>
                <span>Enviar WhatsApp</span>
              </a>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="text-slate-500" />
                  <span className="text-[11px] font-semibold text-slate-700">Horario de atención</span>
                </div>
                <p className="text-[11px] text-slate-500">Lunes a Viernes de 09:00 a 18:30 hrs.</p>
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Documentos</h3>
              <button onClick={() => setTabActiva("documentos")} className="text-[11px] font-semibold text-blue-700 hover:text-blue-800">Ver todos</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Documentos entregados</span>
                <span className="text-xs font-bold text-blue-700">{docsAprobados} / {docsTotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Documentos pendientes</span>
                <span className="text-xs font-bold text-amber-600">{docsTotal - docsAprobados}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all"
                  style={{ width: `${(docsAprobados / docsTotal) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Alertas y Notificaciones */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Alertas y notificaciones</h3>
              <button onClick={() => setTabActiva("resumen")} className="text-[11px] font-semibold text-blue-700 hover:text-blue-800">Ver todas</button>
            </div>
            <div className="space-y-3">
              {[
                { icon: <CheckCircle size={14} />, text: "Hemos recibido tu liquidación de sueldo", time: "Hace 2 días", color: "text-emerald-500" },
                { icon: <Bell size={14} />, text: "Documento pendiente: Certificado AFP", time: "Hace 3 días", color: "text-amber-500" },
                { icon: <Clock size={14} />, text: "Tu evaluación está en proceso", time: "Hace 5 días", color: "text-blue-500" },
              ].map((notif, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-50 ${notif.color}`}>
                    {notif.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-700 font-medium">{notif.text}</p>
                    <p className="text-[10px] text-slate-400">{notif.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setTabActiva("resumen")} className="w-full mt-4 py-2.5 bg-slate-50 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1">
              Ver todas las notificaciones <ChevronRight size={14} />
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
