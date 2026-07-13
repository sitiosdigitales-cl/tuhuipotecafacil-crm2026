"use client";

import { useState, useMemo, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Wallet,
  BarChart3,
  Calendar,
  Search,
  Download,
  Edit,
  Target,
  FileText,
  Send,
  X,
} from "lucide-react";
import { formatoMoneda, formatoMonedaAbreviado } from "@/lib/utils";
import { toast } from "sonner";

// Datos mock de comisiones por ejecutivo
const COMISIONES_INICIALES = [
  {
    id: "e1",
    nombre: "Andrés Pérez",
    avatar: "AP",
    rol: "Admin",
    ventas: 45,
    montoTotal: 6750000000,
    porcentajeCobroCliente: 7,
    porcentajeComisionAgente: 15,
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
    porcentajeCobroCliente: 7,
    porcentajeComisionAgente: 15,
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
    porcentajeCobroCliente: 7,
    porcentajeComisionAgente: 15,
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
    porcentajeCobroCliente: 7,
    porcentajeComisionAgente: 15,
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
    porcentajeCobroCliente: 7,
    porcentajeComisionAgente: 15,
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

// Créditos aprobados con detalle
const CREDITOS_APROBADOS = [
  { id: "c1", cliente: "María González", rut: "12.345.678-5", montoCredito: 120000000, banco: "Banco de Chile", tasa: 4.75, plazo: 20, dividendo: 775468, ejecutivo: "Andrés Pérez", fechaAprobacion: new Date(Date.now() - 5 * 86400000), comision: 600000, estado: "DESEMBOLSADO" },
  { id: "c2", cliente: "Carlos Rojas", rut: "15.234.567-8", montoCredito: 95000000, banco: "Santander", tasa: 4.85, plazo: 25, dividendo: 543210, ejecutivo: "Andrés Pérez", fechaAprobacion: new Date(Date.now() - 8 * 86400000), comision: 475000, estado: "DESEMBOLSADO" },
  { id: "c3", cliente: "Juan Pérez", rut: "18.765.432-1", montoCredito: 150000000, banco: "Bci", tasa: 4.65, plazo: 20, dividendo: 962340, ejecutivo: "Carolina Muñoz", fechaAprobacion: new Date(Date.now() - 10 * 86400000), comision: 750000, estado: "DESEMBOLSADO" },
  { id: "c4", cliente: "Ana Torres", rut: "11.222.333-4", montoCredito: 80000000, banco: "Itaú", tasa: 4.90, plazo: 15, dividendo: 624180, ejecutivo: "Diego Silva", fechaAprobacion: new Date(Date.now() - 12 * 86400000), comision: 400000, estado: "EN_PROCESO" },
  { id: "c5", cliente: "Pedro Gómez", rut: "16.543.210-K", montoCredito: 200000000, banco: "Scotiabank", tasa: 4.55, plazo: 30, dividendo: 1024560, ejecutivo: "Carolina Muñoz", fechaAprobacion: new Date(Date.now() - 15 * 86400000), comision: 1000000, estado: "PENDIENTE_DESEMBOLSO" },
  { id: "c6", cliente: "Laura Sánchez", rut: "19.876.543-2", montoCredito: 110000000, banco: "Banco de Chile", tasa: 4.70, plazo: 20, dividendo: 712340, ejecutivo: "Diego Silva", fechaAprobacion: new Date(Date.now() - 18 * 86400000), comision: 550000, estado: "DESEMBOLSADO" },
  { id: "c7", cliente: "Roberto Silva", rut: "13.456.789-0", montoCredito: 175000000, banco: "Santander", tasa: 4.80, plazo: 25, dividendo: 998760, ejecutivo: "Valentina Torres", fechaAprobacion: new Date(Date.now() - 20 * 86400000), comision: 875000, estado: "DESEMBOLSADO" },
  { id: "c8", cliente: "Fernanda Rojas", rut: "17.654.321-K", montoCredito: 65000000, banco: "Bci", tasa: 4.95, plazo: 15, dividendo: 512340, ejecutivo: "Valentina Torres", fechaAprobacion: new Date(Date.now() - 22 * 86400000), comision: 325000, estado: "EN_PROCESO" },
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
  const [comisiones, setComisiones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState<"resumen" | "ejecutivos" | "creditos" | "pagos" | "historial">("resumen");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [mesSeleccionado, setMesSeleccionado] = useState("dic-2026");
  const [modalEditar, setModalEditar] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/comisiones");
        const json = await res.json();
        if (json.success && json.data) setComisiones(json.data);
      } catch { setComisiones([]); }
      finally { setCargando(false); }
    }
    cargar();
  }, []);

  const stats = useMemo(() => ({
    totalComisiones: comisiones.reduce((sum: number, e: any) => sum + (e.comisionTotal || 0), 0),
    totalPagadas: comisiones.reduce((sum: number, e: any) => sum + (e.comisionPagada || 0), 0),
    totalPendientes: comisiones.reduce((sum: number, e: any) => sum + (e.comisionPendiente || 0), 0),
    totalVentas: comisiones.reduce((sum: number, e: any) => sum + (e.ventas || 0), 0),
    promedioConversion: comisiones.length > 0 ? Math.round(comisiones.reduce((sum: number, e: any) => sum + (e.tasaConversion || 0), 0) / comisiones.length) : 0,
  }), [comisiones]);

  const ejecutivoTop = comisiones.length > 0 ? comisiones.reduce((prev: any, curr: any) =>
    curr.comisionTotal > prev.comisionTotal ? curr : prev
  ) : null;

  const ejecutivoEditar = comisiones.find((e) => e.id === modalEditar);

  const handleGuardarPorcentaje = (ejecutivoId: string, porcentajeCobro: number, porcentajeAgente: number) => {
    setComisiones((prev) =>
      prev.map((e) => {
        if (e.id === ejecutivoId) {
          // Calcular comisión de la empresa (lo que se cobra al cliente)
          const comisionEmpresa = Math.round(e.montoTotal * (porcentajeCobro / 100));
          // Calcular comisión del agente (porcentaje de la comisión de la empresa)
          const nuevaComisionTotal = Math.round(comisionEmpresa * (porcentajeAgente / 100));
          const nuevaComisionPendiente = nuevaComisionTotal - e.comisionPagada;
          return {
            ...e,
            porcentajeCobroCliente: porcentajeCobro,
            porcentajeComisionAgente: porcentajeAgente,
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
        <div className="flex gap-1 flex-wrap">
          {[
            { id: "resumen", label: "Resumen", icono: BarChart3 },
            { id: "ejecutivos", label: "Por Ejecutivo", icono: Users },
            { id: "creditos", label: "Créditos Aprobados", icono: FileText },
            { id: "pagos", label: "Pagos", icono: CreditCard },
            { id: "historial", label: "Historial", icono: Clock },
          ].map((tab) => {
            const IconoTab = tab.icono;
            return (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-semibold transition-all ${
                  tabActiva === tab.id
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <IconoTab size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido por tab */}
      {tabActiva === "ejecutivos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comisiones.map((ej) => {
            const porcentajeMeta = Math.round((ej.ventas / ej.meta) * 100);
            const porcentajeMetaMonto = Math.round((ej.montoTotal / ej.metaMonto) * 100);
            const porcentajePagado = ej.comisionTotal > 0 ? Math.round((ej.comisionPagada / ej.comisionTotal) * 100) : 0;
            return (
              <div key={ej.id} className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-soft hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shadow-lg"
                    style={{ backgroundColor: ej.color }}
                  >
                    {ej.avatar}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[13px] font-bold text-slate-800">{ej.nombre}</h4>
                    <span className="text-[10px] text-slate-400">{ej.rol}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-slate-400">Cliente / Agente</div>
                    <div className="text-[12px] font-bold text-emerald-600">{ej.porcentajeCobroCliente}% / {ej.porcentajeComisionAgente}%</div>
                  </div>
                </div>

                {/* Total a pagar - prominente */}
                <div className="mb-4 p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white">
                  <div className="text-[10px] font-semibold opacity-80 mb-1">Total Comisión a Pagar</div>
                  <div className="text-2xl font-bold">{formatoMoneda(ej.comisionTotal)}</div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <CheckCircle size={10} className="opacity-80" />
                      <span className="text-[9px] opacity-90">Pagada: {formatoMoneda(ej.comisionPagada)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="opacity-80" />
                      <span className="text-[9px] opacity-90">Pendiente: {formatoMoneda(ej.comisionPendiente)}</span>
                    </div>
                  </div>
                </div>

                {/* Barra de progreso pagado/pendiente */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500">Progreso de Pago</span>
                    <span className="text-[10px] font-semibold text-slate-700">{porcentajePagado}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${porcentajePagado}%` }}
                    />
                    <div
                      className="h-full bg-amber-400 transition-all"
                      style={{ width: `${100 - porcentajePagado}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span className="text-[9px] text-slate-500">Pagado</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-amber-400 rounded-full" />
                      <span className="text-[9px] text-slate-500">Pendiente</span>
                    </div>
                  </div>
                </div>

                {/* Meta de ventas */}
                <div className="mb-3">
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
                <div className="mb-3">
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
                    <div className="text-[10px] text-slate-400">Conversión</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <div className="text-[12px] font-bold text-slate-700">{formatoMonedaAbreviado(ej.ticketPromedio)}</div>
                    <div className="text-[10px] text-slate-400">Ticket Prom.</div>
                  </div>
                </div>
              </div>
            );
          })}
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
                      <div className="text-[14px] font-bold text-emerald-700">{ej.porcentajeCobroCliente}% / {ej.porcentajeComisionAgente}%</div>
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

      {/* Tab Créditos Aprobados */}
      {tabActiva === "creditos" && (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
              <div className="text-[10px] text-slate-400 font-medium mb-1">Total Créditos</div>
              <div className="text-xl font-bold text-slate-800">{CREDITOS_APROBADOS.length}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
              <div className="text-[10px] text-slate-400 font-medium mb-1">Monto Total Financiado</div>
              <div className="text-xl font-bold text-blue-600">{formatoMoneda(CREDITOS_APROBADOS.reduce((sum, c) => sum + c.montoCredito, 0))}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
              <div className="text-[10px] text-slate-400 font-medium mb-1">Comisiones Generadas</div>
              <div className="text-xl font-bold text-emerald-600">{formatoMoneda(CREDITOS_APROBADOS.reduce((sum, c) => sum + c.comision, 0))}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100/80 p-4 shadow-soft">
              <div className="text-[10px] text-slate-400 font-medium mb-1">Dividendo Promedio</div>
              <div className="text-xl font-bold text-purple-600">{formatoMoneda(Math.round(CREDITOS_APROBADOS.reduce((sum, c) => sum + c.dividendo, 0) / CREDITOS_APROBADOS.length))}</div>
            </div>
          </div>

          {/* Tabla de créditos */}
          <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-soft">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Detalle de Créditos Aprobados</h3>
              <span className="text-[10px] text-slate-400">{CREDITOS_APROBADOS.length} créditos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Cliente</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">RUT</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Monto Crédito</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Banco</th>
                    <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Tasa</th>
                    <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Plazo</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Dividendo</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Ejecutivo</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Comisión</th>
                    <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {CREDITOS_APROBADOS.map((credito) => (
                    <tr key={credito.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold text-slate-700">{credito.cliente}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-slate-500">{credito.rut}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[11px] font-bold text-blue-600">{formatoMoneda(credito.montoCredito)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-slate-600">{credito.banco}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] font-semibold text-emerald-600">{credito.tasa}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] text-slate-600">{credito.plazo} años</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[11px] font-semibold text-slate-700">{formatoMoneda(credito.dividendo)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-slate-600">{credito.ejecutivo}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[11px] font-bold text-emerald-600">{formatoMoneda(credito.comision)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${
                          credito.estado === "DESEMBOLSADO" ? "bg-emerald-50 text-emerald-600" :
                          credito.estado === "EN_PROCESO" ? "bg-blue-50 text-blue-600" :
                          "bg-amber-50 text-amber-600"
                        }`}>
                          {credito.estado === "DESEMBOLSADO" ? "Desembolsado" :
                           credito.estado === "EN_PROCESO" ? "En Proceso" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td colSpan={2} className="px-4 py-3 text-[11px] font-bold text-slate-700">Totales</td>
                    <td className="px-4 py-3 text-right text-[11px] font-bold text-blue-600">{formatoMoneda(CREDITOS_APROBADOS.reduce((sum, c) => sum + c.montoCredito, 0))}</td>
                    <td colSpan={3} className="px-4 py-3 text-center text-[10px] text-slate-500">{CREDITOS_APROBADOS.length} créditos</td>
                    <td className="px-4 py-3 text-right text-[11px] font-bold text-slate-700">{formatoMoneda(CREDITOS_APROBADOS.reduce((sum, c) => sum + c.dividendo, 0))}</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right text-[11px] font-bold text-emerald-600">{formatoMoneda(CREDITOS_APROBADOS.reduce((sum, c) => sum + c.comision, 0))}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
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
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden">
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
                      Configurar comisiones del ejecutivo
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
              {/* Resumen actual */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 mb-6 border border-emerald-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-emerald-600 font-medium mb-1">% Cobro al Cliente</div>
                    <div className="text-2xl font-bold text-emerald-700">{ejecutivoEditar.porcentajeCobroCliente}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-600 font-medium mb-1">% Comisión Agente</div>
                    <div className="text-2xl font-bold text-emerald-700">{ejecutivoEditar.porcentajeComisionAgente}%</div>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-600 mt-2">
                  Sobre {formatoMoneda(ejecutivoEditar.montoTotal)} en ventas
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                {/* Porcentaje cobrado al cliente */}
                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-slate-700">
                    % Cobrado al Cliente (Comisión Empresa)
                  </label>
                  <p className="text-[10px] text-slate-400">Porcentaje que se cobra al cliente sobre el monto del crédito</p>
                  <div className="relative">
                    <input
                      type="number"
                      id="porcentajeCobro"
                      defaultValue={ejecutivoEditar.porcentajeCobroCliente}
                      min="1"
                      max="15"
                      step="0.5"
                      className="w-full h-12 px-4 pr-8 bg-white border-2 border-slate-200 rounded-xl text-[18px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-center"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">%</span>
                  </div>
                  <div className="flex gap-2">
                    {[5, 6, 7, 8, 9, 10].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          const input = document.getElementById("porcentajeCobro") as HTMLInputElement;
                          if (input) input.value = pct.toString();
                        }}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Porcentaje que gana el agente */}
                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-slate-700">
                    % Comisión del Agente
                  </label>
                  <p className="text-[10px] text-slate-400">Porcentaje de la comisión de la empresa que recibe el agente</p>
                  <div className="relative">
                    <input
                      type="number"
                      id="porcentajeAgente"
                      defaultValue={ejecutivoEditar.porcentajeComisionAgente}
                      min="5"
                      max="50"
                      step="5"
                      className="w-full h-12 px-4 pr-8 bg-white border-2 border-slate-200 rounded-xl text-[18px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-center"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">%</span>
                  </div>
                  <div className="flex gap-2">
                    {[10, 15, 20, 25, 30, 40].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          const input = document.getElementById("porcentajeAgente") as HTMLInputElement;
                          if (input) input.value = pct.toString();
                        }}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview del cálculo */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Cálculo de Comisiones
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Monto Total Ventas</span>
                      <span className="text-[12px] font-semibold text-slate-700">{formatoMoneda(ejecutivoEditar.montoTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Comisión Empresa (cobro al cliente)</span>
                      <span className="text-[12px] font-semibold text-blue-600">
                        {formatoMoneda(Math.round(ejecutivoEditar.montoTotal * (ejecutivoEditar.porcentajeCobroCliente / 100)))}
                      </span>
                    </div>
                    <div className="h-px bg-slate-200 my-1" />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Comisión Agente ({ejecutivoEditar.porcentajeComisionAgente}% de empresa)</span>
                      <span className="text-[12px] font-semibold text-emerald-600">
                        {formatoMoneda(Math.round(ejecutivoEditar.montoTotal * (ejecutivoEditar.porcentajeCobroCliente / 100) * (ejecutivoEditar.porcentajeComisionAgente / 100)))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Ya Pagado</span>
                      <span className="text-[12px] font-semibold text-blue-600">{formatoMoneda(ejecutivoEditar.comisionPagada)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-700">Pendiente de Pago</span>
                      <span className="text-[12px] font-bold text-amber-600">
                        {formatoMoneda(Math.max(0, Math.round(ejecutivoEditar.montoTotal * (ejecutivoEditar.porcentajeCobroCliente / 100) * (ejecutivoEditar.porcentajeComisionAgente / 100)) - ejecutivoEditar.comisionPagada))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setModalEditar(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[12px] font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const cobro = parseFloat((document.getElementById("porcentajeCobro") as HTMLInputElement)?.value || "7");
                      const agente = parseFloat((document.getElementById("porcentajeAgente") as HTMLInputElement)?.value || "15");
                      handleGuardarPorcentaje(ejecutivoEditar.id, cobro, agente);
                      toast.success("Comisiones actualizadas", {
                        description: `${ejecutivoEditar.nombre}: ${cobro}% cliente, ${agente}% agente`,
                      });
                    }}
                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-[12px] font-semibold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20"
                   >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
