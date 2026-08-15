"use client";

/**
 * Los tres gráficos del simulador, en SVG a mano.
 *
 * Recharts pesa ~417 KiB para esta ruta y aquí solo se dibujan un anillo, una
 * línea y unas barras: formas que el SVG hace sin ayuda. En una página pública
 * ese peso no se justifica.
 *
 * El simulador del panel sigue usando Recharts, que va detrás de sesión y no
 * tiene presupuesto de descarga.
 */

export interface DatoDonut { name: string; value: number }
export interface DatoSaldo { name: string; saldo: number }
export interface DatoCapitalInteres { name: string; capital: number; interes: number }

type Formateador = (valor: number) => string;

const MILLONES = (v: number) => `${(v / 1_000_000).toFixed(0)}M`;

/** Anillo de proporciones. Un solo <circle> por porción, con dasharray. */
export function GraficoDistribucion({
  datos, colores, formato,
}: {
  datos: DatoDonut[];
  colores: string[];
  formato: Formateador;
}) {
  const total = datos.reduce((s, d) => s + d.value, 0) || 1;
  const radio = 56;
  const circunferencia = 2 * Math.PI * radio;

  // Cada porción arranca donde terminó la anterior. Se calcula acumulando en
  // el propio reduce en vez de mutar una variable durante el render.
  const porciones = datos.reduce<Array<{ largo: number; offset: number }>>(
    (acc, d) => {
      const previo = acc.length ? acc[acc.length - 1] : null;
      const inicio = previo ? -previo.offset + previo.largo : 0;
      acc.push({ largo: (d.value / total) * circunferencia, offset: -inicio });
      return acc;
    },
    []
  );

  return (
    <svg viewBox="0 0 160 160" className="w-full h-full" role="img" aria-label="Distribución del dividendo">
      <g transform="rotate(-90 80 80)">
        {datos.map((d, i) => (
          <circle
            key={i}
            cx="80" cy="80" r={radio}
            fill="none"
            stroke={colores[i % colores.length]}
            strokeWidth="22"
            strokeDasharray={`${porciones[i].largo} ${circunferencia - porciones[i].largo}`}
            strokeDashoffset={porciones[i].offset}
          >
            <title>{`${d.name}: ${formato(d.value)}`}</title>
          </circle>
        ))}
      </g>
    </svg>
  );
}

/** Línea del saldo pendiente. */
export function GraficoSaldoPendiente({
  datos, formato,
}: {
  datos: DatoSaldo[];
  plazo?: number;
  formato: Formateador;
}) {
  if (!datos.length) return <div className="h-[180px]" />;

  const ancho = 320, alto = 180, margen = { arriba: 8, derecha: 8, abajo: 20, izquierda: 40 };
  const max = Math.max(...datos.map((d) => d.saldo)) || 1;
  const anchoUtil = ancho - margen.izquierda - margen.derecha;
  const altoUtil = alto - margen.arriba - margen.abajo;

  const puntos = datos
    .map((d, i) => {
      const x = margen.izquierda + (i / Math.max(datos.length - 1, 1)) * anchoUtil;
      const y = margen.arriba + altoUtil - (d.saldo / max) * altoUtil;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full h-[180px]" role="img" aria-label="Saldo pendiente por año">
      {[0, 0.5, 1].map((f) => {
        const y = margen.arriba + altoUtil * f;
        return (
          <g key={f}>
            <line x1={margen.izquierda} y1={y} x2={ancho - margen.derecha} y2={y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={margen.izquierda - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
              {MILLONES(max * (1 - f))}
            </text>
          </g>
        );
      })}
      <polyline points={puntos} fill="none" stroke="#1E40AF" strokeWidth="2" />
      <text x={margen.izquierda} y={alto - 6} fontSize="9" fill="#94a3b8">{datos[0].name}</text>
      <text x={ancho - margen.derecha} y={alto - 6} textAnchor="end" fontSize="9" fill="#94a3b8">
        {datos[datos.length - 1].name}
      </text>
      <title>{`Saldo final: ${formato(datos[datos.length - 1].saldo)}`}</title>
    </svg>
  );
}

/** Barras apiladas de capital contra interés. */
export function GraficoCapitalInteres({
  datos, formato,
}: {
  datos: DatoCapitalInteres[];
  plazo?: number;
  formato: Formateador;
}) {
  if (!datos.length) return <div className="h-[180px]" />;

  const ancho = 320, alto = 180, margen = { arriba: 8, derecha: 8, abajo: 20, izquierda: 40 };
  const max = Math.max(...datos.map((d) => d.capital + d.interes)) || 1;
  const anchoUtil = ancho - margen.izquierda - margen.derecha;
  const altoUtil = alto - margen.arriba - margen.abajo;
  const anchoBarra = Math.max(anchoUtil / datos.length - 1, 1);

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full h-[180px]" role="img" aria-label="Capital e interés por año">
      {[0, 0.5, 1].map((f) => {
        const y = margen.arriba + altoUtil * f;
        return (
          <g key={f}>
            <line x1={margen.izquierda} y1={y} x2={ancho - margen.derecha} y2={y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={margen.izquierda - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
              {MILLONES(max * (1 - f))}
            </text>
          </g>
        );
      })}
      {datos.map((d, i) => {
        const x = margen.izquierda + (i / datos.length) * anchoUtil;
        const hCap = (d.capital / max) * altoUtil;
        const hInt = (d.interes / max) * altoUtil;
        const baseY = margen.arriba + altoUtil;
        return (
          <g key={i}>
            <rect x={x} y={baseY - hCap} width={anchoBarra} height={hCap} fill="#1E40AF" />
            <rect x={x} y={baseY - hCap - hInt} width={anchoBarra} height={hInt} fill="#FFD447" />
            <title>{`${d.name} — capital ${formato(d.capital)}, interés ${formato(d.interes)}`}</title>
          </g>
        );
      })}
      <text x={margen.izquierda} y={alto - 6} fontSize="9" fill="#94a3b8">{datos[0].name}</text>
      <text x={ancho - margen.derecha} y={alto - 6} textAnchor="end" fontSize="9" fill="#94a3b8">
        {datos[datos.length - 1].name}
      </text>
    </svg>
  );
}
