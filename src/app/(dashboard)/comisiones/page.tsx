"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  Check,
  Clock,
  AlertTriangle,
  CreditCard,
  Wallet,
  BarChart3,
  PieChart,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Plus,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Trophy,
  Medal,
  Crown,
  Building2,
  FileText,
  Send,
  Bell,
  X,
} from "lucide-react";
import { formatoMoneda, formatoMonedaAbreviado } from "@/lib/utils";

// Datos mock de comisiones por ejecutivo
const COMISIONES_INICIALES = [
  {
    id: "e1",
    nombre: "Andrés Pérez",
    avatar: "AP",
    rol: "Admin",
    ventas: 45,
    montoTotal: 6750000000,
    porcentajeComision: 0.5,
    comisionTotal: 33750000,
    comisionPagada: 25000000,
    comisionPendiente: 8750000,
    tasaConversion: 32.5,
    ticketPromedio: 150000000,
    meta: 50,
    metaMonto: 7500000000,
    color: "#3B82F6",
  },
  {
    id: "e2",
    nombre: "Carolina Muñoz",
    avatar: "CM",
    rol: "Gerente",
    ventas: 38,
    montoTotal: 5700000000,
    porcentajeComision: 0.5,
    comisionTotal: 28500000,
    comisionPagada: 22000000,
    comisionPendiente: 6500000,
    tasaConversion: 28.3,
    ticketPromedio: 150000000,
    meta: 40,
    metaMonto: 6000000000,
    color: "#8B5CF6",
  },
  {
    id: "e3",
    nombre: "Diego Silva",
    avatar: "DS",
    rol: "Agente",
    ventas: 32,
    montoTotal: 4800000000,
    porcentajeComision: 0.5,
    comisionTotal: 24000000,
    comisionPagada: 18000000,
    comisionPendiente: 6000000,
    tasaConversion: 25.6,
    ticketPromedio: 150000000,
    meta: 35,
    metaMonto: 5250000000,
    color: "#10B981",
  },
  {
    id: "e4",
    nombre: "Valentina Torres",
    avatar: "VT",
    rol: "Agente",
    ventas: 28,
    montoTotal: 4200000000,
    porcentajeComision: 0.5,
    comisionTotal: 21000000,
    comisionPagada: 15000000,
    comisionPendiente: 6000000,
    tasaConversion: 22.4,
    ticketPromedio: 150000000,
    meta: 30,
    metaMonto: 4500000000,
    color: "#F59E0B",
  },
  {
    id: "e5",
    nombre: "Javier Morales",
    avatar: "JM",
    rol: "Agente",
    ventas: 18,
    montoTotal: 2700000000,
    porcentajeComision: 0.5,
    comisionTotal: 13500000,
    comisionPagada: 10000000,
    comisionPendiente: 3500000,
    tasaConversion: 18.2,
    ticketPromedio: 150000000,
    meta: 25,
    metaMonto: 3750000000,
    color: "#EC4899",
  },
];

// Historial de pagos
const HISTORIAL_PAGOS = [
  { id: "p1", ejecutivo: "Andrés Pérez", monto: 8750000, fecha: new Date(Date.now() - 2 * 86400000), estado: "PAGADO", metodo: "Transferencia" },
  { id: "p2", ejecutivo: "Carolina Muñoz", monto: 6500000, fecha: new Date(Date.now() - 5 * 86400000), estado: "PAGADO", metodo: "Transferencia" },
  { id: "p3", ejecutivo: "Diego Silva", monto: 6000000, fecha: new Date(Date.now() - 7 * 86400000), estado: "PENDIENTE", metodo: "Pendiente" },
  { id: "p4", ejecutivo: "Valentina Torres", monto: 6000000, fecha: new Date(Date.now() - 10 * 86400000), estado: "PENDIENTE", metodo: "Pendiente" },
  { id: "p5", ejecutivo: "Javier Morales", monto: 3500000, fecha: new Date(Date.now() - 12 * 86400000), estado: "EN_PROCESO", metodo: "Procesando" },
];

