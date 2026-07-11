"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  Globe,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Filter,
  Download,
  ChevronRight,
  Percent,
  FileText,
  Calendar,
  Target,
  Award,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { ETAPAS_CONFIG } from "@/tipos";
import { formatoMonedaAbreviado, formatoUF } from "@/lib/utils";
import { useLeads } from "@/lib/contexts/LeadContext";

// Datos detallados de bancos
const BANCOS_DETALLE = [
  {
    id: "chile",
    nombre: "Banco de Chile",
    color: "#E31837",
    logo: "🇨🇱",
    tasaBase: 4.99,
    tasaDescuento: 4.49,
    cae: 5.2,
    plazoMaximo: 30,
    montoMaximo: 5000,
    pieMinimo: 20,
    requisitos: ["Renta mínima $ 800.000", "Antigüedad 12 meses", "Sin DICOM"],
    contacto: { nombre: "Carlos Mendoza", cargo: "Gerente Comercial", email: "cmendoza@chile.cl", telefono: "+56 2 2653 1000" },
    convenio: "Premium",
    estado: "ACTIVO",
    aprobados: 145,
    enProceso: 52,
    rechazados: 18,
    montoTotal: 3250000000,
    satisfaccion: 92,
  },
  {
    id: "santander",
    nombre: "Santander",
    color: "#EC0000",
    logo: "🔴",
    tasaBase: 5.19,
    tasaDescuento: 4.69,
    cae: 5.4,
    plazoMaximo: 30,
    montoMaximo: 4500,
    pieMinimo: 20,
    requisitos: ["Renta mínima $750.000", "Antigüedad 6 meses", "Score mínimo 650"],
    contacto: { nombre: "María López", cargo: "Directora Hipotecario", email: "mlopez@santander.cl", telefono: "+56 2 2658 2000" },
    convenio: "Gold",
    estado: "ACTIVO",
    aprobados: 128,
    enProceso: 48,
    rechazados: 22,
    montoTotal: 2980000000,
    satisfaccion: 89,
  },
  {
    id: "bci",
    nombre: "Bci",
    color: "#003DA5",
    logo: "🔵",
    tasaBase: 5.09,
    tasaDescuento: 4.59,
    cae: 5.3,
    plazoMaximo: 30,
    montoMaximo: 4800,
    pieMinimo: 20,
    requisitos: ["Renta mínima $700.000", "Antigüedad 9 meses", "Preaprobación digital"],
    contacto: { nombre: "Roberto Soto", cargo: "Jefe Ventas Hipotecarias", email: "rsoto@bci.cl", telefono: "+56 2 2669 3000" },
    convenio: "Premium",
    estado: "ACTIVO",
    aprobados: 112,
    enProceso: 45,
    rechazados: 15,
    montoTotal: 2450000000,
    satisfaccion: 91,
  },
  {
    id: "itau",
    nombre: "Itaú",
    color: "#F7941D",
    logo: "🟠",
    tasaBase: 5.29,
    tasaDescuento: 4.79,
    cae: 5.5,
    plazoMaximo: 25,
    montoMaximo: 4000,
    pieMinimo: 20,
    requisitos: ["Renta mínima $ 850.000", "Antigüedad 12 meses", "No estar en DICOM"],
    contacto: { nombre: "Ana García", cargo: "Subgerente Hipotecario", email: "agarcia@itau.cl", telefono: "+56 2 2661 4000" },
    convenio: "Silver",
    estado: "ACTIVO",
    aprobados: 95,
    enProceso: 38,
    rechazados: 12,
    montoTotal: 2100000000,
    satisfaccion: 87,
  },
  {
    id: "scotiabank",
    nombre: "Scotiabank",
    color: "#EC111A",
    logo: "🔴",
    tasaBase: 5.39,
    tasaDescuento: 4.89,
    cae: 5.6,
    plazoMaximo: 30,
    montoMaximo: 4200,
    pieMinimo: 20,
    requisitos: ["Renta mínima $800.000", "Antigüedad 12 meses", "Evaluación integral"],
    contacto: { nombre: "Pedro Morales", cargo: "Director Comercial", email: "pmorales@scotiabank.cl", telefono: "+56 2 2659 5000" },
    convenio: "Gold",
    estado: "ACTIVO",
    aprobados: 88,
    enProceso: 35,
    rechazados: 14,
    montoTotal: 1850000000,
    satisfaccion: 85,
  },
  {
    id: "estado",
    nombre: "Banco Estado",
    color: "#0055A5",
    logo: "🏛️",
    tasaBase: 4.89,
    tasaDescuento: 4.39,
    cae: 5.1,
    plazoMaximo: 30,
    montoMaximo: 3500,
    pieMinimo: 10,
    requisitos: ["Renta mínima $500.000", "Primer hogar", "Subsidio DS1"],
    contacto: { nombre: "Laura Fernández", cargo: "Jefa Segmento Hipotecario", email: "lfernandez@bancoestado.cl", telefono: "+56 2 2661 1000" },
    convenio: "Especial",
    estado: "ACTIVO",
    aprobados: 76,
    enProceso: 42,
    rechazados: 8,
    montoTotal: 1520000000,
    satisfaccion: 94,
  },
  {
    id: "falabella",
    nombre: "Falabella",
    color: "#009B3A",
    logo: "🟢",
    tasaBase: 5.49,
    tasaDescuento: 4.99,
    cae: 5.7,
    plazoMaximo: 25,
    montoMaximo: 3800,
    pieMinimo: 20,
    requisitos: ["Renta mínima $700.000", "Antigüedad 6 meses", "Cuenta corriente activa"],
    contacto: { nombre: "Cristián Reyes", cargo: "Gerente Hipotecario", email: "creyes@falabella.cl", telefono: "+56 2 2660 6000" },
    convenio: "Standard",
    estado: "ACTIVO",
    aprobados: 62,
    enProceso: 28,
    rechazados: 10,
    montoTotal: 980000000,
    satisfaccion: 83,
  },
  {
    id: "corpgroup",
    nombre: "CorpGroup",
    color: "#6B21A8",
    logo: "🟣",
    tasaBase: 5.59,
    tasaDescuento: 5.09,
    cae: 5.8,
    plazoMaximo: 20,
    montoMaximo: 3000,
    pieMinimo: 20,
    requisitos: ["Renta mínima $900.000", "Antigüedad 18 meses", "Sin限制es"],
    contacto: { nombre: "Fernando Castro", cargo: "Director de Negocios", email: "fcastro@corpgroup.cl", telefono: "+56 2 2662 7000" },
    convenio: "Standard",
    estado: "INACTIVO",
    aprobados: 45,
    enProceso: 18,
    rechazados: 8,
    montoTotal: 680000000,
    satisfaccion: 80,
  },
];

