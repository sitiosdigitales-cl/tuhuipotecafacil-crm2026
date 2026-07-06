import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Valor de la UF en CLP (actualizado julio 2026)
 * Fuente: https://www.mindicador.cl/
 * Actualizar periódicamente o conectar a API
 */
export const VALOR_UF_CLP = 38957.56

/**
 * Convierte CLP a UF
 */
export function clpToUf(clp: number): number {
  return clp / VALOR_UF_CLP
}

/**
 * Convierte UF a CLP
 */
export function ufToClp(uf: number): number {
  return uf * VALOR_UF_CLP
}

/**
 * Formatea un número como Peso Chileno (CLP)
 * Formato estándar ISO: $ 1.234.567
 * - Símbolo $ seguido de espacio
 * - Sin decimales
 * - Punto como separador de miles
 * Ejemplo: 1234567 → "$ 1.234.567"
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
  // Formato chileno: punto para miles, coma para decimales
  const ufFormateado = uf.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${ufFormateado} UF`
}

/**
 * Formatea un monto corto en millones CLP
 * Ejemplo: 50000000 → "$ 50 MM", 1500000000 → "$ 1.500 MM"
 */
export function formatoMonedaAbreviado(valor: number): string {
  if (valor >= 1000000000) {
    const mm = valor / 1000000000
    return `$ ${mm.toFixed(1).replace(".0", "")} MM`
  }
  if (valor >= 1000000) {
    const m = valor / 1000000
    if (m >= 100) return `$ ${Math.round(m)} MM`
    return `$ ${m.toFixed(1).replace(".0", "")} M`
  }
  return formatoMoneda(valor)
}

/**
 * Formatea un monto con ambos formatos (CLP y UF)
 * Ejemplo: 20000000 → "$ 20.000.000 / 513,41 UF"
 */
export function formatoMontoyUF(valor: number): string {
  return `${formatoMoneda(valor)} / ${formatoUF(valor)}`
}

/**
 * Formatea un número como moneda abreviada (millones)
 * Ejemplo: 1000000 → "1.000", 1500000000 → "1.500"
 */
export function formatoMontoCorto(valor: number): string {
  const millones = valor / 1000000
  if (millones >= 1000) {
    return `${(millones / 1000).toFixed(1).replace(".0", "")} MM`
  }
  return `${Math.round(millones).toLocaleString("es-CL")}`
}
