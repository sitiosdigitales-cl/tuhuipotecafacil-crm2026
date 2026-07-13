import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Valor de la UF en CLP (actualizado julio 2026)
 * Fuente: https://www.mindicador.cl/
 */
export const VALOR_UF_CLP = 40844.79

/**
 * Convierte CLP a UF
 */
export function clpToUf(clp: number): number {
  return clp / VALOR_UF_CLP
}

/**
 * Formatea un número como Peso Chileno (CLP)
 * Formato ISO: $ 1.234.567
 */
export function formatoMoneda(valor: number): string {
  const valorRedondeado = Math.round(valor)
  const formateado = valorRedondeado.toLocaleString("es-CL")
  return `$ ${formateado}`
}

/**
 * Formatea un número como UF
 * Ejemplo: 2000000 → "3.849,87 UF"
 */
export function formatoUF(valor: number): string {
  const uf = clpToUf(valor)
  const ufFormateado = uf.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${ufFormateado} UF`
}

/**
 * Formatea un monto abreviado en CLP
 * Ejemplo: 50000000 → "$ 50.000.000"
 */
export function formatoMonedaAbreviado(valor: number): string {
  return formatoMoneda(valor)
}