// Evolución mensual por banco
const EVOLUCION_BANCOS = [
  { mes: "Ene", chile: 12, santander: 10, bci: 8, itau: 7, scotia: 6 },
  { mes: "Feb", chile: 14, santander: 11, bci: 9, itau: 8, scotia: 7 },
  { mes: "Mar", chile: 16, santander: 13, bci: 11, itau: 9, scotia: 8 },
  { mes: "Abr", chile: 13, santander: 12, bci: 10, itau: 8, scotia: 7 },
  { mes: "May", chile: 15, santander: 14, bci: 12, itau: 10, scotia: 9 },
  { mes: "Jun", chile: 18, santander: 15, bci: 13, itau: 11, scotia: 10 },
  { mes: "Jul", chile: 16, santander: 14, bci: 12, itau: 10, scotia: 9 },
  { mes: "Ago", chile: 14, santander: 13, bci: 11, itau: 9, scotia: 8 },
  { mes: "Sep", chile: 17, santander: 16, bci: 14, itau: 12, scotia: 11 },
  { mes: "Oct", chile: 19, santander: 17, bci: 15, itau: 13, scotia: 12 },
  { mes: "Nov", chile: 18, santander: 16, bci: 14, itau: 12, scotia: 11 },
  { mes: "Dic", chile: 15, santander: 14, bci: 12, itau: 10, scotia: 9 },
];

const VISTAS = [
  { id: "grid", label: "Cuadrícula", icono: "grid" },
  { id: "list", label: "Lista", icono: "list" },
  { id: "chart", label: "Gráficos", icono: "chart" },
];