// Datos mensuales para gráfico
const COMISIONES_MENSUALES = [
  { mes: "Jul", comisiones: 18000000, pagadas: 15000000 },
  { mes: "Ago", comisiones: 22000000, pagadas: 20000000 },
  { mes: "Sep", comisiones: 25000000, pagadas: 22000000 },
  { mes: "Oct", comisiones: 28000000, pagadas: 25000000 },
  { mes: "Nov", comisiones: 32000000, pagadas: 28000000 },
  { mes: "Dic", comisiones: 28500000, pagadas: 22000000 },
];

export default function ComisionesPage() {
  const [tabActiva, setTabActiva] = useState<"resumen" | "ejecutivos" | "pagos" | "historial">("resumen");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [mesSeleccionado, setMesSeleccionado] = useState("dic-2026");
  const [comisiones, setComisiones] = useState(COMISIONES_INICIALES);
  const [modalEditar, setModalEditar] = useState<string | null>(null);

  const stats = useMemo(() => ({
    totalComisiones: comisiones.reduce((sum, e) => sum + e.comisionTotal, 0),
    totalPagadas: comisiones.reduce((sum, e) => sum + e.comisionPagada, 0),
    totalPendientes: comisiones.reduce((sum, e) => sum + e.comisionPendiente, 0),
    totalVentas: comisiones.reduce((sum, e) => sum + e.ventas, 0),
    promedioConversion: Math.round(comisiones.reduce((sum, e) => sum + e.tasaConversion, 0) / comisiones.length),
  }), [comisiones]);

  const ejecutivoTop = comisiones.reduce((prev, curr) =>
    curr.comisionTotal > prev.comisionTotal ? curr : prev
  );

  const ejecutivoEditar = comisiones.find((e) => e.id === modalEditar);

  const handleGuardarPorcentaje = (ejecutivoId: string, nuevoPorcentaje: number) => {
    setComisiones((prev) =>
      prev.map((e) => {
        if (e.id === ejecutivoId) {
          const nuevaComisionTotal = Math.round(e.montoTotal * (nuevoPorcentaje / 100));
          const nuevaComisionPendiente = nuevaComisionTotal - e.comisionPagada;
          return {
            ...e,
            porcentajeComision: nuevoPorcentaje,
            comisionTotal: nuevaComisionTotal,
            comisionPendiente: Math.max(0, nuevaComisionPendiente),
          };
        }
        return e;
      })
    );
    setModalEditar(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Comisiones
            </h1>
            <p className="text-emerald-200 text-[11px] font-medium">
              Cálculo y seguimiento de comisiones por ejecutivo
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatoMonedaAbreviado(stats.totalComisiones)}</div>
              <div className="text-[10px] text-emerald-200">Total</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-300">{formatoMonedaAbreviado(stats.totalPagadas)}</div>
              <div className="text-[10px] text-emerald-200">Pagadas</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-300">{formatoMonedaAbreviado(stats.totalPendientes)}</div>
              <div className="text-[10px] text-emerald-200">Pendientes</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Total Comisiones</span>
          </div>
          <div className="text-lg font-bold text-emerald-600">{formatoMonedaAbreviado(stats.totalComisiones)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-blue-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Pagadas</span>
          </div>
          <div className="text-lg font-bold text-blue-600">{formatoMonedaAbreviado(stats.totalPagadas)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-amber-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Pendientes</span>
          </div>
          <div className="text-lg font-bold text-amber-600">{formatoMonedaAbreviado(stats.totalPendientes)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Target size={18} className="text-purple-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Ventas Totales</span>
          </div>
          <div className="text-lg font-bold text-purple-600">{stats.totalVentas}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={18} className="text-cyan-500" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Conversión Prom.</span>
          </div>
          <div className="text-lg font-bold text-cyan-600">{stats.promedioConversion}%</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100/80 p-1.5 shadow-soft">
        <div className="flex gap-1">
          {[
            { id: "resumen", label: "Resumen", icono: BarChart3 },
            { id: "ejecutivos", label: "Por Ejecutivo", icono: Users },
            { id: "pagos", label: "Pagos", icono: CreditCard },
            { id: "historial", label: "Historial", icono: Clock },
          ].map((tab) => {
            const IconoTab = tab.icono;
            return (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                  tabActiva === tab.id
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <IconoTab size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido por tab */}
      {tabActiva === "resumen" && (
        <div className="space-y-5">
          {/* Top Ejecutivo */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Trophy size={28} />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-100">
                  Top Ejecutivo del Mes
                </div>
                <div className="text-xl font-bold mt-1">{ejecutivoTop.nombre}</div>
                <div className="text-[11px] text-amber-100 mt-1">
                  {ejecutivoTop.ventas} ventas • {formatoMonedaAbreviado(ejecutivoTop.montoTotal)} en créditos
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{formatoMonedaAbreviado(ejecutivoTop.comisionTotal)}</div>
                <div className="text-[11px] text-amber-100">en comisiones</div>
              </div>
            </div>
          </div>

          {/* Gráfico de comisiones mensuales */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Comisiones Mensuales</h3>
            <div className="flex items-end gap-3 h-40">
              {COMISIONES_MENSUALES.map((mes, idx) => {
                const maxComision = Math.max(...COMISIONES_MENSUALES.map((m) => m.comisiones));
                const alturaComision = (mes.comisiones / maxComision) * 100;
                const alturaPagada = (mes.pagadas / maxComision) * 100;
                return (
                  <div key={mes.mes} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-1 items-end" style={{ height: "120px" }}>
                      <div
                        className="flex-1 bg-emerald-400 rounded-t-lg transition-all"
                        style={{ height: `${alturaPagada}%` }}
                      />
                      <div
                        className="flex-1 bg-emerald-200 rounded-t-lg transition-all"
                        style={{ height: `${alturaComision - alturaPagada}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">{mes.mes}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded" />
                <span className="text-[10px] text-slate-500">Pagadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-200 rounded" />
                <span className="text-[10px] text-slate-500">Pendientes</span>
              </div>
            </div>
          </div>

          {/* Ranking de ejecutivos */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Ranking de Ejecutivos</h3>
            <div className="space-y-3">
              {[...comisiones].sort((a, b) => b.comisionTotal - a.comisionTotal).map((ej, idx) => {
                const porcentajeMeta = Math.round((ej.ventas / ej.meta) * 100);
                return (
                  <div key={ej.id} className="flex items-center gap-4 p-3 bg-slate-50/80 rounded-xl">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-[12px] font-bold ${
                      idx === 0 ? "bg-gradient-to-br from-amber-400 to-amber-500" :
                      idx === 1 ? "bg-gradient-to-br from-slate-400 to-slate-500" :
                      idx === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700" :
                      "bg-gradient-to-br from-slate-300 to-slate-400"
                    }`}>
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-bold text-slate-700">{ej.nombre}</span>
                        <span className="text-[12px] font-bold text-emerald-600">{formatoMonedaAbreviado(ej.comisionTotal)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                            style={{ width: `${porcentajeMeta}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500">{ej.ventas}/{ej.meta} ventas</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tabActiva === "ejecutivos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comisiones.map((ej) => {
            const porcentajeMeta = Math.round((ej.ventas / ej.meta) * 100);
            const porcentajeMetaMonto = Math.round((ej.montoTotal / ej.metaMonto) * 100);
            return (
              <div key={ej.id} className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-[13px] font-bold"
                    style={{ backgroundColor: ej.color }}
                  >
                    {ej.avatar}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-800">{ej.nombre}</h4>
                    <span className="text-[10px] text-slate-400">{ej.rol}</span>
                  </div>
                </div>

                {/* Comisiones */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-emerald-50 rounded-lg p-2 text-center">
                    <div className="text-[13px] font-bold text-emerald-700">{formatoMonedaAbreviado(ej.comisionTotal)}</div>
                    <div className="text-[11px] text-emerald-500">Total</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <div className="text-[13px] font-bold text-blue-700">{formatoMonedaAbreviado(ej.comisionPagada)}</div>
                    <div className="text-[11px] text-blue-500">Pagada</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2 text-center">
                    <div className="text-[13px] font-bold text-amber-700">{formatoMonedaAbreviado(ej.comisionPendiente)}</div>
                    <div className="text-[11px] text-amber-500">Pendiente</div>
                  </div>
                </div>

                {/* Porcentaje de comisión editable */}
                <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-emerald-600 font-medium">Comisión</div>
                      <div className="text-[18px] font-bold text-emerald-700">{ej.porcentajeComision}%</div>
                    </div>
                    <button
                      onClick={() => setModalEditar(ej.id)}
                      className="p-2 bg-white hover:bg-emerald-100 rounded-lg transition-colors shadow-sm"
                      title="Editar porcentaje"
                    >
                      <Edit size={14} className="text-emerald-600" />
                    </button>
                  </div>
                </div>

                {/* Meta de ventas */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500">Meta de Ventas</span>
                    <span className="text-[10px] font-semibold text-slate-700">{ej.ventas}/{ej.meta}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                      style={{ width: `${porcentajeMeta}%` }}
                    />
                  </div>
                </div>

                {/* Meta de monto */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500">Meta de Monto</span>
                    <span className="text-[10px] font-semibold text-slate-700">{formatoMonedaAbreviado(ej.montoTotal)}/{formatoMonedaAbreviado(ej.metaMonto)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all"
                      style={{ width: `${porcentajeMetaMonto}%` }}
                    />
                  </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="text-[12px] font-bold text-slate-700">{ej.tasaConversion}%</div>
                    <div className="text-[11px] text-slate-400">Conversión</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="text-[12px] font-bold text-slate-700">{formatoMonedaAbreviado(ej.ticketPromedio)}</div>
                    <div className="text-[11px] text-slate-400">Ticket Prom.</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tabActiva === "pagos" && (
        <div className="space-y-4">
          {/* Resumen de pagos */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle size={18} className="text-emerald-500" />
                </div>
                <span className="text-[11px] font-semibold text-slate-600">Pagados</span>
              </div>
              <div className="text-xl font-bold text-emerald-600">{formatoMonedaAbreviado(stats.totalPagadas)}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock size={18} className="text-amber-500" />
                </div>
                <span className="text-[11px] font-semibold text-slate-600">Pendientes</span>
              </div>
              <div className="text-xl font-bold text-amber-600">{formatoMonedaAbreviado(stats.totalPendientes)}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Wallet size={18} className="text-blue-500" />
                </div>
                <span className="text-[11px] font-semibold text-slate-600">Por Pagar</span>
              </div>
              <div className="text-xl font-bold text-blue-600">{formatoMonedaAbreviado(stats.totalPendientes)}</div>
            </div>
          </div>

          {/* Botón pagar */}
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Procesar Pagos Pendientes</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {HISTORIAL_PAGOS.filter((p) => p.estado === "PENDIENTE").length} pagos pendientes por procesar
                </p>
              </div>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[11px] font-semibold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20">
                <Send size={14} /> Procesar Pagos
              </button>
            </div>
          </div>

          {/* Lista de pagos pendientes */}
          <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-soft">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-[11px] font-bold text-slate-600">Pagos Pendientes</h4>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Ejecutivo</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Monto</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Estado</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Fecha</th>
                  <th className="text-right px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {HISTORIAL_PAGOS.filter((p) => p.estado !== "PAGADO").map((pago) => (
                  <tr key={pago.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center text-[11px] font-bold text-white">
                          {pago.ejecutivo.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700">{pago.ejecutivo}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[12px] font-bold text-emerald-600">{formatoMoneda(pago.monto)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                        pago.estado === "PENDIENTE" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                      }`}>
                        {pago.estado === "PENDIENTE" ? "Pendiente" : "Procesando"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] text-slate-500">{pago.fecha.toLocaleDateString("es-CL")}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-semibold hover:bg-emerald-600 transition-colors">
                        Pagar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tabActiva === "historial" && (
        <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-soft">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Historial de Pagos</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Ejecutivo</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Monto</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Estado</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Método</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {HISTORIAL_PAGOS.map((pago) => (
                <tr key={pago.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center text-[11px] font-bold text-white">
                        {pago.ejecutivo.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">{pago.ejecutivo}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] font-bold text-emerald-600">{formatoMoneda(pago.monto)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                      pago.estado === "PAGADO" ? "bg-emerald-50 text-emerald-600" :
                      pago.estado === "PENDIENTE" ? "bg-amber-50 text-amber-600" :
                      "bg-blue-50 text-blue-600"
                    }`}>
                      {pago.estado === "PAGADO" ? "Pagado" : pago.estado === "PENDIENTE" ? "Pendiente" : "Procesando"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[11px] text-slate-500">{pago.metodo}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[11px] text-slate-500">{pago.fecha.toLocaleDateString("es-CL")}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Editar Porcentaje de Comisión */}
      {ejecutivoEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-[14px] font-bold"
                    style={{ backgroundColor: ejecutivoEditar.color }}
                  >
                    {ejecutivoEditar.avatar}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {ejecutivoEditar.nombre}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Editar porcentaje de comisión
                    </p>
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
              {/* Porcentaje actual */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 mb-6 border border-emerald-100">
                <div className="text-[10px] text-emerald-600 font-medium mb-1">Porcentaje Actual</div>
                <div className="text-3xl font-bold text-emerald-700">{ejecutivoEditar.porcentajeComision}%</div>
                <div className="text-[11px] text-emerald-600 mt-1">
                  Sobre {formatoMoneda(ejecutivoEditar.montoTotal)} en ventas
                </div>
              </div>

              {/* Input del nuevo porcentaje */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-slate-700">
                    Nuevo Porcentaje de Comisión (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="nuevoPorcentaje"
                      defaultValue={ejecutivoEditar.porcentajeComision}
                      min="0"
                      max="10"
                      step="0.1"
                      className="w-full h-12 px-4 pr-8 bg-white border-2 border-slate-200 rounded-xl text-[18px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-center"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>

                {/* Preview del cálculo */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Vista Previa del Cálculo
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Monto Total Ventas</span>
                      <span className="text-[12px] font-semibold text-slate-700">
                        {formatoMoneda(ejecutivoEditar.montoTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Porcentaje</span>
                      <span className="text-[12px] font-semibold text-emerald-600">
                        {ejecutivoEditar.porcentajeComision}%
                      </span>
                    </div>
                    <div className="h-px bg-slate-200 my-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-700">Nueva Comisión Total</span>
                      <span className="text-[14px] font-bold text-emerald-600">
                        {formatoMoneda(Math.round(ejecutivoEditar.montoTotal * (ejecutivoEditar.porcentajeComision / 100)))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Ya Pagado</span>
                      <span className="text-[12px] font-semibold text-blue-600">
                        {formatoMoneda(ejecutivoEditar.comisionPagada)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-700">Pendiente de Pago</span>
                      <span className="text-[12px] font-bold text-amber-600">
                        {formatoMoneda(Math.max(0, Math.round(ejecutivoEditar.montoTotal * (ejecutivoEditar.porcentajeComision / 100)) - ejecutivoEditar.comisionPagada))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botones de porcentaje rápido */}
                <div className="flex gap-2">
                  {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => {
                        const input = document.getElementById("nuevoPorcentaje") as HTMLInputElement;
                        if (input) input.value = pct.toString();
                      }}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                        ejecutivoEditar.porcentajeComision === pct
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setModalEditar(null)}
                className="px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById("nuevoPorcentaje") as HTMLInputElement;
                  const nuevoPorcentaje = parseFloat(input?.value || "0");
                  if (nuevoPorcentaje >= 0 && nuevoPorcentaje <= 10) {
                    handleGuardarPorcentaje(ejecutivoEditar.id, nuevoPorcentaje);
                  }
                }}
                className="px-5 py-2 bg-emerald-500 text-white text-[11px] font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <Check size={14} /> Guardar Porcentaje
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
