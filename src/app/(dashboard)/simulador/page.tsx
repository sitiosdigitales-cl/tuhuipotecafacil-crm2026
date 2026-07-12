"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Calculator, DollarSign, TrendingUp, Building2, Home, Wallet, Shield, AlertCircle, ChevronDown, Phone, MessageSquare, Info, Copy, BarChart3, GitCompare, Lightbulb } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";
import { toast } from "sonner";

const UF_CLP = 38957.56;

// Bancos con tasas reales CMF
const BANCOS = [
  { id: "bancodechile", nombre: "Banco de Chile", tasa: 4.79, color: "#E31837" },
  { id: "bci", nombre: "BCI", tasa: 4.95, color: "#0071CE" },
  { id: "santander", nombre: "Santander", tasa: 4.89, color: "#EC0000" },
  { id: "scotiabank", nombre: "Scotiabank", tasa: 5.10, color: "#EC111A" },
  { id: "bancostado", nombre: "BancoEstado", tasa: 4.65, color: "#004B87" },
  { id: "itaucorpbanco", nombre: "Itaú", tasa: 5.20, color: "#F58220" },
  { id: "bice", nombre: "BICE", tasa: 5.05, color: "#003DA5" },
  { id: "coopeuch", nombre: "Coopeuch", tasa: 4.55, color: "#00A651" },
];

const SEGUROS = [
  { id: "desgravamen", nombre: "Seguro de Desgravamen", tasaAnual: 0.003, base: "credito" as const, obligatorio: true },
  { id: "incendio", nombre: "Seguro de Incendio y Sismo", tasaAnual: 0.00045, base: "propiedad" as const, obligatorio: true },
  { id: "cesantia", nombre: "Seguro de Cesantía", tasaAnual: 0.0025, base: "credito" as const, obligatorio: false },
  { id: "vida", nombre: "Seguro de Vida", tasaAnual: 0.0015, base: "credito" as const, obligatorio: false },
];

const GASTOS = [
  { nombre: "Tasación", monto: 80000 },
  { nombre: "Estudio de títulos", monto: 120000 },
  { nombre: "Conservador", monto: 60000 },
  { nombre: "Notaría", monto: 250000 },
  { nombre: "Impuestos", monto: 150000 },
  { nombre: "Comisión avalúo", porc: 0.002 },
];

const PLAZOS = [5, 10, 15, 20, 25, 30, 35];

