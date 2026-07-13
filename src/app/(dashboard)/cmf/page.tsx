"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface TasaData {
  fecha: string;
  tipoOperacion: string;
  tasa: number;
  moneda: string;
}

interface HistoricoData {
  mes: string;
  tasaPromedio: number;
  tasaMinima: number;
  tasaMaxima: number;
  registros: number;
}

interface StatusData {
  activo: boolean;
  ultimaActualizacion: Date | null;
  totalRegistros: number;
  proximaActualizacion: Date | null;
  estadoAPI: "OK" | "ERROR" | "SIN_DATOS";
  ultimoError?: string;
}

export default function CMFPage() {
  const [tasaActual, setTasaActual] = useState<TasaData | null>(null);
  const [historico, setHistorico] = useState<HistoricoData[]>([]);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [tasaRes, histRes, statusRes] = await Promise.all([
        fetch("/api/cmf/rates?moneda=UF"),
        fetch("/api/cmf/rates/history?meses=12"),
        fetch("/api/cmf/status"),
      ]);

      const tasaData = await tasaRes.json();
      const histData = await histRes.json();
      const statusData = await statusRes.json();

      if (tasaData.success) setTasaActual(tasaData.data);
      if (histData.success) setHistorico(histData.data);
      if (statusData.success) setStatus(statusData.data);
    } catch (error) {
      // Error al cargar datos CMF
    } finally {
      setLoading(false);
    }
  };

  const handleActualizar = async () => {
    setActualizando(true);
    try {
      await fetch("/api/cmf/update", { method: "POST" });
      await cargarDatos();
    } finally {
      setActualizando(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatFechaCorta = (fecha: string) => {
    return new Date(fecha + "-01").toLocaleDateString("es-CL", {
      month: "short",
      year: "2-digit",
    });
  };

  // Calcular variaciones
  const variacionMes = historico.length >= 2
    ? historico[historico.length - 1].tasaPromedio - historico[historico.length - 2].tasaPromedio
    : 0;

  const variacionAnual = historico.length >= 12
    ? historico[historico.length - 1].tasaPromedio - historico[0].tasaPromedio
    : 0;

  const tasaMinima = historico.length > 0
    ? Math.min(...historico.map((h) => h.tasaMinima))
    : 0;

  const tasaMaxima = historico.length > 0
    ? Math.max(...historico.map((h) => h.tasaMaxima))
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-sm text-slate-500">Cargando datos CMF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Tasas de Interés CMF
            </h1>
            <p className="text-emerald-100 text-[11px] font-medium">
              Comisión para el Mercado Financiero • Datos oficiales
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${status?.estadoAPI === "OK" ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-[10px] font-semibold">
                {status?.estadoAPI === "OK" ? "API Conectada" : "API Desconectada"}
              </span>
            </div>
            <button
              onClick={handleActualizar}
              disabled={actualizando}
              className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl text-[11px] font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={actualizando ? "animate-spin" : ""} />
              {actualizando ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <DollarSign size={18} className="text-blue-500" />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Tasa Vigente</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {tasaActual?.tasa.toFixed(2) || "--"}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {tasaActual?.moneda || "UF"} • {tasaActual?.tipoOperacion || "Hipotecario"}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              variacionMes >= 0 ? "bg-red-50 dark:bg-red-900/30" : "bg-green-50 dark:bg-green-900/30"
            }`}>
              {variacionMes >= 0 ? (
                <TrendingUp size={18} className="text-red-500" />
              ) : (
                <TrendingDown size={18} className="text-green-500" />
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Variación Mensual</span>
          </div>
          <div className={`text-2xl font-bold ${
            variacionMes >= 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
          }`}>
            {variacionMes >= 0 ? "+" : ""}{variacionMes.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">vs mes anterior</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <BarChart3 size={18} className="text-purple-500" />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Rango Histórico</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {tasaMinima.toFixed(2)}% - {tasaMaxima.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">últimos 12 meses</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Database size={18} className="text-amber-500" />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Registros</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {status?.totalRegistros || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">en base de datos</div>
        </div>
      </div>

      {/* Gráfico de histórico */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">Evolución Histórica</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Tasa promedio UF hipotecario</p>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-slate-500">Promedio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-slate-500">Mínima</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-slate-500">Máxima</span>
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historico}>
              <defs>
                <linearGradient id="colorPromedio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="mes"
                tickFormatter={formatFechaCorta}
                stroke="#94A3B8"
                fontSize={10}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={10}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  fontSize: "11px",
                }}
                formatter={(value: any) => [`${Number(value).toFixed(2)}%`, ""]}
                labelFormatter={(label) => formatFechaCorta(label)}
              />
              <Area
                type="monotone"
                dataKey="tasaMaxima"
                stroke="#EF4444"
                strokeWidth={1}
                fill="none"
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="tasaMinima"
                stroke="#10B981"
                strokeWidth={1}
                fill="none"
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="tasaPromedio"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#colorPromedio)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de datos */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100">Histórico Detallado</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase">Período</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase">Promedio</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase">Mínima</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase">Máxima</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase">Registros</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((h, i) => (
                <tr key={h.mes} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-5 py-3 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                    {formatFecha(h.mes + "-01")}
                  </td>
                  <td className="px-5 py-3 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {h.tasaPromedio.toFixed(2)}%
                  </td>
                  <td className="px-5 py-3 text-[11px] text-green-600 dark:text-green-400">
                    {h.tasaMinima.toFixed(2)}%
                  </td>
                  <td className="px-5 py-3 text-[11px] text-red-600 dark:text-red-400">
                    {h.tasaMaxima.toFixed(2)}%
                  </td>
                  <td className="px-5 py-3 text-[11px] text-slate-500">
                    {h.registros}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info de estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-4">Estado del Servicio</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Estado API</span>
              <span className={`text-[11px] font-semibold ${
                status?.estadoAPI === "OK" ? "text-green-600" : "text-red-600"
              }`}>
                {status?.estadoAPI || "Desconocido"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Última actualización</span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                {status?.ultimaActualizacion
                  ? new Date(status.ultimaActualizacion).toLocaleString("es-CL")
                  : "Nunca"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Próxima actualización</span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                {status?.proximaActualizacion
                  ? new Date(status.proximaActualizacion).toLocaleString("es-CL")
                  : "No programada"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Servicio activo</span>
              <span className={`text-[11px] font-semibold ${
                status?.activo ? "text-green-600" : "text-red-600"
              }`}>
                {status?.activo ? "Sí" : "No"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-4">Información de la Fuente</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Fuente</span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">CMF Chile</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Tipo de dato</span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Tasa Promedio (TIP)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Frecuencia</span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Diaria</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Moneda</span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">UF / CLP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
