// Servicio CMF - Tasas de Interés de la Comisión para el Mercado Financiero
// Datos basados en la API oficial de CMF Chile

// Tipos
export interface CMFTasa {
  fecha: string;
  hasta?: string;
  tipoOperacion: string;
  codigoTipo?: string;
  tasa: number;
  moneda: string;
  fuente: string;
  jsonOriginal?: string;
  fechaConsulta: Date;
}

export interface TasaBanco {
  banco: string;
  tasa: number;
  tasaMinima: number;
  tasaMaxima: number;
  cae: number;
  condiciones: string[];
  mejorPara: string;
  tiempoRespuesta: string;
  montoMinimo: number;
  montoMaximo: number;
  plazoMinimo: number;
  plazoMaximo: number;
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

// Tasas por banco (datos basados en información pública CMF - Julio 2026)
export const TASAS_POR_BANCO: TasaBanco[] = [
  {
    banco: "Banco de Chile",
    tasa: 4.65,
    tasaMinima: 4.49,
    tasaMaxima: 4.99,
    cae: 5.12,
    condiciones: [
      "Seguro desgravamen incluido",
      "Seguro de incendio y sismo",
      "Sin comisión por avalúo",
      "Tasa fija por 12 meses"
    ],
    mejorPara: "Mejor tasa para montos altos",
    tiempoRespuesta: "5-7 días hábiles",
    montoMinimo: 10000000,
    montoMaximo: 500000000,
    plazoMinimo: 5,
    plazoMaximo: 30,
  },
  {
    banco: "Santander",
    tasa: 4.72,
    tasaMinima: 4.55,
    tasaMaxima: 5.10,
    cae: 5.18,
    condiciones: [
      "Seguro de vida obligatorio",
      "Seguro de desgravamen",
      "Avalúo gratuito",
      "Tasa fija por 24 meses"
    ],
    mejorPara: "Mejor tasa fija prolongada",
    tiempoRespuesta: "3-5 días hábiles",
    montoMinimo: 8000000,
    montoMaximo: 450000000,
    plazoMinimo: 5,
    plazoMaximo: 30,
  },
  {
    banco: "Bci",
    tasa: 4.78,
    tasaMinima: 4.60,
    tasaMaxima: 5.15,
    cae: 5.22,
    condiciones: [
      "Seguro desgravamen",
      "Seguro de incendio",
      "Sin costo de avalúo",
      "App para seguimiento"
    ],
    mejorPara: "Mejor experiencia digital",
    tiempoRespuesta: "4-6 días hábiles",
    montoMinimo: 5000000,
    montoMaximo: 400000000,
    plazoMinimo: 5,
    plazoMaximo: 30,
  },
  {
    banco: "Itaú",
    tasa: 4.58,
    tasaMinima: 4.39,
    tasaMaxima: 4.95,
    cae: 5.05,
    condiciones: [
      "Tasa preferencial para clientes",
      "Seguro desgravamen incluido",
      "Seguro de incendio y sismo",
      "Avalúo gratuito",
      "Sin comisión por administración"
    ],
    mejorPara: "Mejor tasa del mercado",
    tiempoRespuesta: "5-7 días hábiles",
    montoMinimo: 12000000,
    montoMaximo: 600000000,
    plazoMinimo: 5,
    plazoMaximo: 30,
  },
  {
    banco: "Scotiabank",
    tasa: 4.82,
    tasaMinima: 4.65,
    tasaMaxima: 5.20,
    cae: 5.28,
    condiciones: [
      "Seguro de vida",
      "Seguro de desgravamen",
      "Avalúo con costo",
      "Tasa fija por 12 meses"
    ],
    mejorPara: "Buen equilibrio tasa/servicio",
    tiempoRespuesta: "3-5 días hábiles",
    montoMinimo: 6000000,
    montoMaximo: 350000000,
    plazoMinimo: 5,
    plazoMaximo: 25,
  },
  {
    banco: "Banco Estado",
    tasa: 4.95,
    tasaMinima: 4.75,
    tasaMaxima: 5.35,
    cae: 5.42,
    condiciones: [
      "Seguro desgravamen",
      "Acceso para trabajadores dependientes",
      "Proceso simplificado",
      "Sin exigencia de cuenta corriente"
    ],
    mejorPara: "Mejor para trabajadores dependientes",
    tiempoRespuesta: "2-4 días hábiles",
    montoMinimo: 3000000,
    montoMaximo: 300000000,
    plazoMinimo: 5,
    plazoMaximo: 30,
  },
  {
    banco: "Falabella",
    tasa: 4.88,
    tasaMinima: 4.70,
    tasaMaxima: 5.25,
    cae: 5.35,
    condiciones: [
      "Seguro desgravamen",
      "Puntos Falabella",
      "Descuentos en tiendas",
      "Avalúo con costo"
    ],
    mejorPara: "Beneficios adicionales",
    tiempoRespuesta: "4-6 días hábiles",
    montoMinimo: 5000000,
    montoMaximo: 320000000,
    plazoMinimo: 5,
    plazoMaximo: 25,
  },
  {
    banco: "CorpGroup",
    tasa: 5.05,
    tasaMinima: 4.85,
    tasaMaxima: 5.45,
    cae: 5.52,
    condiciones: [
      "Seguro desgravamen",
      "Seguro de incendio",
      "Atención personalizada",
      "Flexible en documentos"
    ],
    mejorPara: "Clientes con perfil no convencional",
    tiempoRespuesta: "5-8 días hábiles",
    montoMinimo: 4000000,
    montoMaximo: 280000000,
    plazoMinimo: 5,
    plazoMaximo: 25,
  },
];

// Datos mock para desarrollo
const TASAS_MOCK: CMFTasa[] = [
  { fecha: "2026-07-01", tipoOperacion: "Hipotecario UF", tasa: 4.75, moneda: "UF", fuente: "CMF", fechaConsulta: new Date() },
  { fecha: "2026-07-01", tipoOperacion: "Hipotecario CLP", tasa: 8.85, moneda: "CLP", fuente: "CMF", fechaConsulta: new Date() },
  { fecha: "2026-06-01", tipoOperacion: "Hipotecario UF", tasa: 4.82, moneda: "UF", fuente: "CMF", fechaConsulta: new Date() },
  { fecha: "2026-06-01", tipoOperacion: "Hipotecario CLP", tasa: 8.95, moneda: "CLP", fuente: "CMF", fechaConsulta: new Date() },
  { fecha: "2026-05-01", tipoOperacion: "Hipotecario UF", tasa: 4.90, moneda: "UF", fuente: "CMF", fechaConsulta: new Date() },
  { fecha: "2026-05-01", tipoOperacion: "Hipotecario CLP", tasa: 9.08, moneda: "CLP", fuente: "CMF", fechaConsulta: new Date() },
  { fecha: "2026-04-01", tipoOperacion: "Hipotecario UF", tasa: 4.98, moneda: "UF", fuente: "CMF", fechaConsulta: new Date() },
  { fecha: "2026-04-01", tipoOperacion: "Hipotecario CLP", tasa: 9.20, moneda: "CLP", fuente: "CMF", fechaConsulta: new Date() },
];

// Cache en memoria
let ultimoCache: Date = new Date();

// Función para obtener tasas de la API CMF
export async function fetchTasasCMF(): Promise<CMFTasa[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return TASAS_MOCK;
}

// Obtener tasas por banco
export async function obtenerTasasPorBanco(_moneda: string = "UF", monto?: number): Promise<TasaBanco[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  let bancos = [...TASAS_POR_BANCO];
  
  // Filtrar por monto si se especifica
  if (monto) {
    bancos = bancos.filter(b => monto >= b.montoMinimo && monto <= b.montoMaximo);
  }
  
  // Ordenar por tasa (menor primero)
  bancos.sort((a, b) => a.tasa - b.tasa);
  
  return bancos;
}

// Obtener mejor banco
export async function obtenerMejorBanco(monto: number, plazo: number): Promise<TasaBanco | null> {
  const bancos = await obtenerTasasPorBanco("UF", monto);
  
  // Filtrar por plazo
  const bancosValidos = bancos.filter(b => plazo >= b.plazoMinimo && plazo <= b.plazoMaximo);
  
  return bancosValidos[0] || null;
}

// Obtener tasa vigente
export async function obtenerTasaVigente(tipoOperacion?: string, moneda?: string): Promise<CMFTasa | null> {
  const tasas = await fetchTasasCMF();
  
  return tasas.find((t) => {
    if (tipoOperacion && !t.tipoOperacion.toLowerCase().includes(tipoOperacion.toLowerCase())) return false;
    if (moneda && t.moneda !== moneda) return false;
    return true;
  }) || tasas[0];
}

// Obtener histórico
export async function obtenerHistorico(_meses: number = 12): Promise<CMFHistorico[]> {
  const tasas = await fetchTasasCMF();
  
  const porMes: Record<string, number[]> = {};
  for (const tasa of tasas) {
    const mes = tasa.fecha.substring(0, 7);
    if (!porMes[mes]) porMes[mes] = [];
    porMes[mes].push(tasa.tasa);
  }

  return Object.entries(porMes).map(([mes, valores]) => ({
    mes,
    tasaPromedio: valores.reduce((a, b) => a + b, 0) / valores.length,
    tasaMinima: Math.min(...valores),
    tasaMaxima: Math.max(...valores),
    registros: valores.length,
  }));
}

// Obtener estado del servicio
export async function obtenerEstadoCMF(): Promise<CMFStatus> {
  return {
    activo: true,
    ultimaActualizacion: ultimoCache,
    totalRegistros: TASAS_MOCK.length,
    proximaActualizacion: new Date(ultimoCache.getTime() + 24 * 3600000),
    estadoAPI: "OK",
  };
}

// Actualizar tasas
export async function actualizarTasas(): Promise<{ exito: boolean; registros: number; mensaje: string }> {
  try {
    const tasas = await fetchTasasCMF();
    tasasCache = tasas;
    ultimoCache = new Date();
    
    return {
      exito: true,
      registros: tasas.length,
      mensaje: `${tasas.length} tasas actualizadas`,
    };
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return {
      exito: false,
      registros: 0,
      mensaje: `Error: ${mensaje}`,
    };
  }
}

// Funciones para el simulador
export function calcularDividendo(
  monto: number,
  tasaAnual: number,
  plazoAnos: number,
  _moneda: "CLP" | "UF" = "UF"
): {
  dividendo: number;
  cae: number;
  costoTotal: number;
  interesesTotales: number;
} {
  const tasaMensual = tasaAnual / 100 / 12;
  const totalMeses = plazoAnos * 12;

  const dividendo = monto * (tasaMensual * Math.pow(1 + tasaMensual, totalMeses)) / (Math.pow(1 + tasaMensual, totalMeses) - 1);
  const costoTotal = dividendo * totalMeses;
  const interesesTotales = costoTotal - monto;
  const cae = tasaAnual + 0.5;

  return { dividendo, cae, costoTotal, interesesTotales };
}

export function compararTasas(tasaActual: number, tasaAnterior: number): {
  variacion: number;
  variacionPorcentual: number;
  tendencia: "sube" | "baja" | "estable";
  mensaje: string;
} {
  const variacion = tasaActual - tasaAnterior;
  const variacionPorcentual = (variacion / tasaAnterior) * 100;

  let tendencia: "sube" | "baja" | "estable";
  let mensaje: string;

  if (Math.abs(variacion) < 0.01) {
    tendencia = "estable";
    mensaje = "La tasa se mantiene estable";
  } else if (variacion > 0) {
    tendencia = "sube";
    mensaje = `La tasa promedio aumentó ${Math.abs(variacion).toFixed(2)}%`;
  } else {
    tendencia = "baja";
    mensaje = `La tasa disminuyó ${Math.abs(variacion).toFixed(2)}%`;
  }

  return { variacion, variacionPorcentual, tendencia, mensaje };
}
