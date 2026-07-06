import type { Lead } from "@/tipos";

// Definición de reglas por etapa
export interface ReglaValidacion {
  id: string;
  nombre: string;
  descripcion: string;
  verificar: (lead: Lead) => boolean;
  obligatoria: boolean;
}

// Reglas para cada etapa
export const REGLAS_POR_ETAPA: Record<string, ReglaValidacion[]> = {
  NUEVO_LEAD: [],
  CONTACTO_INICIAL: [
    {
      id: "contacto-info",
      nombre: "Información de contacto",
      descripcion: "El lead debe tener email o teléfono registrado",
      verificar: (lead) => !!(lead.email || lead.telefono),
      obligatoria: true,
    },
  ],
  CONTACTADO: [
    {
      id: "contacto-info",
      nombre: "Información de contacto",
      descripcion: "El lead debe tener email o teléfono",
      verificar: (lead) => !!(lead.email || lead.telefono),
      obligatoria: true,
    },
    {
      id: "primera-llamada",
      nombre: "Primer contacto registrado",
      descripcion: "Debe haber al menos una actividad de llamada",
      verificar: (lead) => lead.diasEnEtapa >= 1,
      obligatoria: false,
    },
  ],
  INTERESADO: [
    {
      id: "datos-completos",
      nombre: "Datos personales completos",
      descripcion: "Nombre, apellido, RUT y email son obligatorios",
      verificar: (lead) => !!(lead.nombre && lead.apellido && lead.rut && lead.email),
      obligatoria: true,
    },
    {
      id: "situacion-laboral",
      nombre: "Situación laboral definida",
      descripcion: "Debe indicar si es dependiente o independiente",
      verificar: (lead) => !!lead.situacionLaboral,
      obligatoria: true,
    },
  ],
  CALIFICACION_COMERCIAL: [
    {
      id: "monto-solicitado",
      nombre: "Monto solicitado definido",
      descripcion: "Debe indicar el monto del crédito solicitado",
      verificar: (lead) => !!(lead.montoSolicitado && lead.montoSolicitado > 0),
      obligatoria: true,
    },
    {
      id: "valor-propiedad",
      nombre: "Valor de propiedad",
      descripcion: "Debe indicar el valor de la propiedad",
      verificar: (lead) => !!(lead.valorPropiedad && lead.valorPropiedad > 0),
      obligatoria: true,
    },
    {
      id: "tipo-credito",
      nombre: "Tipo de crédito",
      descripcion: "Debe seleccionar el tipo de crédito",
      verificar: (lead) => !!lead.tipoCredito,
      obligatoria: true,
    },
  ],
  DOCS_PENDIENTES: [
    {
      id: "banco-asignado",
      nombre: "Banco asignado",
      descripcion: "Debe tener un banco asignado para la evaluación",
      verificar: (lead) => !!lead.banco,
      obligatoria: true,
    },
  ],
  DOCS_COMPLETAS: [
    {
      id: "documentos-completos",
      nombre: "Documentación completa",
      descripcion: "Todos los documentos obligatorios deben estar aprobados",
      verificar: (lead) => {
        // En producción esto verificaría contra la BD
        // Por ahora simulamos que si tiene etiqueta "docs-completos" está listo
        return lead.etiquetas?.includes("docs-completos") || lead.etapa === "DOCS_COMPLETAS";
      },
      obligatoria: true,
    },
  ],
  EVALUACION_BANCARIA: [
    {
      id: "documentos-verificados",
      nombre: "Documentos verificados",
      descripcion: "La documentación debe estar completa y verificada",
      verificar: (lead) => lead.etiquetas?.includes("docs-verificados") || true,
      obligatoria: true,
    },
    {
      id: "monto-validado",
      nombre: "Monto validado",
      descripcion: "El monto solicitado debe ser válido para el banco",
      verificar: (lead) => !!(lead.montoSolicitado && lead.montoSolicitado > 0),
      obligatoria: true,
    },
  ],
  PREAPROBADO: [],
  APROBADO: [
    {
      id: "aprobacion-banco",
      nombre: "Aprobación bancaria",
      descripcion: "El crédito debe tener aprobación del banco",
      verificar: (lead) => lead.etiquetas?.includes("aprobado-banco") || lead.etapa === "APROBADO",
      obligatoria: true,
    },
  ],
  FIRMA_DIGITAL: [
    {
      id: "documentos-finales",
      nombre: "Documentos finales",
      descripcion: "Todos los documentos para firma deben estar listos",
      verificar: (lead) => lead.etiquetas?.includes("docs-finales") || true,
      obligatoria: true,
    },
  ],
  NOTARIA: [],
  CREDITO_PAGADO: [
    {
      id: "desembolso",
      nombre: "Desembolso confirmado",
      descripcion: "El desembolso debe estar confirmado por el banco",
      verificar: (lead) => lead.etiquetas?.includes("desembolsado") || true,
      obligatoria: true,
    },
  ],
};

// Resultado de validación
export interface ResultadoValidacion {
  puedeAvanzar: boolean;
  reglasPasadas: ReglaValidacion[];
  reglasFallidas: ReglaValidacion[];
  advertencias: ReglaValidacion[];
}

// Validar si un lead puede avanzar a una etapa
export function validarAvance(lead: Lead, etapaDestino: string): ResultadoValidacion {
  const reglas = REGLAS_POR_ETAPA[etapaDestino] || [];

  const reglasPasadas: ReglaValidacion[] = [];
  const reglasFallidas: ReglaValidacion[] = [];
  const advertencias: ReglaValidacion[] = [];

  reglas.forEach((regla) => {
    const pasa = regla.verificar(lead);
    if (pasa) {
      reglasPasadas.push(regla);
    } else if (regla.obligatoria) {
      reglasFallidas.push(regla);
    } else {
      advertencias.push(regla);
    }
  });

  return {
    puedeAvanzar: reglasFallidas.length === 0,
    reglasPasadas,
    reglasFallidas,
    advertencias,
  };
}

// Obtener reglas de una etapa
export function obtenerReglasEtapa(etapa: string): ReglaValidacion[] {
  return REGLAS_POR_ETAPA[etapa] || [];
}

// Verificar si un lead cumple todas las reglas de una etapa
export function verificarCumplimiento(lead: Lead, etapa: string): boolean {
  const reglas = REGLAS_POR_ETAPA[etapa] || [];
  return reglas
    .filter((r) => r.obligatoria)
    .every((r) => r.verificar(lead));
}
