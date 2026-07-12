"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calculator, DollarSign, TrendingUp, Calendar, Building2, RefreshCw,
  Shield, ShieldCheck, ShieldAlert, ChevronDown, Check, Info, Home,
  Wallet, Copy, Phone, MessageSquare, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const VALOR_UF_CLP = 38957.56;
const MINIMO_PIE = 0.20;

interface SeguroConfig {
  id: string;
  nombre: string;
  tasaMensual: number;
  base: "credito" | "propiedad";
  obligatorio: boolean;
}

const SEGUROS: SeguroConfig[] = [
  { id: "desgravamen", nombre: "Seguro de Desgravamen", tasaMensual: 0.00025, base: "credito", obligatorio: true },
  { id: "incendio", nombre: "Seguro de Incendio y Sismo", tasaMensual: 0.0000375, base: "propiedad", obligatorio: true },
  { id: "sismo", nombre: "Seguro de Sismo", tasaMensual: 0.00002, base: "propiedad", obligatorio: false },
];

const PLAZOS = [5, 10, 12, 15, 18, 20, 25, 30];

export default function SimuladorPage() {
  const [ingresoHogar, setIngresoHogar] = useState(2500000);
  const [valorPropiedad, setValorPropiedad] = useState(120000000);
  const [pie, setPie] = useState(24000000);
  const [plazo, setPlazo] = useState(20);
  const [tasa, setTasa] = useState(4.12);
  const [tipoDividendo, setTipoDividendo] = useState<"fijo" | "variable">("fijo");
  const [segurosOn, setSegurosOn] = useState({ desgravamen: true, incendio: true, sismo: true });
  const [loading, setLoading] = useState(true);

  const montoCredito = valorPropiedad - pie;
  const porcentajePie = valorPropiedad > 0 ? (pie / valorPropiedad) * 100 : 0;
  const pieUF = pie / VALOR_UF_CLP;

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/cmf/rates?moneda=UF");
        const data = await res.json();
        if (data.success && data.data?.tasa) setTasa(data.data.tasa);
      } catch { /* use default */ }
      finally { setLoading(false); }
    }
    cargar();
  }, []);

  const resultado = useMemo(() => {
    if (montoCredito <= 0 || plazo <= 0 || tasa <= 0) return null;
    const rMensual = tasa / 100 / 12;
    const n = plazo * 12;
    const dividendoBase = montoCredito * (rMensual * Math.pow(1 + rMensual, n)) / (Math.pow(1 + rMensual, n) - 1);

    const seguros = SEGUROS.filter((s) => segurosOn[s.id as keyof typeof segurosOn]).map((s) => {
      const monto = s.base === "credito" ? montoCredito * s.tasaMensual : valorPropiedad * s.tasaMensual * 12;
      return { id: s.id, nombre: s.nombre, mensual: monto };
    });
    const totalSeguros = seguros.reduce((a, s) => a + s.mensual, 0);
    const dividendoTotal = dividendoBase + totalSeguros;

    // CAE simplificado
    const totalPagado = dividendoTotal * n;
    const cae = ((totalPagado / montoCredito) ** (1 / plazo) - 1) * 100;
    const costoTotal = totalPagado;

    // Tabla de amortización anual (resumen)
    const tabla: { año: number; saldoInicial: number; dividendo: number; interes: number; abonoCapital: number; saldoFinal: number }[] = [];
    let saldo = montoCredito;
    for (let año = 1; año <= plazo; año++) {
      let interesAño = 0;
      let capitalAño = 0;
      for (let m = 0; m < 12; m++) {
        const interes = saldo * rMensual;
        const capital = dividendoBase - interes;
        interesAño += interes;
        capitalAño += capital;
        saldo = Math.max(0, saldo - capital);
      }
      tabla.push({
        año, saldoInicial: saldo + capitalAño,
        dividendo: dividendoBase + totalSeguros,
        interes: interesAño, abonoCapital: capitalAño, saldoFinal: saldo,
      });
    }

    return { dividendoBase, dividendoTotal, seguros, totalSeguros, cae, costoTotal, tabla };
  }, [montoCredito, plazo, tasa, segurosOn, valorPropiedad]);

  const formatMonto = (m: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(m);
  const formatMontoShort = (m: number) => {
    if (m >= 1000000) return `$${(m / 1000000).toFixed(0)}M`;
    return formatMonto(m);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#1a2744] via-[#1e3a5f] to-[#234876] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative px-8 py-8">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-white mb-2">Simulador de Crédito Hipotecario</h1>
            <p className="text-sm text-blue-200/80 mb-1">
              Calcula tu dividendo con tasas reales CMF y seguros incluidos
            </p>
            <p className="text-[11px] text-blue-300/60">
              Resultados estimados en base a datos reales del mercado.
            </p>
          </div>
        </div>
      </div>

      {/* Layout 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel Izquierdo — Inputs */}
        <div className="space-y-5">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Home size={16} className="text-blue-500" /> Ingresa tus datos
          </h2>

          {/* 1. Ingreso mensual */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">1. Ingreso mensual del hogar</label>
            <p className="text-[10px] text-slate-400 mt-0.5 mb-2">¿Cuál es tu ingreso mensual líquido de tu hogar?</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input type="text" value={ingresoHogar.toLocaleString("es-CL")} onChange={(e) => setIngresoHogar(Number(e.target.value.replace(/[^0-9]/g, "")))}
                className="w-full pl-7 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
            <p className="text-[10px] text-blue-600 mt-2 flex items-center gap-1">
              <Info size={10} /> El banco generalmente permite comprometer hasta el 25% del ingreso en dividendos.
            </p>
          </div>

          {/* 2. Valor propiedad */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">2. Valor de la propiedad</label>
            <p className="text-[10px] text-slate-400 mt-0.5 mb-2">¿Cuál es el valor de la propiedad que quieres comprar?</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input type="text" value={valorPropiedad.toLocaleString("es-CL")} onChange={(e) => setValorPropiedad(Number(e.target.value.replace(/[^0-9]/g, "")))}
                className="w-full pl-7 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
            <input type="range" min={20000000} max={500000000} step={1000000} value={valorPropiedad}
              onChange={(e) => setValorPropiedad(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-3 accent-blue-500" />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>$20.000.000</span><span>$500.000.000</span>
            </div>
          </div>

          {/* 3. Pie */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">3. Pie o ahorro inicial</label>
            <p className="text-[10px] text-slate-400 mt-0.5 mb-2">¿Cuánto tienes para el pie de la propiedad?</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input type="text" value={pie.toLocaleString("es-CL")} onChange={(e) => setPie(Number(e.target.value.replace(/[^0-9]/g, "")))}
                className="w-full pl-7 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-lg text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                ({porcentajePie.toFixed(0)}%)
              </span>
            </div>
            <input type="range" min={0} max={valorPropiedad} step={1000000} value={pie}
              onChange={(e) => setPie(Math.min(Number(e.target.value), valorPropiedad))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-3 accent-blue-500" />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>$0</span><span>{formatMontoShort(valorPropiedad)}</span>
            </div>
            {porcentajePie < 20 && (
              <p className="text-[10px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle size={10} /> El mínimo recomendado es 20%
              </p>
            )}
          </div>

          {/* 4. Plazo */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">4. Plazo del crédito</label>
            <p className="text-[10px] text-slate-400 mt-0.5 mb-2">¿En cuántos años quieres pagar tu crédito?</p>
            <select value={plazo} onChange={(e) => setPlazo(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none">
              {PLAZOS.map((p) => <option key={p} value={p}>{p} años</option>)}
            </select>
            <input type="range" min={5} max={30} step={1} value={plazo}
              onChange={(e) => setPlazo(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-3 accent-blue-500" />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>5 años</span><span>30 años</span>
            </div>
          </div>

          {/* 5. Tasa */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">5. Tasa de interés</label>
            <p className="text-[10px] text-slate-400 mt-0.5 mb-2">Tasa promedio ponderada publicada por la CMF</p>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input type="number" step="0.01" value={tasa} onChange={(e) => setTasa(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">%</span>
              </div>
              <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100">
                Tasa real CMF
              </span>
            </div>
            <p className="text-[10px] text-blue-500 mt-2 cursor-pointer hover:underline">
              Ver detalle de las tasas en CMF →
            </p>
          </div>

          {/* 6. Tipo dividendo + Seguros */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">6. Tipo de dividendo</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button onClick={() => setTipoDividendo("fijo")}
                className={`p-3 rounded-lg border-2 text-left transition-all ${tipoDividendo === "fijo" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                <div className="text-xs font-bold text-slate-800">Dividendo Fijo</div>
                <div className="text-[10px] text-slate-400">Misma cuota durante todo el plazo</div>
              </button>
              <button onClick={() => setTipoDividendo("variable")}
                className={`p-3 rounded-lg border-2 text-left transition-all ${tipoDividendo === "variable" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                <div className="text-xs font-bold text-slate-800">Dividendo Variable</div>
                <div className="text-[10px] text-slate-400">Varía según la tasa de interés</div>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Incluir seguros obligatorios</label>
              <div className="space-y-2 mt-2">
                {SEGUROS.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={segurosOn[s.id as keyof typeof segurosOn]}
                      onChange={() => setSegurosOn((p) => ({ ...p, [s.id]: !p[s.id as keyof typeof p] }))}
                      disabled={s.obligatorio}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-xs text-slate-700">{s.nombre}</span>
                    {s.obligatorio && <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">obligatorio</span>}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Calcular */}
          <button className="w-full py-4 bg-[#1a2744] hover:bg-[#0f1a2e] text-white rounded-xl text-sm font-bold transition-colors shadow-lg flex items-center justify-center gap-2">
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
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-[11px] font-semibold hover:bg-blue-700 transition-colors">
                <Phone size={12} /> Solicitar pre evaluación GRATIS
              </a>
            </div>
          </div>
        </div>

        {/* Panel Derecho — Resultados */}
        <div className="space-y-5">
          {resultado ? (
            <>
              {/* Dividendo estimado */}
              <div className="bg-gradient-to-br from-[#1a2744] to-[#234876] rounded-xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-3 right-3 opacity-10"><Home size={80} /></div>
                <p className="text-[11px] text-blue-200 font-semibold mb-1">Resultados de tu simulación</p>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-[10px] text-blue-300/70 mb-1">Tu dividendo mensual estimado</p>
                    <p className="text-3xl font-bold">{formatMonto(resultado.dividendoTotal)}</p>
                    <p className="text-[10px] text-blue-300/60 mt-1">Calculado con tasas reales CMF y seguros incluidos</p>
                  </div>
                </div>
              </div>

              {/* Cards resumen */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Monto del crédito", value: formatMonto(montoCredito), sub: `${(montoCredito / VALOR_UF_CLP).toFixed(0)} UF` },
                  { label: "Monto del pie", value: formatMonto(pie), sub: `${porcentajePie.toFixed(0)}% (${pieUF.toFixed(0)} UF)` },
                  { label: "Plazo del crédito", value: `${plazo} años`, sub: `${plazo * 12} meses` },
                  { label: "Tasa de interés", value: `${tasa.toFixed(2)}% anual`, sub: `CMF 05/06/2024` },
                ].map((card, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-3.5">
                    <p className="text-[10px] text-slate-400 font-semibold">{card.label}</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{card.value}</p>
                    <p className="text-[10px] text-slate-400">{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Desglose del dividendo */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Desglose del dividendo mensual</h3>
                <div className="flex items-start gap-6">
                  {/* Lista */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-500 rounded-full" />
                        <span className="text-xs text-slate-600">Dividendo sin seguros</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{formatMonto(resultado.dividendoBase)}</span>
                    </div>
                    {resultado.seguros.map((s) => (
                      <div key={s.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${s.id === "desgravamen" ? "bg-orange-400" : s.id === "incendio" ? "bg-green-400" : "bg-purple-400"}`} />
                          <span className="text-xs text-slate-600">{s.nombre}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800">{formatMonto(s.mensual)}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Total mensual</span>
                      <span className="text-sm font-bold text-blue-600">{formatMonto(resultado.dividendoTotal)}</span>
                    </div>
                  </div>

                  {/* Mini donut (CSS) */}
                  <div className="w-28 h-28 flex-shrink-0 relative">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                      {(() => {
                        const total = resultado.dividendoTotal || 1;
                        let acc = 0;
                        const colors = ["#3b82f6", "#f97316", "#22c55e", "#a855f7"];
                        return resultado.seguros.map((s, i) => {
                          const pct = (s.mensual / total) * 100;
                          const prev = acc;
                          acc += pct;
                          return <circle key={s.id} cx="18" cy="18" r="15.9" fill="none" stroke={colors[i % colors.length]} strokeWidth="3"
                            strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={`${-prev}`} />;
                        });
                      })()}
                      <circle cx="18" cy="18" r="12" fill="white" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[9px] text-slate-400">Total</span>
                      <span className="text-[11px] font-bold text-slate-800">{formatMontoShort(resultado.dividendoTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de amortización */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800">Tabla de amortización (resumen)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-2.5 font-bold text-slate-400 text-[10px]">Año</th>
                        <th className="text-right px-4 py-2.5 font-bold text-slate-400 text-[10px]">Saldo Inicial</th>
                        <th className="text-right px-4 py-2.5 font-bold text-slate-400 text-[10px]">Dividendo</th>
                        <th className="text-right px-4 py-2.5 font-bold text-slate-400 text-[10px]">Interés</th>
                        <th className="text-right px-4 py-2.5 font-bold text-slate-400 text-[10px]">Abono a Capital</th>
                        <th className="text-right px-4 py-2.5 font-bold text-slate-400 text-[10px]">Saldo Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.tabla.map((fila) => (
                        <tr key={fila.año} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2.5 font-bold text-slate-700">{fila.año}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{formatMonto(fila.saldoInicial)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-blue-600">{formatMonto(fila.dividendo)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{formatMonto(fila.interes)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{formatMonto(fila.abonoCapital)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{formatMonto(fila.saldoFinal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CAE */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Costo total del crédito</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">{formatMonto(resultado.costoTotal)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Incluye intereses y seguros</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">CAE Referencial</p>
                  <p className="text-lg font-bold text-blue-600 mt-1">{resultado.cae.toFixed(2)}%</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Costo Anual Equivalente ⓘ</p>
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
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Home size={48} className="text-slate-200 mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-600">Ingresa tus datos para ver la simulación</p>
              <p className="text-[11px] text-slate-400 mt-1">Los resultados se actualizan en tiempo real</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
