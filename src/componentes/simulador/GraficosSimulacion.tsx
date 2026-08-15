"use client";

import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

// Los graficos de la simulacion viven aparte para poder cargarlos con
// next/dynamic: recharts pesa ~400 KB por punto de entrada y estas tarjetas
// solo se pintan despues de que la persona ejecuta una simulacion.

export interface DatoDonut { name: string; value: number }
export interface DatoSaldo { name: string; saldo: number }
export interface DatoCapitalInteres { name: string; capital: number; interes: number }

type Formateador = (valor: number) => string;

const ESTILO_TOOLTIP = { fontSize: 10, borderRadius: 8 } as const;
const MILLONES = (v: number) => `${(v / 1_000_000).toFixed(0)}M`;

export function GraficoDistribucion({
  datos, colores, formato,
}: {
  datos: DatoDonut[];
  colores: string[];
  formato: Formateador;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={datos} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
          {datos.map((_, i) => (
            <Cell key={i} fill={colores[i % colores.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formato(Number(v))} contentStyle={{ fontSize: 11, borderRadius: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function GraficoSaldoPendiente({
  datos, plazo, formato,
}: {
  datos: DatoSaldo[];
  plazo: number;
  formato: Formateador;
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={datos}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={Math.floor(plazo / 5)} />
        <YAxis tick={{ fontSize: 9 }} tickFormatter={MILLONES} />
        <Tooltip formatter={(v) => formato(Number(v))} contentStyle={ESTILO_TOOLTIP} />
        <Line type="monotone" dataKey="saldo" stroke="#1E40AF" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GraficoCapitalInteres({
  datos, plazo, formato,
}: {
  datos: DatoCapitalInteres[];
  plazo: number;
  formato: Formateador;
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={datos}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={Math.floor(plazo / 5)} />
        <YAxis tick={{ fontSize: 9 }} tickFormatter={MILLONES} />
        <Tooltip formatter={(v) => formato(Number(v))} contentStyle={ESTILO_TOOLTIP} />
        <Bar dataKey="capital" fill="#1E40AF" radius={[3, 3, 0, 0]} />
        <Bar dataKey="interes" fill="#FFD447" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
