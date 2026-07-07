"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Calendar,
  Building2,
  RefreshCw,
  Download,
  Share2,
  Info,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Clock,
  FileText,
  Home,
  Wallet,
  Percent,
  ArrowRight,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const VALOR_UF_CLP = 38957.56;

interface TasaData {
  fecha: string;
  tipoOperacion: string;
  tasa: number;
  moneda: string;
}

interface SeguroConfig {
  id: string;
  nombre: string;
  descripcion: string;
  tasaMensual: number;
  base: "credito" | "propiedad" | "balance";
  obligatorio: boolean;
  icono: typeof Shield;
  color: string;
  calculoDetalle: string;
}

interface GastoAdicional {
  id: string;
  nombre: string;
  monto: number;
  porcentaje?: number;
  esPorcentaje: boolean;
  obligatorio: boolean;
  descripcion: string;
}

interface ResultadoSimulacion {
  dividendoBase: number;
  cae: number;
  costoTotal: number;
  interesesTotales: number;
  tasaUtilizada: number;
  seguros: {
    id: string;
    nombre: string;
    montoMensual: number;
    montoAnual: number;
  }[];
  dividendoTotal: number;
  costoSegurosAnual: number;
  gastosAdicionales: number;
  totalInversionInicial: number;
  cuotaAntesSeguros: number;
}

const SEGROS_HIPOTECARIOS: SeguroConfig[] = [
  {
    id: "desgravamen",
    nombre: "Seguro de Desgravamen",
    descripcion: "Cubre el saldo insoluto en caso de fallecimiento o incapacidad total permanente",
    tasaMensual: 0.00025,
    base: "credito",
    obligatorio: true,
    icono: ShieldCheck,
    color: "blue",
    calculoDetalle: "Tasa promedio: 0.025% mensual sobre monto del credito",
  },
  {
    id: "riesgo",
    nombre: "Seguro de Riesgo (Incendio y Sismo)",
    descripcion: "Protege la propiedad contra incendio, explosion, terremoto y erupcion volcanica",
    tasaMensual: 0.0000375,
    base: "propiedad",
    obligatorio: true,
    icono: ShieldAlert,
    color: "amber",
    calculoDetalle: "Tasa promedio: 0.045% anual sobre valor de la propiedad",
  },
  {
    id: "cesantia",
    nombre: "Seguro de Cesantia y Privacion de Fuero",
    descripcion: "Cubre el dividendo mensual en caso de cesantia involuntaria o despido injustificado",
    tasaMensual: 0.000208,
    base: "credito",
    obligatorio: false,
    icono: Shield,
    color: "emerald",
    calculoDetalle: "Tasa promedio: 0.25% anual sobre monto del credito",
  },
];

const GASTOS_ADICIONALES: GastoAdicional[] = [
  {
    id: "avaluo",
    nombre: "Comision de Avaluo",
    monto: 0,
    porcentaje: 0.0025,
    esPorcentaje: true,
    obligatorio: true,
    descripcion: "Costo del avaluo comercial de la propiedad (0.15% - 0.35% del valor)",
  },
  {
    id: "administracion",
    nombre: "Comision de Administracion",
    monto: 0,
    porcentaje: 0.005,
    esPorcentaje: true,
    obligatorio: true,
    descripcion: "Comision mensual por administracion del credito (0.04% - 0.1% mensual)",
  },
  {
    id: "notaria",
    nombre: "Gastos Notariales",
    monto: 250000,
    esPorcentaje: false,
    obligatorio: true,
    descripcion: "Escritura publica y constitucion de hipoteca (estimado)",
  },
  {
    id: "inscripcion",
    nombre: "Inscripcion en Conservador",
    monto: 150000,
    esPorcentaje: false,
    obligatorio: true,
    descripcion: "Inscripcion de la hipoteca en el Conservador de Bienes Raices",
  },
  {
    id: "contribuciones",
    nombre: "Contribuciones Anuales",
    monto: 0,
    porcentaje: 0.011,
    esPorcentaje: true,
    obligatorio: true,
    descripcion: "Impuesto a la propiedad (0.8% - 1.4% anual del avaluo fiscal)",
  },
];

const PLAZOS_DISPONIBLES = [10, 12, 15, 18, 20, 25, 30];

