"use client";

import { useState, useEffect } from "react";
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
  ChevronDown,
} from "lucide-react";

interface TasaData {
  fecha: string;
  tipoOperacion: string;
  tasa: number;
  moneda: string;
}

interface ResultadoSimulacion {
  dividendo: number;
  cae: number;
  costoTotal: number;
  interesesTotales: number;
  tasaUtilizada: number;
}

export default function SimuladorPage() {
  const [tasaActual, setTasaActual] = useState<TasaData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [montoPropiedad, setMontoPropiedad] = useState<number>(150000000);
  const [pie, setPie] = useState<number>(30000000);
  const [plazo, setPlazo] = useState<number>(20);
  const [tipoMoneda, setTipoMoneda] = useState<"UF" | "CLP">("UF");
  const [tipoCredito, setTipoCredito] = useState("hipotecario");

  // Result
  const [resultado, setResultado] = useState<ResultadoSimulacion | null>(null);

  const calcularSimulacion = () => {
    if (!tasaActual) return;

    const montoCredito = montoPropiedad - pie;
    const tasaMensual = tasaActual.tasa / 100 / 12;
    const totalMeses = plazo * 12;

    if (tasaMensual === 0 || totalMeses === 0) return;

    // Fórmula de dividendo francés
    const dividendo = montoCredito * (tasaMensual * Math.pow(1 + tasaMensual, totalMeses)) / (Math.pow(1 + tasaMensual, totalMeses) - 1);

    const costoTotal = dividendo * totalMeses;
    const interesesTotales = costoTotal - montoCredito;

    // CAE simplificado
    const cae = tasaActual.tasa + 0.5;

    setResultado({
      dividendo,
      cae,
      costoTotal,
      interesesTotales,
      tasaUtilizada: tasaActual.tasa,
    });
  };

  const cargarTasa = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cmf/rates?moneda=${tipoMoneda}`);
      const data = await res.json();
      if (data.success) {
        setTasaActual(data.data);
      }
    } catch (error) {
      console.error("Error cargando tasa:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTasa(); // eslint-disable-line react-hooks/set-state-in-effect
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tasaActual) {
      calcularSimulacion(); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [montoPropiedad, pie, plazo, tipoMoneda, tasaActual]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(monto);
  };

  const formatUF = (monto: number) => {
    // Aproximación: 1 UF ≈ $38,957 CLP (valor aproximado)
    const ufValue = monto / 38957;
    return `${ufValue.toFixed(2)} UF`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-CL").format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">
              Simulador Hipotecario
            </h1>
            <p className="text-blue-100 text-[11px] font-medium">
              Calcula el dividendo con tasas reales CMF
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-white/20 rounded-lg">
              <span className="text-[10px] font-semibold">
                Tasa vigente: {tasaActual?.tasa.toFixed(2) || "--"}% {tipoMoneda}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de entrada */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del crédito */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Calculator size={16} className="text-blue-500" />
              Datos del Crédito
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
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[13px] font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {formatUF(montoPropiedad)}
                </p>
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
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[13px] font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {((pie / montoPropiedad) * 100).toFixed(0)}% del valor • {formatUF(pie)}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
                  Plazo (años)
                </label>
                <select
                  value={plazo}
                  onChange={(e) => setPlazo(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[13px] font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value={10}>10 años</option>
                  <option value={15}>15 años</option>
                  <option value={20}>20 años</option>
                  <option value={25}>25 años</option>
                  <option value={30}>30 años</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
                  Tipo de Crédito
                </label>
                <select
                  value={tipoCredito}
                  onChange={(e) => setTipoCredito(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[13px] font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="hipotecario">Crédito Hipotecario</option>
                  <option value="refinanciamiento">Refinanciamiento</option>
                  <option value="liberacion">Liberación de Hipoteca</option>
                </select>
              </div>
            </div>

            {/* Monto del crédito */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Monto del Crédito</span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {formatMonto(montoPropiedad - pie)}
                </span>
              </div>
              <div className="text-[10px] text-blue-500 dark:text-blue-400 mt-1">
                {formatUF(montoPropiedad - pie)}
              </div>
            </div>
          </div>

          {/* Resultado */}
          {resultado && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                Resultado de la Simulación
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                    Dividendo Mensual
                  </div>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatMonto(resultado.dividendo)}
                  </div>
                  <div className="text-[9px] text-emerald-500 mt-1">
                    {formatUF(resultado.dividendo)}
                  </div>
                </div>

                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mb-1">
                    CAE
                  </div>
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {resultado.cae.toFixed(2)}%
                  </div>
                  <div className="text-[9px] text-blue-500 mt-1">
                    Costo Anual Equivalente
                  </div>
                </div>

                <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mb-1">
                    Costo Total
                  </div>
                  <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                    {formatMonto(resultado.costoTotal)}
                  </div>
                  <div className="text-[9px] text-amber-500 mt-1">
                    {formatUF(resultado.costoTotal)}
                  </div>
                </div>

                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold mb-1">
                    Intereses Totales
                  </div>
                  <div className="text-lg font-bold text-red-700 dark:text-red-300">
                    {formatMonto(resultado.interesesTotales)}
                  </div>
                  <div className="text-[9px] text-red-500 mt-1">
                    {formatUF(resultado.interesesTotales)}
                  </div>
                </div>
              </div>

              {/* Tasa utilizada */}
              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info size={14} className="text-slate-400" />
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    Tasa utilizada: <strong>{resultado.tasaUtilizada.toFixed(2)}%</strong> {tipoMoneda}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Fuente: CMF • {tasaActual?.fecha}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Resumen */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-4">Resumen</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Propiedad</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  {formatMonto(montoPropiedad)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Pie</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  {formatMonto(pie)} ({((pie / montoPropiedad) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-700" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Crédito</span>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  {formatMonto(montoPropiedad - pie)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Plazo</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  {plazo} años ({plazo * 12} meses)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Tasa</span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {tasaActual?.tasa.toFixed(2) || "--"}% {tipoMoneda}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
            <h3 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-4">Acciones</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-[11px] font-semibold hover:bg-blue-600 transition-colors">
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

          {/* Info CMF */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={16} className="text-emerald-600" />
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Fuente Oficial</span>
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 leading-relaxed">
              Las tasas son obtenidas automáticamente de la Comisión para el Mercado Financiero (CMF Chile).
              Actualización diaria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