function fmt(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function fmtUF(n: number) {
  return `${(n / UF_CLP).toFixed(2)} UF`;
}

export default function SimuladorPage() {
  // Income
  const [ingreso, setIngreso] = useState(2500000);
  const [tieneSegundoIngreso, setTieneSegundoIngreso] = useState(false);
  const [segundoIngreso, setSegundoIngreso] = useState(0);
  const [bonos, setBonos] = useState(0);
  const [otrosIngresos, setOtrosIngresos] = useState(0);

  // Expenses
  const [arriendo, setArriendo] = useState(0);
  const [creditosConsumo, setCreditosConsumo] = useState(0);
  const [automotriz, setAutomotriz] = useState(0);
  const [tarjetas, setTarjetas] = useState(0);
  const [lineasCredito, setLineasCredito] = useState(0);
  const [pensiones, setPensiones] = useState(0);
  const [otrosDescuentos, setOtrosDescuentos] = useState(0);

  // Property
  const [valorPropiedad, setValorPropiedad] = useState(120000000);
  const [tipoPropiedad, setTipoPropiedad] = useState("departamento");
  const [destino, setDestino] = useState("primera_vivienda");
  const [region, setRegion] = useState("metropolitana");

  // Financing
  const [pie, setPie] = useState(24000000);
  const [plazo, setPlazo] = useState(20);
  const [tipoTasa, setTipoTasa] = useState("fija");
  const [bancoSeleccionado, setBancoSeleccionado] = useState("bancodechile");
  const [tasaPersonalizada, setTasaPersonalizada] = useState(0);

  // Seguros
  const [segurosOn, setSegurosOn] = useState<Record<string, boolean>>({
    desgravamen: true, incendio: true, cesantia: false, vida: false,
  });

  // UI
  const [seccionActiva, setSeccionActiva] = useState(1);
  const resultadosRef = useRef<HTMLDivElement>(null);

  const irAResultados = () => {
    setSeccionActiva(0);
    setTimeout(() => {
      resultadosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const totalIngresos = useMemo(() =>
    ingreso + (tieneSegundoIngreso ? segundoIngreso : 0) + bonos + otrosIngresos
  , [ingreso, tieneSegundoIngreso, segundoIngreso, bonos, otrosIngresos]);

  const totalCompromisos = useMemo(() =>
    arriendo + creditosConsumo + automotriz + tarjetas + lineasCredito + pensiones + otrosDescuentos
  , [arriendo, creditosConsumo, automotriz, tarjetas, lineasCredito, pensiones, otrosDescuentos]);

  const capacidadEndeudamiento = useMemo(() => {
    const maxCuota = totalIngresos * 0.30;
    const disponible = Math.max(0, maxCuota - totalCompromisos);
    return disponible;
  }, [totalIngresos, totalCompromisos]);

  const tasaBanco = BANCOS.find((b) => b.id === bancoSeleccionado)?.tasa || 4.80;
  const tasaFinal = tasaPersonalizada > 0 ? tasaPersonalizada : tasaBanco;
  const montoCredito = valorPropiedad - pie;
  const porcentajePie = valorPropiedad > 0 ? (pie / valorPropiedad) * 100 : 0;
  const totalGastos = GASTOS.reduce((a, g) => a + (g.monto || 0) + (g.porc ? valorPropiedad * g.porc : 0), 0);

  // Cálculo principal
  const resultado = useMemo(() => {
    if (montoCredito <= 0 || plazo <= 0 || tasaFinal <= 0) return null;
    const r = tasaFinal / 100 / 12;
    const n = plazo * 12;
    const cuotaBase = montoCredito * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    const segurosCalc = SEGUROS.filter((s) => segurosOn[s.id]).map((s) => {
      const mensual = s.base === "credito" ? montoCredito * s.tasaAnual / 12 : valorPropiedad * s.tasaAnual / 12;
      return { id: s.id, nombre: s.nombre, mensual, anual: mensual * 12 };
    });
    const totalSeguros = segurosCalc.reduce((a, s) => a + s.mensual, 0);
    const dividendo = cuotaBase + totalSeguros;

    const totalPagado = dividendo * n;
    const cae = Math.pow(totalPagado / montoCredito, 1 / plazo) - 1;

    // Tabla de amortización anual
    const tabla: any[] = [];
    let saldo = montoCredito;
    const chartData: any[] = [];
    const barData: any[] = [];
    for (let año = 1; año <= plazo; año++) {
      let intAño = 0, capAño = 0;
      for (let m = 0; m < 12; m++) {
        const int = saldo * r;
        const cap = cuotaBase - int;
        intAño += int;
        capAño += cap;
        saldo = Math.max(0, saldo - cap);
      }
      tabla.push({ año, saldoInicial: saldo + capAño, dividendo, interes: intAño, capital: capAño, saldoFinal: saldo });
      chartData.push({ name: `Año ${año}`, saldo: Math.round(saldo) });
      barData.push({ name: `Año ${año}`, capital: Math.round(capAño), interes: Math.round(intAño) });
    }

    // Donut data
    const donutData = [
      { name: "Capital + Interés", value: Math.round(cuotaBase) },
      ...segurosCalc.map((s) => ({ name: s.nombre.replace("Seguro de ", ""), value: Math.round(s.mensual) })),
    ];
    const COLORS = ["#1E40AF", "#FF6B35", "#00AEEF", "#FFD447", "#10B981"];

    return {
      cuotaBase, dividendo, segurosCalc, totalSeguros, totalPagado,
      cae: cae * 100, tabla, donutData, COLORS, chartData, barData,
      costoTotal: totalPagado, intereses: cuotaBase * n - montoCredito,
    };
  }, [montoCredito, plazo, tasaFinal, segurosOn, valorPropiedad]);

  // Comparación bancos
  const comparacion = useMemo(() => {
    return BANCOS.map((banco) => {
      const r = banco.tasa / 100 / 12;
      const n = plazo * 12;
      const cuota = montoCredito * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const seguros = SEGUROS.filter((s) => segurosOn[s.id]).reduce((a, s) => {
        return a + (s.base === "credito" ? montoCredito : valorPropiedad) * s.tasaAnual / 12;
      }, 0);
      const total = cuota + seguros;
      const totalPagado = total * n;
      const caeCalc = (Math.pow(totalPagado / montoCredito, 1 / plazo) - 1) * 100;
      return { ...banco, dividendo: total, cae: caeCalc, costoTotal: totalPagado };
    }).sort((a, b) => a.dividendo - b.dividendo);
  }, [montoCredito, plazo, segurosOn, valorPropiedad]);

  // Escenarios
  const escenarios = useMemo(() => {
    return [20, 25, 30].map((p) => {
      const r = tasaFinal / 100 / 12;
      const n = p * 12;
      const cuota = montoCredito * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const seguros = SEGUROS.filter((s) => segurosOn[s.id]).reduce((a, s) => {
        return a + (s.base === "credito" ? montoCredito : valorPropiedad) * s.tasaAnual / 12;
      }, 0);
      const total = (cuota + seguros) * n;
      return { plazo: p, dividendo: cuota + seguros, costoTotal: total, intereses: cuota * n - montoCredito };
    });
  }, [montoCredito, tasaFinal, segurosOn, valorPropiedad]);

  const nivelFinanciero = useMemo(() => {
    const ratio = totalIngresos > 0 ? (capacidadEndeudamiento / totalIngresos) * 100 : 0;
    if (ratio > 20) return { label: "Excelente", color: "text-emerald-600", bg: "bg-emerald-50", pct: Math.min(ratio * 3, 100) };
    if (ratio > 10) return { label: "Bueno", color: "text-blue-600", bg: "bg-blue-50", pct: ratio * 4 };
    if (ratio > 5) return { label: "Regular", color: "text-amber-600", bg: "bg-amber-50", pct: ratio * 5 };
    return { label: "Crítico", color: "text-red-600", bg: "bg-red-50", pct: Math.max(ratio * 5, 10) };
  }, [totalIngresos, capacidadEndeudamiento]);

  const handleCopiar = useCallback(() => {
    if (!resultado) return;
    navigator.clipboard.writeText(`SIMULACIÓN CRÉDITO HIPOTECARIO\nPropiedad: ${fmt(valorPropiedad)}\nPie: ${fmt(pie)} (${porcentajePie.toFixed(0)}%)\nCrédito: ${fmt(montoCredito)}\nPlazo: ${plazo} años\nTasa: ${tasaFinal.toFixed(2)}%\n\nDividendo: ${fmt(resultado.dividendo)}/mes\nCAE: ${resultado.cae.toFixed(2)}%\nCosto Total: ${fmt(resultado.costoTotal)}`);
    toast.success("Simulación copiada");
  }, [resultado, valorPropiedad, pie, porcentajePie, montoCredito, plazo, tasaFinal]);

  const SectionHeader = ({ num, title, icon: Icon }: { num: number; title: string; icon: any }) => (
    <button onClick={() => setSeccionActiva(seccionActiva === num ? 0 : num)}
      className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-all">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${seccionActiva === num ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{num}</div>
      <Icon size={16} className={seccionActiva === num ? "text-blue-600" : "text-slate-400"} />
      <span className="text-sm font-bold text-slate-800 flex-1 text-left">{title}</span>
      <ChevronDown size={16} className={`text-slate-400 transition-transform ${seccionActiva === num ? "rotate-180" : ""}`} />
    </button>
  );

  const formatCLP = (n: number): string => {
    if (n === 0) return "0";
    return n.toLocaleString("es-CL");
  };

  const InputField = ({ label, value, onChange, prefix = "$", placeholder, hint, suffix, sliderMin, sliderMax, sliderStep, sliderFormat }: {
    label: string; value: number; onChange: (v: number) => void;
    prefix?: string; placeholder?: string; hint?: string; suffix?: string;
    sliderMin?: number; sliderMax?: number; sliderStep?: number; sliderFormat?: (v: number) => string;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const sliderRef = useRef<HTMLInputElement>(null);
    const [localValue, setLocalValue] = useState(formatCLP(value));
    const isTyping = useRef(false);

    // Solo sincronizar desde padre cuando NO estamos escribiendo
    useEffect(() => {
      if (!isTyping.current) {
        setLocalValue(formatCLP(value));
      }
    }, [value]);

    // Actualizar progreso del slider
    useEffect(() => {
      if (sliderRef.current && sliderMin !== undefined && sliderMax !== undefined) {
        const pct = sliderMax > sliderMin
          ? ((Math.min(Math.max(value, sliderMin), sliderMax) - sliderMin) / (sliderMax - sliderMin)) * 100
          : 0;
        sliderRef.current.style.setProperty("--progress", `${pct}%`);
      }
    }, [value, sliderMin, sliderMax]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      isTyping.current = true;
      const raw = e.target.value.replace(/[^0-9]/g, "");
      const num = Number(raw) || 0;
      const formatted = formatCLP(num);

      // Guardar cursor relativo a dígitos
      const cursorPos = e.target.selectionStart || 0;
      const digitsBefore = e.target.value.substring(0, cursorPos).replace(/[^0-9]/g, "").length;

      setLocalValue(formatted);

      // Reposicionar cursor después del formateo
      requestAnimationFrame(() => {
        const input = inputRef.current;
        if (!input) return;
        let newPos = 0;
        let counted = 0;
        for (let i = 0; i < formatted.length; i++) {
          if (counted === digitsBefore) break;
          newPos = i + 1;
          if (/[0-9]/.test(formatted[i])) counted++;
        }
        input.setSelectionRange(newPos, newPos);
        isTyping.current = false;
      });
    };

    const handleFocus = () => {
      isTyping.current = false;
    };

    const handleBlur = () => {
      isTyping.current = false;
      const raw = localValue.replace(/[^0-9]/g, "");
      const num = Number(raw) || 0;
      setLocalValue(formatCLP(num));
      onChange(num);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = Number(e.target.value);
      isTyping.current = false;
      setLocalValue(formatCLP(num));
      onChange(num);
    };

    return (
      <div className="space-y-1.5">
        {label && <label className="text-[11px] font-bold text-slate-500">{label}</label>}
        <div className="relative">
          {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base font-semibold">{prefix}</span>}
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={localValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`w-full ${prefix ? "pl-9" : "pl-4"} ${suffix ? "pr-20" : "pr-4"} py-3.5 bg-white border-2 rounded-xl text-lg font-bold text-slate-800 tracking-wide transition-all outline-none border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10`}
          />
          {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">{suffix}</span>}
        </div>
        {sliderMin !== undefined && sliderMax !== undefined && (
          <div>
            <input
              ref={sliderRef}
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={sliderStep || 1}
              value={Math.min(Math.max(value, sliderMin), sliderMax)}
              onChange={handleSliderChange}
              className="w-full slider-teal"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400 font-medium">{sliderFormat ? sliderFormat(sliderMin) : sliderMin.toLocaleString("es-CL")}</span>
              <span className="text-[10px] text-slate-400 font-medium">{sliderFormat ? sliderFormat(sliderMax) : sliderMax.toLocaleString("es-CL")}</span>
            </div>
          </div>
        )}
        {hint && <p className="text-[10px] text-slate-400 font-medium">{hint}</p>}
      </div>
    );
  };

  // SliderField ya integrado en InputField

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* CSS para slider azul fluido */}
      <style dangerouslySetInnerHTML={{ __html: `
        .slider-teal {
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          border-radius: 999px;
          background: #e2e8f0;
          outline: none;
          cursor: grab;
          touch-action: none;
          -webkit-tap-highlight-color: transparent;
        }
        .slider-teal:active {
          cursor: grabbing;
        }
        .slider-teal::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #2563EB;
          cursor: grab;
          border: 4px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          margin-top: -9px;
          touch-action: none;
        }
        .slider-teal::-webkit-slider-thumb:hover {
          background: #1E40AF;
          box-shadow: 0 2px 12px rgba(37,99,235,0.4);
        }
        .slider-teal::-webkit-slider-thumb:active {
          cursor: grabbing;
          background: #1E40AF;
          box-shadow: 0 2px 16px rgba(37,99,235,0.5);
          transform: scale(1.15);
        }
        .slider-teal::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #2563EB;
          cursor: grab;
          border: 4px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          touch-action: none;
        }
        .slider-teal::-moz-range-track {
          height: 8px;
          border-radius: 999px;
          background: #e2e8f0;
        }
        .slider-teal::-moz-range-progress {
          background: #2563EB;
          height: 8px;
          border-radius: 999px;
        }
      `}} />
      {/* Hero */}
      <div className="relative bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#3B82F6] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative px-8 py-10 flex items-center justify-between">
          <div className="max-w-xl">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Simulador de Crédito Hipotecario</h1>
            <p className="text-sm text-blue-100/80 leading-relaxed">
              Calcula tu dividendo utilizando tasas reales publicadas por la CMF, seguros incluidos y simulaciones comparativas entre bancos.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-center px-4 py-3 bg-white/15 rounded-xl backdrop-blur-sm border border-white/15">
              <p className="text-[10px] text-blue-100/60 font-semibold">Tasa vigente</p>
              <p className="text-xl font-bold text-white">{tasaFinal.toFixed(2)}%</p>
              <p className="text-[9px] text-blue-100/50">CMF · UF</p>
            </div>
            <div className="text-center px-4 py-3 bg-white/15 rounded-xl backdrop-blur-sm border border-white/15">
              <p className="text-[10px] text-blue-100/60 font-semibold">UF hoy</p>
              <p className="text-xl font-bold text-white">${UF_CLP.toLocaleString("es-CL")}</p>
              <p className="text-[9px] text-blue-100/50">{new Date().toLocaleDateString("es-CL")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Columna izquierda — Formulario */}
        <div className="lg:col-span-2 space-y-3">
          {/* 1. Ingresos */}
          <SectionHeader num={1} title="Ingresos del hogar" icon={DollarSign} />
          {seccionActiva === 1 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <InputField label="Ingreso mensual líquido" value={ingreso} onChange={setIngreso} hint="Ingresos líquidos del grupo familiar"
                sliderMin={0} sliderMax={15000000} sliderStep={50000} sliderFormat={(v) => `$ ${(v / 1000000).toFixed(1)}M`} />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={tieneSegundoIngreso} onChange={(e) => setTieneSegundoIngreso(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs font-semibold text-slate-700">Tengo segundo ingreso</span>
              </label>
              {tieneSegundoIngreso && <InputField label="Ingreso segundo titular" value={segundoIngreso} onChange={setSegundoIngreso}
                sliderMin={0} sliderMax={10000000} sliderStep={50000} sliderFormat={(v) => `$ ${(v / 1000000).toFixed(1)}M`} />}
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Bonos" value={bonos} onChange={setBonos}
                  sliderMin={0} sliderMax={5000000} sliderStep={100000} sliderFormat={(v) => `$ ${(v / 1000000).toFixed(1)}M`} />
                <InputField label="Otros ingresos" value={otrosIngresos} onChange={setOtrosIngresos}
                  sliderMin={0} sliderMax={5000000} sliderStep={100000} sliderFormat={(v) => `$ ${(v / 1000000).toFixed(1)}M`} />
              </div>
              <div className="p-3 bg-blue-50 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700">Total ingresos mensuales</span>
                <span className="text-sm font-bold text-blue-700">{fmt(totalIngresos)}</span>
              </div>
            </div>
          )}

          {/* 2. Gastos */}
          <SectionHeader num={2} title="Gastos mensuales" icon={Wallet} />
          {seccionActiva === 2 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Arriendo" value={arriendo} onChange={setArriendo}
                  sliderMin={0} sliderMax={2000000} sliderStep={50000} sliderFormat={(v) => `$ ${(v / 1000000).toFixed(1)}M`} />
                <InputField label="Créditos consumo" value={creditosConsumo} onChange={setCreditosConsumo}
                  sliderMin={0} sliderMax={3000000} sliderStep={50000} sliderFormat={(v) => `$ ${(v / 1000000).toFixed(1)}M`} />
                <InputField label="Automotriz" value={automotriz} onChange={setAutomotriz}
                  sliderMin={0} sliderMax={2000000} sliderStep={50000} sliderFormat={(v) => `$ ${(v / 1000000).toFixed(1)}M`} />
                <InputField label="Tarjetas" value={tarjetas} onChange={setTarjetas}
                  sliderMin={0} sliderMax={2000000} sliderStep={50000} sliderFormat={(v) => `$ ${(v / 1000000).toFixed(1)}M`} />
                <InputField label="Líneas de crédito" value={lineasCredito} onChange={setLineasCredito}
                  sliderMin={0} sliderMax={2000000} sliderStep={50000} sliderFormat={(v) => `$ ${(v / 1000000).toFixed(1)}M`} />
                <InputField label="Pensiones" value={pensiones} onChange={setPensiones}
                  sliderMin={0} sliderMax={2000000} sliderStep={50000} sliderFormat={(v) => `$ ${(v / 1000000).toFixed(1)}M`} />
              </div>
              <InputField label="Otros descuentos" value={otrosDescuentos} onChange={setOtrosDescuentos}
                sliderMin={0} sliderMax={2000000} sliderStep={50000} sliderFormat={(v) => `$ ${(v / 1000000).toFixed(1)}M`} />
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Total compromisos</span>
                <span className="text-sm font-bold text-slate-800">{fmt(totalCompromisos)}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-700">Capacidad de endeudamiento</span>
                  <span className="text-sm font-bold text-emerald-700">{fmt(capacidadEndeudamiento)}/mes</span>
                </div>
                <p className="text-[10px] text-emerald-600">Basado en el 30% de tus ingresos totales</p>
              </div>
            </div>
          )}

          {/* 3. Propiedad */}
          <SectionHeader num={3} title="Datos de la propiedad" icon={Home} />
          {seccionActiva === 3 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <InputField label="Valor de la propiedad" value={valorPropiedad} onChange={setValorPropiedad} hint={fmtUF(valorPropiedad)}
                sliderMin={20000000} sliderMax={500000000} sliderStep={1000000} sliderFormat={(v) => `$ ${(v / 1000000).toFixed(0)}M`} />
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Tipo</label>
                  <select value={tipoPropiedad} onChange={(e) => setTipoPropiedad(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="departamento">Depto</option><option value="casa">Casa</option><option value="parcela">Parcela</option>
                    <option value="sitio">Sitio</option><option value="oficina">Oficina</option><option value="comercial">Local</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Destino</label>
                  <select value={destino} onChange={(e) => setDestino(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="primera_vivienda">1ª Vivienda</option><option value="segunda_vivienda">2ª Vivienda</option><option value="inversion">Inversión</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Región</label>
                  <select value={region} onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="metropolitana">Metropolitana</option><option value="valparaiso">Valparaíso</option><option value="biobio">Biobío</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 4. Financiamiento */}
          <SectionHeader num={4} title="Financiamiento" icon={Building2} />
          {seccionActiva === 4 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-2 block">Pie</label>
                <InputField label="" value={pie} onChange={setPie} suffix={`${porcentajePie.toFixed(0)}%`}
                  sliderMin={0} sliderMax={valorPropiedad} sliderStep={500000} sliderFormat={(v) => `$ ${(v / 1000000).toFixed(0)}M`} />
                <div className="flex gap-1.5 mt-2">
                  {[10, 15, 20, 25, 30, 35, 40].map((pct) => (
                    <button key={pct} onClick={() => setPie(Math.round(valorPropiedad * pct / 100))}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${porcentajePie === pct ? "bg-[#1E40AF] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-2 block">Plazo</label>
                <div className="flex gap-1.5 flex-wrap">
                  {PLAZOS.map((p) => (
                    <button key={p} onClick={() => setPlazo(p)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${plazo === p ? "bg-[#1E40AF] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                      {p}a
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Tipo tasa</label>
                  <div className="flex gap-1">
                    {["fija", "mixta", "variable"].map((t) => (
                      <button key={t} onClick={() => setTipoTasa(t)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${tipoTasa === t ? "bg-[#1E40AF] text-white" : "bg-slate-100 text-slate-500"}`}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Banco</label>
                  <select value={bancoSeleccionado} onChange={(e) => setBancoSeleccionado(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    {BANCOS.map((b) => <option key={b.id} value={b.id}>{b.nombre} ({b.tasa}%)</option>)}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info size={12} className="text-slate-400" />
                  <span className="text-xs text-slate-600">Tasa: <strong>{tasaFinal.toFixed(2)}%</strong> UF</span>
                </div>
                <span className="text-[10px] text-slate-400">CMF · {new Date().toLocaleDateString("es-CL")}</span>
              </div>
            </div>
          )}

          {/* 5. Seguros */}
          <SectionHeader num={5} title="Seguros" icon={Shield} />
          {seccionActiva === 5 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
              {SEGUROS.map((s) => (
                <label key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                  <input type="checkbox" checked={segurosOn[s.id]} onChange={() => setSegurosOn((p) => ({ ...p, [s.id]: !p[s.id] }))}
                    disabled={s.obligatorio} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-slate-700">{s.nombre}</span>
                    {s.obligatorio && <span className="ml-2 text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">obligatorio</span>}
                  </div>
                  <span className="text-[10px] text-slate-400">{(s.tasaAnual * 100).toFixed(2)}% anual</span>
                </label>
              ))}
            </div>
          )}

          {/* 6. Gastos operacionales */}
          <SectionHeader num={6} title="Gastos operacionales" icon={Calculator} />
          {seccionActiva === 6 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
              {GASTOS.map((g, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-600">{g.nombre}</span>
                  <span className="text-xs font-bold text-slate-800">{g.monto ? fmt(g.monto) : `${(g.porc! * 100).toFixed(2)}%`}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-700">Total gastos iniciales</span>
                <span className="text-sm font-bold text-blue-600">{fmt(totalGastos)}</span>
              </div>
            </div>
          )}

          {/* Inversión inicial */}
          {resultado && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Inversión inicial total</span>
                <span className="text-lg font-bold text-[#1E40AF]">{fmt(pie + totalGastos)}</span>
              </div>
              <p className="text-[10px] text-slate-400">Pie + gastos operacionales</p>
            </div>
          )}

          {/* CTA Calcular */}
          <button onClick={irAResultados} className="w-full py-4 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white rounded-xl text-sm font-bold transition-colors shadow-lg flex items-center justify-center gap-2">
            <Calculator size={18} /> Calcular mi dividendo
          </button>
          <p className="text-center text-[10px] text-slate-400">100% Gratis · Sin compromiso</p>

          {/* Ayuda */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-xs font-bold text-slate-700 mb-1">¿Dudas? Te ayudamos</p>
            <p className="text-[10px] text-slate-400 mb-3">Nuestros expertos están listos para asesorarte.</p>
            <div className="flex gap-2 justify-center">
              <a href="https://wa.me/56966842168" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-[11px] font-semibold hover:bg-green-600 transition-colors">
                <MessageSquare size={12} /> Escríbenos por WhatsApp
              </a>
              <a href="#"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1E40AF] text-white rounded-lg text-[11px] font-semibold hover:bg-[#1E3A8A] transition-colors">
                <Phone size={12} /> Solicitar pre evaluación GRATIS
              </a>
            </div>
          </div>
        </div>

        {/* Columna derecha — Resultados */}
        <div ref={resultadosRef} className="lg:col-span-3 space-y-5">
          {resultado ? (
            <>
              {/* Card dividendo principal */}
              <div className="bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#3B82F6] rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-5"><Home size={200} /></div>
                <p className="text-sm text-blue-200/70 mb-1">Tu dividendo mensual estimado</p>
                <p className="text-4xl font-bold tracking-tight mb-2">{fmt(resultado.dividendo)}</p>
                <p className="text-xs text-blue-200/60">Calculado con tasas reales CMF y seguros incluidos</p>
              </div>

              {/* Cards resumen */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Monto crédito", value: fmt(montoCredito) },
                  { label: "Monto del pie", value: fmt(pie), sub: `${porcentajePie.toFixed(0)}%` },
                  { label: "Plazo", value: `${plazo} años` },
                  { label: "Tasa", value: `${tasaFinal.toFixed(2)}%` },
                ].map((c, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] text-slate-400 font-semibold">{c.label}</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{c.value}</p>
                    {c.sub && <p className="text-[10px] text-slate-400">{c.sub}</p>}
                  </div>
                ))}
              </div>

              {/* Desglose + Donut */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Desglose del dividendo mensual</h3>
                <div className="flex items-center gap-8">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="w-3 h-3 bg-[#1E40AF] rounded-full" /><span className="text-xs text-slate-600">Dividendo sin seguros</span></div>
                      <span className="text-xs font-bold text-slate-800">{fmt(resultado.cuotaBase)}</span>
                    </div>
                    {resultado.segurosCalc.map((s, i) => (
                      <div key={s.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: resultado.COLORS[(i + 1) % resultado.COLORS.length] }} />
                          <span className="text-xs text-slate-600">{s.nombre}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800">{fmt(s.mensual)}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Total mensual</span>
                      <span className="text-sm font-bold text-[#1E40AF]">{fmt(resultado.dividendo)}</span>
                    </div>
                  </div>
                  <div className="w-40 h-40 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={resultado.donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                          {resultado.donutData.map((_: any, i: number) => <Cell key={i} fill={resultado.COLORS[i % resultado.COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h4 className="text-xs font-bold text-slate-700 mb-3">Saldo pendiente</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={resultado.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={Math.floor(plazo / 5)} />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="saldo" stroke="#1E40AF" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h4 className="text-xs font-bold text-slate-700 mb-3">Capital vs Interés por año</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={resultado.barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={Math.floor(plazo / 5)} />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                      <Bar dataKey="capital" fill="#1E40AF" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="interes" fill="#FFD447" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CAE y Costo total */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">CAE Referencial</p>
                  <p className="text-xl font-bold text-[#1E40AF] mt-1">{resultado.cae.toFixed(2)}%</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Costo total</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{fmt(resultado.costoTotal)}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Intereses totales</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{fmt(resultado.intereses)}</p>
                </div>
              </div>

              {/* Capacidad de endeudamiento */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-blue-500" /> Indicador financiero</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold mb-1">Capacidad de endeudamiento</p>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${nivelFinanciero.bg.replace("bg-", "bg-")}`} style={{ width: `${nivelFinanciero.pct}%` }} />
                    </div>
                    <p className={`text-xs font-bold mt-1 ${nivelFinanciero.color}`}>{nivelFinanciero.label}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold mb-1">Dividendo vs Ingreso</p>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((resultado.dividendo / totalIngresos) * 100 * 3, 100)}%` }} />
                    </div>
                    <p className="text-xs font-bold text-slate-600 mt-1">{totalIngresos > 0 ? ((resultado.dividendo / totalIngresos) * 100).toFixed(1) : 0}% de ingresos</p>
                  </div>
                </div>
              </div>

              {/* Comparador bancario */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><GitCompare size={16} className="text-blue-500" /> Comparador Bancario</h3>
                  <span className="text-[10px] text-slate-400">Ordenado por dividendo más bajo</span>
                </div>
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 font-bold text-slate-400 text-[10px]">Banco</th>
                      <th className="text-right px-4 py-2.5 font-bold text-slate-400 text-[10px]">Tasa</th>
                      <th className="text-right px-4 py-2.5 font-bold text-slate-400 text-[10px]">CAE</th>
                      <th className="text-right px-4 py-2.5 font-bold text-slate-400 text-[10px]">Dividendo</th>
                      <th className="text-right px-4 py-2.5 font-bold text-slate-400 text-[10px]">Costo total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparacion.map((b, i) => (
                      <tr key={b.id} className={`border-b border-slate-50 transition-colors ${b.id === bancoSeleccionado ? "bg-blue-50/50" : "hover:bg-slate-50"}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {i === 0 && <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1 py-0.5 rounded font-bold">MEJOR</span>}
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                            <span className="font-semibold text-slate-700">{b.nombre}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-600">{b.tasa.toFixed(2)}%</td>
                        <td className="px-4 py-3 text-right text-slate-600">{b.cae.toFixed(2)}%</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">{fmt(b.dividendo)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{fmt(b.costoTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Escenarios comparativos */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Lightbulb size={16} className="text-amber-500" /> Comparador de escenarios</h3>
                <div className="grid grid-cols-3 gap-3">
                  {escenarios.map((e) => (
                    <div key={e.plazo} className={`p-4 rounded-xl border-2 transition-all ${e.plazo === plazo ? "border-[#1E40AF] bg-blue-50" : "border-slate-200"}`}>
                      <p className="text-xs font-bold text-slate-700">{e.plazo} años</p>
                      <p className="text-lg font-bold text-slate-800 mt-1">{fmt(e.dividendo)}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Costo: {fmt(e.costoTotal)}</p>
                      {e.plazo !== plazo && (
                        <button onClick={() => setPlazo(e.plazo)} className="mt-2 text-[10px] font-bold text-[#1E40AF] hover:underline">
                          Seleccionar →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabla amortización */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Tabla de amortización</h3>
                  <button onClick={handleCopiar} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors">
                    <Copy size={10} /> Copiar
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-2.5 font-bold text-slate-400 text-[10px]">Año</th>
                        <th className="text-right px-4 py-2.5 font-bold text-slate-400 text-[10px]">Saldo Inicial</th>
                        <th className="text-right px-4 py-2.5 font-bold text-slate-400 text-[10px]">Dividendo</th>
                        <th className="text-right px-4 py-2.5 font-bold text-slate-400 text-[10px]">Interés</th>
                        <th className="text-right px-4 py-2.5 font-bold text-slate-400 text-[10px]">Capital</th>
                        <th className="text-right px-4 py-2.5 font-bold text-slate-400 text-[10px]">Saldo Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.tabla.map((fila: any) => (
                        <tr key={fila.año} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 font-bold text-slate-700">{fila.año}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{fmt(fila.saldoInicial)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-[#1E40AF]">{fmt(fila.dividendo)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{fmt(fila.interes)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{fmt(fila.capital)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{fmt(fila.saldoFinal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
                <p className="text-[11px] font-bold text-amber-700 mb-1">Importante</p>
                <p className="text-[10px] text-amber-600 leading-relaxed">
                  Los resultados son referenciales y no constituyen una oferta de crédito.
                  El monto final dependerá de la evaluación comercial y antecedentes financieros.
                </p>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-[#1E40AF] to-[#2563EB] rounded-2xl p-6 text-center">
                <h3 className="text-lg font-bold text-white mb-2">¿Te gustó el resultado?</h3>
                <p className="text-sm text-blue-200/70 mb-4">Nuestros asesores pueden ayudarte a conseguir una mejor aprobación.</p>
                <div className="flex gap-3 justify-center">
                  <a href="#" className="flex items-center gap-2 px-5 py-3 bg-[#FFD447] text-slate-900 rounded-xl text-xs font-bold hover:bg-yellow-400 transition-colors">
                    <Calculator size={14} /> Solicitar Pre Evaluación GRATIS
                  </a>
                  <a href="https://wa.me/56966842168" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-colors">
                    <MessageSquare size={14} /> Hablar por WhatsApp
                  </a>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
              <Home size={56} className="text-slate-200 mx-auto mb-4" />
              <p className="text-lg font-bold text-slate-600">Ingresa tus datos para ver la simulación</p>
              <p className="text-sm text-slate-400 mt-1">Los resultados se actualizan en tiempo real</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
