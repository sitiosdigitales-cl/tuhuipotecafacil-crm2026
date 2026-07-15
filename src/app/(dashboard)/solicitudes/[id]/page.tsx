"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Home,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  User,
  Phone,
  Mail,
} from "lucide-react";
import { formatoMonedaAbreviado, formatoMoneda } from "@/lib/utils";
import { toast } from "sonner";

const ESTADOS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icono: any }> = {
  EN_REVISION: { label: "En Revisión", color: "#F59E0B", bgColor: "bg-amber-50 text-amber-700", icono: Clock },
  ENVIADO_BANCO: { label: "Enviado al Banco", color: "#3B82F6", bgColor: "bg-blue-50 text-blue-700", icono: TrendingUp },
  EN_EVALUACION: { label: "En Evaluación", color: "#8B5CF6", bgColor: "bg-purple-50 text-purple-700", icono: AlertTriangle },
  APROBADO: { label: "Aprobado", color: "#059669", bgColor: "bg-green-50 text-green-700", icono: CheckCircle },
  RECHAZADO: { label: "Rechazado", color: "#DC2626", bgColor: "bg-red-50 text-red-700", icono: AlertTriangle },
};

export default function SolicitudDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [solicitud, setSolicitud] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch(`/api/solicitudes/${id}`, { credentials: "include" });
        const data = await res.json();
        if (data.success) setSolicitud(data.data);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [id]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-600">Solicitud no encontrada</h2>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">
          Volver
        </button>
      </div>
    );
  }

  const config = ESTADOS_CONFIG[solicitud.estado] || ESTADOS_CONFIG.EN_REVISION;
  const EstadoIcono = config.icono;
  const progreso = solicitud.documentosRequeridos > 0 
    ? Math.round((solicitud.documentosCompletos / solicitud.documentosRequeridos) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{solicitud.tipoCredito}</h1>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${config.bgColor}`}>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Solicitud #{solicitud.id?.substring(0, 8)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <DollarSign size={14} /> Monto Solicitado
          </div>
          <div className="text-xl font-bold text-slate-900">{formatoMonedaAbreviado(solicitud.montoSolicitado)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Home size={14} /> Valor Propiedad
          </div>
          <div className="text-xl font-bold text-slate-900">{formatoMonedaAbreviado(solicitud.valorPropiedad)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Building2 size={14} /> Banco
          </div>
          <div className="text-xl font-bold text-slate-900">{solicitud.bancoAsignado || "Sin asignar"}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <FileText size={14} /> Documentos
          </div>
          <div className="text-xl font-bold text-slate-900">{progreso}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">Progreso de Documentación</span>
          <span className="text-sm font-bold text-slate-800">{solicitud.documentosCompletos}/{solicitud.documentosRequeridos}</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Datos del Crédito */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-blue-500" /> Datos del Crédito
          </h3>
          <div className="space-y-3">
            {[
              ["Tipo de Crédito", solicitud.tipoCredito],
              ["Monto Solicitado", formatoMoneda(solicitud.montoSolicitado)],
              ["Plazo", `${solicitud.plazoMeses} meses`],
              ["Tasa de Interés", solicitud.tasaInteres ? `${solicitud.tasaInteres}%` : "No definida"],
              ["Cuota Mensual", solicitud.cuotaMensual ? formatoMoneda(solicitud.cuotaMensual) : "No calculada"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-medium text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Propiedad */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Home size={16} className="text-emerald-500" /> Propiedad
          </h3>
          <div className="space-y-3">
            {[
              ["Valor Propiedad", formatoMoneda(solicitud.valorPropiedad)],
              ["Pie Disponible", formatoMoneda(solicitud.pieDisponible)],
              ["Dirección", solicitud.direccionPropiedad || "No especificada"],
              ["Comuna", solicitud.comunaPropiedad || "No especificada"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-medium text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fechas */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-purple-500" /> Fechas Importantes
          </h3>
          <div className="space-y-3">
            {[
              ["Creación", solicitud.creadoEn?.split("T")[0]],
              ["Envío al Banco", solicitud.fechaEnvioBanco?.split("T")[0] || "Pendiente"],
              ["Respuesta", solicitud.fechaRespuesta?.split("T")[0] || "Pendiente"],
              ["Aprobación", solicitud.fechaAprobacion?.split("T")[0] || "Pendiente"],
              ["Firma", solicitud.fechaFirma?.split("T")[0] || "Pendiente"],
              ["Desembolso", solicitud.fechaDesembolso?.split("T")[0] || "Pendiente"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-medium text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-amber-500" /> Notas
          </h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">
            {solicitud.notas || "Sin notas registradas"}
          </p>
        </div>
      </div>
    </div>
  );
}