export default function SimuladorPage() {
  const [tasaActual, setTasaActual] = useState<TasaData | null>(null);
  const [loading, setLoading] = useState(true);

  const [montoPropiedad, setMontoPropiedad] = useState<number>(150000000);
  const [pie, setPie] = useState<number>(30000000);
  const [plazo, setPlazo] = useState<number>(20);
  const [tipoCredito, setTipoCredito] = useState("hipotecario");
  const [bancoSeleccionado, setBancoSeleccionado] = useState("banco1");

  const [segurosSeleccionados, setSegurosSeleccionados] = useState<Record<string, boolean>>({
    desgravamen: true,
    riesgo: true,
    cesantia: true,
  });
  const [mostrarSeguros, setMostrarSeguros] = useState(true);
  const [mostrarGastos, setMostrarGastos] = useState(true);
  const [mostrarAmortizacion, setMostrarAmortizacion] = useState(false);

  const [resultado, setResultado] = useState<ResultadoSimulacion | null>(null);
  const [tablaAmortizacion, setTablaAmortizacion] = useState<{
    mes: number;
    cuota: number;
    capital: number;
    interes: number;
    saldo: number;
    seguros: number;
  }[]>([]);

  const montoCredito = montoPropiedad - pie;
  const porcentajePie = montoPropiedad > 0 ? (pie / montoPropiedad) * 100 : 0;

  const calcularSeguroMensual = (seguro: SeguroConfig): number => {
    switch (seguro.base) {
      case "credito":
        return montoCredito * seguro.tasaMensual;
      case "propiedad":
        return montoPropiedad * (seguro.tasaMensual * 12);
      default:
        return 0;
    }
  };

  const calcularGastosAdicionales = (): number => {
    return GASTOS_ADICIONALES.reduce((total, gasto) => {
      if (gasto.esPorcentaje) {
        return total + montoPropiedad * (gasto.porcentaje || 0);
      }
      return total + gasto.monto;
    }, 0);
  };

  const calcularTablaAmortizacion = (dividendoBase: number, tasaMensual: number) => {
    const tabla: { mes: number; cuota: number; capital: number; interes: number; saldo: number; seguros: number }[] = [];
    let saldo = montoCredito;
    const totalMeses = plazo * 12;

    for (let mes = 1; mes <= Math.min(totalMeses, 60); mes++) {
      const interes = saldo * tasaMensual;
      const capital = dividendoBase - interes;
      saldo = Math.max(0, saldo - capital);

      const segurosMes = SEGROS_HIPOTECARIOS
        .filter((s) => segurosSeleccionados[s.id])
        .reduce((total, s) => total + calcularSeguroMensual(s), 0);

      tabla.push({
        mes,
        cuota: dividendoBase + segurosMes,
        capital,
        interes,
        saldo,
        seguros: segurosMes,
      });
    }
    return tabla;
  };

  const calcularSimulacion = () => {
    if (!tasaActual) return;

    const tasaMensual = tasaActual.tasa / 100 / 12;
    const totalMeses = plazo * 12;

    if (tasaMensual === 0 || totalMeses === 0) return;

    const dividendoBase = montoCredito * (tasaMensual * Math.pow(1 + tasaMensual, totalMeses)) / (Math.pow(1 + tasaMensual, totalMeses) - 1);

    const segurosResult = SEGROS_HIPOTECARIOS
      .filter((s) => segurosSeleccionados[s.id])
      .map((seguro) => {
        const montoMensual = calcularSeguroMensual(seguro);
        return {
          id: seguro.id,
          nombre: seguro.nombre,
          montoMensual,
          montoAnual: montoMensual * 12,
        };
      });

    const costoSegurosAnual = segurosResult.reduce((acc, s) => acc + s.montoAnual, 0);
    const costoSegurosMensual = costoSegurosAnual / 12;
    const dividendoTotal = dividendoBase + costoSegurosMensual;
    const gastosAdicionales = calcularGastosAdicionales();
    const totalInversionInicial = pie + gastosAdicionales;

    const costoTotal = (dividendoTotal * totalMeses) + gastosAdicionales;
    const interesesTotales = (dividendoBase * totalMeses) - montoCredito;

    const cae = ((costoTotal / montoCredito) ** (1 / plazo) - 1) * 100 || tasaActual.tasa + 1.5;

    setResultado({
      dividendoBase,
      cae,
      costoTotal,
      interesesTotales,
      tasaUtilizada: tasaActual.tasa,
      seguros: segurosResult,
      dividendoTotal,
      costoSegurosAnual,
      gastosAdicionales,
      totalInversionInicial,
      cuotaAntesSeguros: dividendoBase,
    });

    setTablaAmortizacion(calcularTablaAmortizacion(dividendoBase, tasaMensual));
  };

  const cargarTasa = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cmf/rates?moneda=UF`);
      const data = await res.json();
      if (data.success) {
        setTasaActual(data.data);
      }
    } catch (error) {
      setTasaActual({ fecha: "2026-07-05", tipoOperacion: "hipotecario", tasa: 4.75, moneda: "UF" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTasa();
  }, []);

  useEffect(() => {
    if (tasaActual) {
      calcularSimulacion();
    }
  }, [montoPropiedad, pie, plazo, tasaActual, segurosSeleccionados]);

  const toggleSeguro = (id: string) => {
    const seguro = SEGROS_HIPOTECARIOS.find((s) => s.id === id);
    if (seguro?.obligatorio) {
      toast.info("Este seguro es obligatorio para credito hipotecario");
      return;
    }
    setSegurosSeleccionados((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(monto);
  };

  const formatUF = (monto: number) => {
    const ufValue = monto / VALOR_UF_CLP;
    return `${ufValue.toFixed(2)} UF`;
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  const copiarSimulacion = () => {
    if (!resultado) return;
    const texto = `SIMULACION CREDITO HIPOTECARIO
Propiedad: ${formatMonto(montoPropiedad)} (${formatUF(montoPropiedad)})
Pie: ${formatMonto(pie)} (${porcentajePie.toFixed(0)}%)
Credito: ${formatMonto(montoCredito)} (${formatUF(montoCredito)})
Plazo: ${plazo} años
Tasa: ${tasaActual?.tasa.toFixed(2)}% UF

DIVIDENDO MENSUAL: ${formatMonto(resultado.dividendoTotal)}
- Cuota base: ${formatMonto(resultado.dividendoBase)}
- Seguros: ${formatMonto(resultado.costoSegurosAnual / 12)}

CAE: ${formatPercent(resultado.cae)}
Costo Total: ${formatMonto(resultado.costoTotal)}
Intereses: ${formatMonto(resultado.interesesTotales)}`;
    navigator.clipboard.writeText(texto);
    toast.success("Simulacion copiada al portapapeles");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Simulador de Credito Hipotecario
            </h1>
            <p className="text-blue-100 text-[11px] font-medium">
              Calcula tu dividendo con tasas reales CMF y seguros incluidos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <div className="text-[10px] font-semibold">
                Tasa vigente
              </div>
              <div className="text-lg font-bold">
                {tasaActual?.tasa.toFixed(2) || "--"}% UF
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del credito */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Home size={16} className="text-blue-500" />
              Datos del Credito
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
                  Valor de la Propiedad
                </label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    value={montoPropiedad}
                    onChange={(e) => setMontoPropiedad(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[13px] font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{formatUF(montoPropiedad)}</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
                  Pie (Enganche)
                </label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    value={pie}
                    onChange={(e) => setPie(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[13px] font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-slate-400">
                    {porcentajePie.toFixed(0)}% del valor
                  </p>
                  {porcentajePie < 20 && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                      Minimo 20%
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
                  Plazo (años)
                </label>
                <select
                  value={plazo}
                  onChange={(e) => setPlazo(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[13px] font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                >
                  {PLAZOS_DISPONIBLES.map((p) => (
                    <option key={p} value={p}>{p} años ({p * 12} meses)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
                  Tipo de Credito
                </label>
                <select
                  value={tipoCredito}
                  onChange={(e) => setTipoCredito(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[13px] font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                >
                  <option value="hipotecario">Credito Hipotecario</option>
                  <option value="refinanciamiento">Refinanciamiento</option>
                  <option value="liberacion">Liberacion de Hipoteca</option>
                </select>
              </div>
            </div>

            {/* Monto del credito */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Monto del Credito</span>
                  <div className="text-[10px] text-blue-500 dark:text-blue-400 mt-0.5">{formatUF(montoCredito)}</div>
                </div>
                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {formatMonto(montoCredito)}
                </span>
              </div>
            </div>
          </div>

          {/* Seguros Asociados */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
            <button
              onClick={() => setMostrarSeguros(!mostrarSeguros)}
              className="w-full flex items-center justify-between p-6 pb-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Shield size={16} className="text-purple-500" />
                Seguros Asociados
                <span className="text-[10px] font-normal text-slate-400 ml-1">
                  ({Object.values(segurosSeleccionados).filter(Boolean).length}/{SEGROS_HIPOTECARIOS.length})
                </span>
              </h3>
              {mostrarSeguros ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>

            {mostrarSeguros && (
              <div className="px-6 pb-6 space-y-3">
                {SEGROS_HIPOTECARIOS.map((seguro) => {
                  const Icono = seguro.icono;
                  const activo = segurosSeleccionados[seguro.id];
                  const montoMensual = activo ? calcularSeguroMensual(seguro) : 0;

                  return (
                    <div
                      key={seguro.id}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        activo
                          ? "border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleSeguro(seguro.id)}
                          disabled={seguro.obligatorio}
                          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            activo
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          } ${seguro.obligatorio ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-blue-400"}`}
                        >
                          {activo && <Check size={12} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Icono size={14} className={activo ? "text-blue-500" : "text-slate-400"} />
                            <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{seguro.nombre}</span>
                            {seguro.obligatorio && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                                Obligatorio
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{seguro.descripcion}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 italic">{seguro.calculoDetalle}</p>
                          {activo && (
                            <div className="mt-2 flex items-center gap-4">
                              <span className="text-[10px] text-slate-500">
                                Mensual: <strong className="text-blue-600 dark:text-blue-400">{formatMonto(montoMensual)}</strong>
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Anual: <strong className="text-slate-700 dark:text-slate-300">{formatMonto(montoMensual * 12)}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gastos Adicionales */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
            <button
              onClick={() => setMostrarGastos(!mostrarGastos)}
              className="w-full flex items-center justify-between p-6 pb-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wallet size={16} className="text-amber-500" />
                Gastos Adicionales de la Operacion
              </h3>
              {mostrarGastos ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>

            {mostrarGastos && (
              <div className="px-6 pb-6">
                <div className="space-y-2">
                  {GASTOS_ADICIONALES.map((gasto) => {
                    const monto = gasto.esPorcentaje ? montoPropiedad * (gasto.porcentaje || 0) : gasto.monto;
                    return (
                      <div key={gasto.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{gasto.nombre}</span>
                            {gasto.obligatorio && (
                              <span className="text-[8px] font-semibold px-1 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-500 rounded">Req.</span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5">{gasto.descripcion}</p>
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{formatMonto(monto)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Total gastos iniciales</span>
                  <span className="text-[12px] font-bold text-amber-700 dark:text-amber-300">{formatMonto(calcularGastosAdicionales())}</span>
                </div>
              </div>
            )}
          </div>

          {/* Resultado */}
          {resultado && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                Resultado de la Simulacion
              </h3>

              {/* Dividendo principal */}
              <div className="p-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white mb-4">
                <div className="text-[11px] font-semibold opacity-90 mb-1">Dividendo Mensual Total</div>
                <div className="text-3xl font-bold">{formatMonto(resultado.dividendoTotal)}</div>
                <div className="text-[11px] opacity-80 mt-1">{formatUF(resultado.dividendoTotal)}</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">CAE</div>
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatPercent(resultado.cae)}</div>
                  <div className="text-[9px] text-blue-500">Costo Anual</div>
                </div>

                <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Costo Total</div>
                  <div className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatMonto(resultado.costoTotal)}</div>
                  <div className="text-[9px] text-amber-500">{formatUF(resultado.costoTotal)}</div>
                </div>

                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold">Intereses</div>
                  <div className="text-lg font-bold text-red-700 dark:text-red-300">{formatMonto(resultado.interesesTotales)}</div>
                  <div className="text-[9px] text-red-500">{formatUF(resultado.interesesTotales)}</div>
                </div>

                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Seguros/mes</div>
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{formatMonto(resultado.costoSegurosAnual / 12)}</div>
                  <div className="text-[9px] text-purple-500">{formatUF(resultado.costoSegurosAnual / 12)}</div>
                </div>
              </div>

              {/* Desglose */}
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-3">Desglose del Dividendo Mensual</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Cuota base (capital + interes)</span>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{formatMonto(resultado.dividendoBase)}</span>
                  </div>
                  {resultado.seguros.map((seguro) => (
                    <div key={seguro.id} className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{seguro.nombre}</span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{formatMonto(seguro.montoMensual)}</span>
                    </div>
                  ))}
                  <div className="h-px bg-slate-200 dark:bg-slate-600 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Total a pagar mensual</span>
                    <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{formatMonto(resultado.dividendoTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Inversion inicial */}
              <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-3">Inversion Inicial Requerida</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Pie (enganche)</span>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{formatMonto(pie)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Gastos adicionales</span>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{formatMonto(resultado.gastosAdicionales)}</span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-600 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Total inversion inicial</span>
                    <span className="text-[12px] font-bold text-amber-600 dark:text-amber-400">{formatMonto(resultado.totalInversionInicial)}</span>
                  </div>
                </div>
              </div>

              {/* Tasa */}
              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info size={14} className="text-slate-400" />
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    Tasa: <strong>{formatPercent(resultado.tasaUtilizada)}</strong> UF
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">CMF &bull; {tasaActual?.fecha}</span>
              </div>
            </div>
          )}

          {/* Tabla de Amortizacion */}
          {resultado && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
              <button
                onClick={() => setMostrarAmortizacion(!mostrarAmortizacion)}
                className="w-full flex items-center justify-between p-6 pb-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText size={16} className="text-indigo-500" />
                  Tabla de Amortizacion (primeros 12 meses)
                </h3>
                {mostrarAmortizacion ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {mostrarAmortizacion && (
                <div className="px-6 pb-6 overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 font-semibold text-slate-600 dark:text-slate-400">Mes</th>
                        <th className="text-right py-2 font-semibold text-slate-600 dark:text-slate-400">Cuota</th>
                        <th className="text-right py-2 font-semibold text-slate-600 dark:text-slate-400">Capital</th>
                        <th className="text-right py-2 font-semibold text-slate-600 dark:text-slate-400">Interes</th>
                        <th className="text-right py-2 font-semibold text-slate-600 dark:text-slate-400">Seguros</th>
                        <th className="text-right py-2 font-semibold text-slate-600 dark:text-slate-400">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tablaAmortizacion.slice(0, 12).map((fila) => (
                        <tr key={fila.mes} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="py-2 font-semibold text-slate-700 dark:text-slate-300">{fila.mes}</td>
                          <td className="py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatMonto(fila.cuota)}</td>
                          <td className="py-2 text-right text-slate-700 dark:text-slate-300">{formatMonto(fila.capital)}</td>
                          <td className="py-2 text-right text-slate-700 dark:text-slate-300">{formatMonto(fila.interes)}</td>
                          <td className="py-2 text-right text-purple-600 dark:text-purple-400">{formatMonto(fila.seguros)}</td>
                          <td className="py-2 text-right font-semibold text-slate-700 dark:text-slate-300">{formatMonto(fila.saldo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[9px] text-slate-400 mt-2 text-center">Mostrando primeros 12 meses de {plazo * 12} meses totales</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Resumen rapido */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-4">Resumen</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Propiedad</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{formatMonto(montoPropiedad)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Pie ({porcentajePie.toFixed(0)}%)</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{formatMonto(pie)}</span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-700" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Credito</span>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{formatMonto(montoCredito)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Plazo</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{plazo} años</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Tasa</span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {tasaActual?.tasa.toFixed(2) || "--"}% UF
                </span>
              </div>
              {resultado && (
                <>
                  <div className="h-px bg-slate-100 dark:bg-slate-700" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Seguros</span>
                    <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                      {formatMonto(resultado.costoSegurosAnual / 12)}/mes
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Dividendo</span>
                    <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{formatMonto(resultado.dividendoTotal)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-4">Acciones</h3>
            <div className="space-y-2">
              <button
                onClick={copiarSimulacion}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-600 transition-colors"
              >
                <Copy size={14} /> Copiar Simulacion
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <Download size={14} /> Descargar PDF
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <Share2 size={14} /> Compartir
              </button>
              <button
                onClick={cargarTasa}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <RefreshCw size={14} /> Actualizar tasa
              </button>
            </div>
          </div>

          {/* Requisitos */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              Requisitos
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-[10px] text-slate-600 dark:text-slate-400">Pie minimo 20% del valor de la propiedad</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-[10px] text-slate-600 dark:text-slate-400">Ingreso mensual minimo 4x dividendo</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-[10px] text-slate-600 dark:text-slate-400">Sin DICOM (o consulta previa)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-[10px] text-slate-600 dark:text-slate-400">Avaluo comercial vigente</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-[10px] text-slate-600 dark:text-slate-400">Seguros obligatorios incluidos</span>
              </li>
            </ul>
          </div>

          {/* Info CMF */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={16} className="text-emerald-600" />
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Fuente Oficial</span>
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 leading-relaxed">
              Tasas obtenidas de la Comision para el Mercado Financiero (CMF Chile).
              Actualizacion diaria. Los seguros y gastos son estimaciones promedio del mercado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
