"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  Building2,
  DollarSign,
  FileText,
  LayoutGrid,
  List,
} from "lucide-react";
import { formatoMonedaAbreviado } from "@/lib/utils";
const ESTADOS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  EN_REVISION: { label: "En Revisión", color: "#F59E0B", bgColor: "bg-amber-50 text-amber-700" },
  ENVIADO_BANCO: { label: "Enviado al Banco", color: "#3B82F6", bgColor: "bg-blue-50 text-blue-700" },
  EN_EVALUACION: { label: "En Evaluación", color: "#8B5CF6", bgColor: "bg-purple-50 text-purple-700" },
  OBSERVADO: { label: "Observado", color: "#EF4444", bgColor: "bg-red-50 text-red-700" },
  PREAPROBADO: { label: "Pre-Aprobado", color: "#10B981", bgColor: "bg-emerald-50 text-emerald-700" },
  APROBADO: { label: "Aprobado", color: "#059669", bgColor: "bg-green-50 text-green-700" },
  RECHAZADO: { label: "Rechazado", color: "#DC2626", bgColor: "bg-red-50 text-red-700" },
  EN_FIRMA: { label: "En Firma", color: "#F97316", bgColor: "bg-orange-50 text-orange-700" },
  EN_NOTARIA: { label: "En Notaría", color: "#6366F1", bgColor: "bg-indigo-50 text-indigo-700" },
  DESEMBOLSADO: { label: "Desembolsado", color: "#10B981", bgColor: "bg-green-50 text-green-700" },
  COMPLETADO: { label: "Completado", color: "#059669", bgColor: "bg-green-50 text-green-700" },
};

export default function SolicitudesPage() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [vistaActiva, setVistaActiva] = useState<"tabla" | "tarjetas">("tarjetas");

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/solicitudes", { credentials: "include" });
        const data = await res.json();
        if (data.success) setSolicitudes(data.data || []);
      } catch (err) {
        console.error("Error cargando solicitudes:", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter((s) => {
      const matchBusqueda = !busqueda || 
        s.tipoCredito?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.bancoAsignado?.toLowerCase().includes(busqueda.toLowerCase());
      const matchEstado = filtroEstado === "todos" || s.estado === filtroEstado;
      return matchBusqueda && matchEstado;
    });
  }, [solicitudes, busqueda, filtroEstado]);

  const estadisticas = useMemo(() => {
    const total = solicitudes.length;
    const enProceso = solicitudes.filter(s => !["COMPLETADO", "RECHAZADO"].includes(s.estado)).length;
    const aprobados = solicitudes.filter(s => ["APROBADO", "DESEMBOLSADO", "COMPLETADO"].includes(s.estado)).length;
    const montoTotal = solicitudes.reduce((sum, s) => sum + (s.montoSolicitado || 0), 0);
    return { total, enProceso, aprobados, montoTotal };
  }, [solicitudes]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Solicitudes</h1>
          <p className="text-sm text-slate-500">Gestión de expedientes hipotecarios</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Nueva Solicitud
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="text-sm text-slate-500">Total</div>
          <div className="text-2xl font-bold text-slate-900">{estadisticas.total}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="text-sm text-slate-500">En Proceso</div>
          <div className="text-2xl font-bold text-blue-600">{estadisticas.enProceso}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="text-sm text-slate-500">Aprobados</div>
          <div className="text-2xl font-bold text-emerald-600">{estadisticas.aprobados}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="text-sm text-slate-500">Monto Total</div>
          <div className="text-2xl font-bold text-slate-900">{formatoMonedaAbreviado(estadisticas.montoTotal)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por tipo de crédito o banco..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="todos">Todos los estados</option>
          {Object.entries(ESTADOS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setVistaActiva("tarjetas")}
            className={`p-2.5 ${vistaActiva === "tarjetas" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50"}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setVistaActiva("tabla")}
            className={`p-2.5 ${vistaActiva === "tabla" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50"}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Lista de solicitudes */}
      {solicitudesFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
          <FileText size={48} className="text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No hay solicitudes</h3>
          <p className="text-sm text-slate-400">Crea una nueva solicitud para comenzar</p>
        </div>
      ) : vistaActiva === "tarjetas" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {solicitudesFiltradas.map((solicitud) => {
            const config = ESTADOS_CONFIG[solicitud.estado] || ESTADOS_CONFIG.EN_REVISION;
            return (
              <div
                key={solicitud.id}
                onClick={() => router.push(`/solicitudes/${solicitud.id}`)}
                className="bg-white rounded-xl border border-slate-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${config.bgColor}`}>
                    {config.label}
                  </span>
                  <span className="text-[10px] text-slate-400">{solicitud.creadoEn?.split("T")[0]}</span>
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">{solicitud.tipoCredito}</h3>
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <DollarSign size={12} /> {formatoMonedaAbreviado(solicitud.montoSolicitado)}
                  </span>
                  {solicitud.bancoAsignado && (
                    <span className="flex items-center gap-1">
                      <Building2 size={12} /> {solicitud.bancoAsignado}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Monto</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Banco</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Fecha</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {solicitudesFiltradas.map((solicitud) => {
                const config = ESTADOS_CONFIG[solicitud.estado] || ESTADOS_CONFIG.EN_REVISION;
                return (
                  <tr
                    key={solicitud.id}
                    onClick={() => router.push(`/solicitudes/${solicitud.id}`)}
                    className="hover:bg-blue-50/20 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{solicitud.tipoCredito}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatoMonedaAbreviado(solicitud.montoSolicitado)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{solicitud.bancoAsignado || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${config.bgColor}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{solicitud.creadoEn?.split("T")[0]}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 hover:bg-slate-100 rounded-lg">
                        <Eye size={14} className="text-slate-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
