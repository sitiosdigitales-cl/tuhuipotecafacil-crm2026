export interface CMFTasa {
  fecha: string;
  hasta?: string;
  tipoOperacion: string;
  codigoTipo?: string;
  tasa: number;
  moneda: string;
  fuente: string;
  fechaConsulta: Date;
}

export interface CMFStatus {
  activo: boolean;
  ultimaActualizacion: Date | null;
  totalRegistros: number;
  proximaActualizacion: Date | null;
  estadoAPI: "OK" | "ERROR" | "SIN_DATOS";
  ultimoError?: string;
}

export interface CMFHistorico {
  mes: string;
  tasaPromedio: number;
  tasaMinima: number;
  tasaMaxima: number;
  registros: number;
}

const CMF_NO_CONFIGURADA =
  "La integración oficial de tasas CMF no está configurada";

export async function fetchTasasCMF(): Promise<CMFTasa[]> {
  throw new Error(CMF_NO_CONFIGURADA);
}

export async function obtenerTasaVigente(
  tipoOperacion?: string,
  moneda?: string
): Promise<CMFTasa | null> {
  const tasas = await fetchTasasCMF();
  return tasas.find((tasa) => {
    if (
      tipoOperacion &&
      !tasa.tipoOperacion.toLowerCase().includes(tipoOperacion.toLowerCase())
    ) {
      return false;
    }
    if (moneda && tasa.moneda !== moneda) return false;
    return true;
  }) ?? tasas[0] ?? null;
}

export async function obtenerHistorico(
  meses = 12
): Promise<CMFHistorico[]> {
  const tasas = await fetchTasasCMF();
  const porMes: Record<string, number[]> = {};

  for (const tasa of tasas) {
    const mes = tasa.fecha.substring(0, 7);
    if (!porMes[mes]) porMes[mes] = [];
    porMes[mes].push(tasa.tasa);
  }

  const limite = Number.isFinite(meses) ? Math.max(0, Math.floor(meses)) : 12;
  return Object.entries(porMes)
    .sort(([mesA], [mesB]) => mesB.localeCompare(mesA))
    .slice(0, limite)
    .map(([mes, valores]) => ({
      mes,
      tasaPromedio:
        valores.reduce((total, valor) => total + valor, 0) / valores.length,
      tasaMinima: Math.min(...valores),
      tasaMaxima: Math.max(...valores),
      registros: valores.length,
    }));
}

export async function obtenerEstadoCMF(): Promise<CMFStatus> {
  return {
    activo: false,
    ultimaActualizacion: null,
    totalRegistros: 0,
    proximaActualizacion: null,
    estadoAPI: "SIN_DATOS",
    ultimoError: CMF_NO_CONFIGURADA,
  };
}

export async function actualizarTasas(): Promise<{
  exito: boolean;
  registros: number;
  mensaje: string;
}> {
  try {
    const tasas = await fetchTasasCMF();
    return {
      exito: true,
      registros: tasas.length,
      mensaje: `${tasas.length} tasas actualizadas`,
    };
  } catch (error) {
    return {
      exito: false,
      registros: 0,
      mensaje: error instanceof Error ? error.message : CMF_NO_CONFIGURADA,
    };
  }
}

export function calcularDividendo(
  monto: number,
  tasaAnual: number,
  plazoAnos: number
): {
  dividendo: number;
  cae: number;
  costoTotal: number;
  interesesTotales: number;
} {
  const tasaMensual = tasaAnual / 100 / 12;
  const totalMeses = plazoAnos * 12;
  const factor = Math.pow(1 + tasaMensual, totalMeses);
  const dividendo = tasaMensual === 0
    ? monto / totalMeses
    : monto * (tasaMensual * factor) / (factor - 1);
  const costoTotal = dividendo * totalMeses;
  const interesesTotales = costoTotal - monto;
  const cae = tasaAnual + 0.5;

  return { dividendo, cae, costoTotal, interesesTotales };
}

export function compararTasas(
  tasaActual: number,
  tasaAnterior: number
): {
  variacion: number;
  variacionPorcentual: number;
  tendencia: "sube" | "baja" | "estable";
  mensaje: string;
} {
  const variacion = tasaActual - tasaAnterior;
  const variacionPorcentual = tasaAnterior === 0
    ? 0
    : (variacion / tasaAnterior) * 100;

  if (Math.abs(variacion) < 0.01) {
    return {
      variacion,
      variacionPorcentual,
      tendencia: "estable",
      mensaje: "La tasa se mantiene estable",
    };
  }

  if (variacion > 0) {
    return {
      variacion,
      variacionPorcentual,
      tendencia: "sube",
      mensaje: `La tasa promedio aumentó ${Math.abs(variacion).toFixed(2)}%`,
    };
  }

  return {
    variacion,
    variacionPorcentual,
    tendencia: "baja",
    mensaje: `La tasa disminuyó ${Math.abs(variacion).toFixed(2)}%`,
  };
}