export default function BancosPage() {
  const { leads } = useLeads();
  const [vista, setVista] = useState("grid");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [bancoSeleccionado, setBancoSeleccionado] = useState<string | null>(null);

  // Leads por banco
  const leadsPorBanco = useMemo(() => {
    const porBanco: Record<string, number> = {};
    leads.forEach((l) => {
      if (l.banco) porBanco[l.banco] = (porBanco[l.banco] || 0) + 1;
    });
    return porBanco;
  }, [leads]);

  // Bancos filtrados
  const bancosFiltrados = useMemo(() => {
    return BANCOS_DETALLE.filter((banco) => {
      const coincideBusqueda = !busqueda || banco.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEstado = filtroEstado === "todos" || banco.estado === filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
  }, [busqueda, filtroEstado]);

  // Estadísticas generales
  const stats = useMemo(() => {
    const totalAprobados = BANCOS_DETALLE.reduce((acc, b) => acc + b.aprobados, 0);
    const totalMonto = BANCOS_DETALLE.reduce((acc, b) => acc + b.montoTotal, 0);
    const promedioSatisfaccion = Math.round(BANCOS_DETALLE.reduce((acc, b) => acc + b.satisfaccion, 0) / BANCOS_DETALLE.length);
    return { totalAprobados, totalMonto, promedioSatisfaccion };
  }, []);

  // Datos para gráfico de aprobados
  const datosAprobados = useMemo(() => {
    return BANCOS_DETALLE.map((b) => ({
      nombre: b.nombre.split(" ").slice(-1)[0],
      aprobados: b.aprobados,
      enProceso: b.enProceso,
      rechazados: b.rechazados,
      color: b.color,
    }));
  }, []);

  const bancoDetalle = bancoSeleccionado ? BANCOS_DETALLE.find((b) => b.id === bancoSeleccionado) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Bancos Aliados</h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {BANCOS_DETALLE.length} bancos • {stats.totalAprobados} créditos aprobados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200/60 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <Download size={14} /> Exportar
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2.5 gradient-primary text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/15">
            <Plus size={14} /> Nuevo Banco
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100/80 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Total Bancos</div>
              <div className="text-xl font-bold text-slate-900">{BANCOS_DETALLE.length}</div>
            </div>
          </div>
          <div className="text-[9px] text-emerald-600 font-medium">{BANCOS_DETALLE.filter(b => b.estado === "ACTIVO").length} activos</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100/80 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Créditos Aprobados</div>
              <div className="text-xl font-bold text-slate-900">{stats.totalAprobados}</div>
            </div>
          </div>
          <div className="text-[9px] text-emerald-600 font-medium">+12% vs mes anterior</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100/80 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign size={18} className="text-purple-600" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Monto Total</div>
              <div className="text-xl font-bold text-slate-900">{formatoMonedaAbreviado(stats.totalMonto)}</div>
            </div>
          </div>
          <div className="text-[9px] text-purple-600 font-medium">{formatoUF(stats.totalMonto)}</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100/80 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Star size={18} className="text-amber-600" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Satisfacción Promedio</div>
              <div className="text-xl font-bold text-slate-900">{stats.promedioSatisfaccion}%</div>
            </div>
          </div>
          <div className="text-[9px] text-amber-600 font-medium">+3% vs trimestre</div>
        </div>
      </div>

      {/* Filtros y Vista */}
      <div className="bg-white rounded-xl p-4 border border-slate-100/80">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar banco..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {["todos", "ACTIVO", "INACTIVO"].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-2 rounded-xl text-[10px] font-semibold transition-colors ${
                  filtroEstado === estado
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-slate-200/60 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {estado === "todos" ? "Todos" : estado}
              </button>
            ))}
          </div>
          <div className="flex bg-slate-100 rounded-xl p-0.5">
            {VISTAS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVista(v.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  vista === v.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vista de Cuadrícula */}
      {vista === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {bancosFiltrados.map((banco) => {
            const leadsBanco = leadsPorBanco[banco.nombre] || 0;
            return (
              <div
                key={banco.id}
                onClick={() => setBancoSeleccionado(banco.id)}
                className="bg-white rounded-2xl border border-slate-100/80 p-5 hover:shadow-lg hover:border-slate-200 transition-all cursor-pointer group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                      style={{ backgroundColor: `${banco.color}15` }}
                    >
                      {banco.logo}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{banco.nombre}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                            banco.estado === "ACTIVO"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {banco.estado}
                        </span>
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          {banco.convenio}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-slate-100 rounded-lg transition-all">
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>
                </div>

                {/* Tasas */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <div className="text-[8px] text-slate-400 uppercase">Tasa Base</div>
                    <div className="text-lg font-bold text-slate-900">{banco.tasaBase}%</div>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl">
                    <div className="text-[8px] text-emerald-600 uppercase">Tasa Descuento</div>
                    <div className="text-lg font-bold text-emerald-700">{banco.tasaDescuento}%</div>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-emerald-50 rounded-lg">
                    <div className="text-[8px] text-emerald-600">Aprobados</div>
                    <div className="text-sm font-bold text-emerald-700">{banco.aprobados}</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="text-[8px] text-blue-600">En Proceso</div>
                    <div className="text-sm font-bold text-blue-700">{banco.enProceso}</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <div className="text-[8px] text-red-600">Rechazados</div>
                    <div className="text-sm font-bold text-red-700">{banco.rechazados}</div>
                  </div>
                </div>

                {/* Monto y Leads */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <div className="text-[9px] text-slate-400">Monto Total</div>
                    <div className="text-xs font-bold text-slate-800">{formatoMonedaAbreviado(banco.montoTotal)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-slate-400">Leads Activos</div>
                    <div className="text-xs font-bold text-slate-800">{leadsBanco}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={10} className="text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-bold text-slate-700">{banco.satisfaccion}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista de Lista */}
      {vista === "list" && (
        <div className="bg-white rounded-2xl border border-slate-100/80 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase">Banco</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase">Tasas</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase">Rendimiento</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase">Monto</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase">Satisfacción</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bancosFiltrados.map((banco) => (
                <tr
                  key={banco.id}
                  onClick={() => setBancoSeleccionado(banco.id)}
                  className="border-b border-slate-50/80 hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${banco.color}15` }}
                      >
                        {banco.logo}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-800">{banco.nombre}</div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded ${
                            banco.estado === "ACTIVO" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                          }`}>
                            {banco.estado}
                          </span>
                          <span className="text-[8px] text-slate-400">{banco.convenio}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[11px] font-bold text-slate-800">{banco.tasaBase}%</div>
                    <div className="text-[9px] text-emerald-600">Descuento: {banco.tasaDescuento}%</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <CheckCircle size={10} className="text-emerald-500" />
                        <span className="text-[10px] text-emerald-600">{banco.aprobados}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={10} className="text-blue-500" />
                        <span className="text-[10px] text-blue-600">{banco.enProceso}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle size={10} className="text-red-500" />
                        <span className="text-[10px] text-red-600">{banco.rechazados}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[11px] font-bold text-slate-800">{formatoMonedaAbreviado(banco.montoTotal)}</div>
                    <div className="text-[9px] text-slate-400">{formatoUF(banco.montoTotal)}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Star size={10} className="text-amber-500 fill-amber-500" />
                      <span className="text-[11px] font-bold text-slate-800">{banco.satisfaccion}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                        <Eye size={12} className="text-slate-400" />
                      </button>
                      <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                        <Pencil size={12} className="text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vista de Gráficos */}
      {vista === "chart" && (
        <div className="grid grid-cols-2 gap-5">
          {/* Rendimiento por Banco */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Créditos por Banco</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosAprobados}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "11px" }} />
                <Bar dataKey="aprobados" name="Aprobados" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="enProceso" name="En Proceso" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rechazados" name="Rechazados" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Evolución Mensual */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Evolución Mensual</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={EVOLUCION_BANCOS}>
                <defs>
                  <linearGradient id="colorChile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E31837" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E31837" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSantander" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC0000" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EC0000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "11px" }} />
                <Area type="monotone" dataKey="chile" name="Chile" stroke="#E31837" fill="url(#colorChile)" strokeWidth={2} />
                <Area type="monotone" dataKey="santander" name="Santander" stroke="#EC0000" fill="url(#colorSantander)" strokeWidth={2} />
                <Area type="monotone" dataKey="bci" name="Bci" stroke="#003DA5" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="itau" name="Itaú" stroke="#F7941D" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="scotia" name="Scotiabank" stroke="#EC111A" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Panel de Detalle del Banco */}
      {bancoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[900px] max-h-[85vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-100" style={{ borderTop: `4px solid ${bancoDetalle.color}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                    style={{ backgroundColor: `${bancoDetalle.color}15` }}
                  >
                    {bancoDetalle.logo}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{bancoDetalle.nombre}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                        bancoDetalle.estado === "ACTIVO" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}>
                        {bancoDetalle.estado}
                      </span>
                      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                        Convenio {bancoDetalle.convenio}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setBancoSeleccionado(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <span className="text-slate-400 text-xl">×</span>
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
              <div className="grid grid-cols-3 gap-6">
                {/* Columna 1: Tasas y Condiciones */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4">
                    <h4 className="text-[10px] text-slate-400 uppercase font-medium mb-3">Tasas de Interés</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-600">Tasa Base</span>
                        <span className="text-sm font-bold text-slate-900">{bancoDetalle.tasaBase}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-600">Tasa con Descuento</span>
                        <span className="text-sm font-bold text-emerald-600">{bancoDetalle.tasaDescuento}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-600">CAE</span>
                        <span className="text-sm font-bold text-slate-900">{bancoDetalle.cae}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-[10px] text-slate-400 uppercase font-medium mb-3">Condiciones</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Plazo Máximo</span>
                        <span className="text-[11px] font-semibold text-slate-800">{bancoDetalle.plazoMaximo} años</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Monto Máximo</span>
                        <span className="text-[11px] font-semibold text-slate-800">${bancoDetalle.montoMaximo} UF</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Pie Mínimo</span>
                        <span className="text-[11px] font-semibold text-slate-800">{bancoDetalle.pieMinimo}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="text-[10px] text-blue-600 uppercase font-medium mb-2">Requisitos</h4>
                    <ul className="space-y-1.5">
                      {bancoDetalle.requisitos.map((req, i) => (
                        <li key={i} className="flex items-center gap-2 text-[10px] text-slate-700">
                          <CheckCircle size={10} className="text-blue-500 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Columna 2: Estadísticas */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-emerald-700">{bancoDetalle.aprobados}</div>
                      <div className="text-[9px] text-emerald-600 font-medium">Aprobados</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-blue-700">{bancoDetalle.enProceso}</div>
                      <div className="text-[9px] text-blue-600 font-medium">En Proceso</div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-red-700">{bancoDetalle.rechazados}</div>
                      <div className="text-[9px] text-red-600 font-medium">Rechazados</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center">
                      <div className="text-xl font-bold text-purple-700">{formatoMonedaAbreviado(bancoDetalle.montoTotal)}</div>
                      <div className="text-[9px] text-purple-600 font-medium">Monto Total</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-[10px] text-slate-400 uppercase font-medium mb-3">Tasa de Aprobación</h4>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(bancoDetalle.aprobados / (bancoDetalle.aprobados + bancoDetalle.rechazados)) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] text-slate-400">0%</span>
                      <span className="text-[10px] font-bold text-slate-700">
                        {((bancoDetalle.aprobados / (bancoDetalle.aprobados + bancoDetalle.rechazados)) * 100).toFixed(0)}%
                      </span>
                      <span className="text-[9px] text-slate-400">100%</span>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span className="text-[10px] font-semibold text-amber-700">Satisfacción del Cliente</span>
                    </div>
                    <div className="text-3xl font-bold text-amber-700">{bancoDetalle.satisfaccion}%</div>
                  </div>
                </div>

                {/* Columna 3: Contacto */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4">
                    <h4 className="text-[10px] text-slate-400 uppercase font-medium mb-3">Contacto del Banco</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                          <Users size={12} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Nombre</div>
                          <div className="text-[11px] font-semibold text-slate-800">{bancoDetalle.contacto.nombre}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                          <Award size={12} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Cargo</div>
                          <div className="text-[11px] font-semibold text-slate-800">{bancoDetalle.contacto.cargo}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                          <Mail size={12} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Email</div>
                          <div className="text-[11px] font-semibold text-slate-800">{bancoDetalle.contacto.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                          <Phone size={12} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Teléfono</div>
                          <div className="text-[11px] font-semibold text-slate-800">{bancoDetalle.contacto.telefono}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-semibold hover:bg-emerald-600 transition-colors">
                      <Phone size={12} /> Llamar
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-500 text-white rounded-xl text-[10px] font-semibold hover:bg-blue-600 transition-colors">
                      <Mail size={12} /> Email
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-semibold hover:bg-slate-200 transition-colors">
                      <Globe size={12} /> Web
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
