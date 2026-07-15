/**
 * Módulo Mortgage AI
 * 
 * Inteligencia Artificial especializada en créditos hipotecarios.
 * 
 * Funciones:
 * - Resumen automático de expediente
 * - Clasificación de documentos
 * - Predicción de aprobación
 * - Comparador bancario inteligente
 * - Explicación de rechazos
 * - Redacción de correos
 * - Extracción de PDFs
 */

// ─── Tipos ───
export interface ResumenExpediente {
  leadId: string;
  resumen: string;
  riesgo: "bajo" | "medio" | "alto";
  fortalezas: string[];
  debilidades: string[];
  documentosFaltantes: string[];
  recomendaciones: string[];
  scoreAprobacion: number;
}

export interface ClasificacionDocumento {
  tipo: string;
  categoria: string;
  confianza: number;
  camposExtraidos: Record<string, string>;
}

export interface PrediccionAprobacion {
  leadId: string;
  probabilidad: number; // 0-100
  factoresPositivos: string[];
  factoresNegativos: string[];
  bancoRecomendado: string;
  tasaEstimada: number;
}

export interface ComparacionBanco {
  banco: string;
  tasa: number;
  cuotaMensual: number;
  costoTotal: number;
  ventajas: string[];
  desventajas: string[];
 score: number;
}

export interface ExplicacionRechazo {
  motivo: string;
  detalle: string;
  sugerencias: string[];
  documentosRequeridos: string[];
}

// ─── Configuración ───
export const MORTGAGE_AI_CONFIG = {
  nombre: "Mortgage AI",
  funciones: [
    "Resumen de expediente",
    "Clasificar documentos",
    "Predecir aprobación",
    "Comparar bancos",
    "Explicar rechazos",
    "Redactar correos",
    "Extraer PDFs",
    "Clasificar documentos",
    "Responder cliente",
    "Generar seguimiento",
    "Generar próxima tarea",
  ],
};

// ─── Servicios ───
export async function generarResumenExpediente(leadId: string): Promise<ResumenExpediente> {
  const response = await fetch("/api/chat", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: `Eres un asistente especializado en créditos hipotecarios chilenos. 
            Analiza el expediente del cliente y genera un resumen ejecutivo con:
            - Resumen del caso
            - Nivel de riesgo (bajo/medio/alto)
            - Fortalezas del perfil
            - Debilidades o puntos de atención
            - Documentos faltantes
            - Recomendaciones
            - Score de aprobación estimado (0-100)
            
            Responde en formato JSON.`,
        },
        {
          role: "user",
          content: `Genera un resumen del expediente para el lead ID: ${leadId}`,
        },
      ],
    }),
  });

  const data = await response.json();
  try {
    const contenido = data.messages?.[data.messages.length - 1]?.content || "{}";
    return JSON.parse(contenido);
  } catch {
    return {
      leadId,
      resumen: data.messages?.[data.messages.length - 1]?.content || "Error al generar resumen",
      riesgo: "medio",
      fortalezas: [],
      debilidades: [],
      documentosFaltantes: [],
      recomendaciones: [],
      scoreAprobacion: 50,
    };
  }
}

export async function clasificarDocumento(documentoUrl: string): Promise<ClasificacionDocumento> {
  const response = await fetch("/api/chat", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: `Eres un sistema de clasificación de documentos hipotecarios.
            Analiza el documento y clasifícalo en:
            - tipo: (liquidacion, AFP, cedula, contrato, boleta, renta, etc.)
            - categoria: (ingreso, identidad, laboral, financiero, otro)
            - confianza: (0-1)
            - camposExtraidos: información relevante extraída
            
            Responde en formato JSON.`,
        },
        {
          role: "user",
          content: `Clasifica este documento: ${documentoUrl}`,
        },
      ],
    }),
  });

  const data = await response.json();
  try {
    const contenido = data.messages?.[data.messages.length - 1]?.content || "{}";
    return JSON.parse(contenido);
  } catch {
    return {
      tipo: "desconocido",
      categoria: "otro",
      confianza: 0,
      camposExtraidos: {},
    };
  }
}

export async function predecirAprobacion(leadId: string): Promise<PrediccionAprobacion> {
  const response = await fetch("/api/chat", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: `Eres un analista de riesgo hipotecario chileno.
            Analiza el perfil del cliente y predice la probabilidad de aprobación.
            
            Factores a considerar:
            - Ingreso mensual
            - Relación cuota-ingreso (máx 30%)
            - Antigüedad laboral
            - Situación DICOM
            - Valor de la propiedad
            - Pie disponible
            - Documentación completa
            
            Responde en formato JSON con:
            - probabilidad (0-100)
            - factoresPositivos[]
            - factoresNegativos[]
            - bancoRecomendado
            - tasaEstimada`,
        },
        {
          role: "user",
          content: `Predice la aprobación para el lead ID: ${leadId}`,
        },
      ],
    }),
  });

  const data = await response.json();
  try {
    const contenido = data.messages?.[data.messages.length - 1]?.content || "{}";
    return JSON.parse(contenido);
  } catch {
    return {
      leadId,
      probabilidad: 50,
      factoresPositivos: [],
      factoresNegativos: [],
      bancoRecomendado: "Por definir",
      tasaEstimada: 0,
    };
  }
}

export async function compararBancos(leadId: string, bancos: string[]): Promise<ComparacionBanco[]> {
  const response = await fetch("/api/chat", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: `Eres un comparador de bancos hipotecarios chilenos.
            Compara los bancos para el perfil del cliente y devuelve:
            - banco
            - tasa estimada
            - cuotaMensual estimada
            - costoTotal
            - ventajas
            - desventajas
            - score (0-100)
            
            Responde en formato JSON array.`,
        },
        {
          role: "user",
          content: `Compara estos bancos para el lead ID ${leadId}: ${bancos.join(", ")}`,
        },
      ],
    }),
  });

  const data = await response.json();
  try {
    const contenido = data.messages?.[data.messages.length - 1]?.content || "[]";
    return JSON.parse(contenido);
  } catch {
    return bancos.map(b => ({
      banco: b,
      tasa: 0,
      cuotaMensual: 0,
      costoTotal: 0,
      ventajas: [],
      desventajas: [],
      score: 0,
    }));
  }
}

export async function explicarRechazo(leadId: string, banco: string): Promise<ExplicacionRechazo> {
  const response = await fetch("/api/chat", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: `Eres un asesor hipotecario que explica por qué un crédito fue rechazado.
            Analiza el caso y proporciona:
            - motivo principal del rechazo
            - detalle explicativo
            - sugerencias para mejorar el perfil
            - documentos adicionales requeridos
            
            Responde en formato JSON.`,
        },
        {
          role: "user",
          content: `Explica el rechazo del banco ${banco} para el lead ID: ${leadId}`,
        },
      ],
    }),
  });

  const data = await response.json();
  try {
    const contenido = data.messages?.[data.messages.length - 1]?.content || "{}";
    return JSON.parse(contenido);
  } catch {
    return {
      motivo: "No se pudo determinar",
      detalle: data.messages?.[data.messages.length - 1]?.content || "Error al analizar",
      sugerencias: [],
      documentosRequeridos: [],
    };
  }
}

export async function redactarCorreo(tipo: string, leadId: string, contexto?: string): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: `Eres un asistente de redacción de correos para una hipotecaria chilena.
            Redacta un correo profesional en español para el cliente.`,
        },
        {
          role: "user",
          content: `Redacta un correo de tipo "${tipo}" para el lead ID: ${leadId}. ${contexto || ""}`,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.messages?.[data.messages.length - 1]?.content || "Error al redactar correo";
}
