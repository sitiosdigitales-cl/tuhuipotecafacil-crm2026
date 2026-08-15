/**
 * Configuración del módulo Documentos
 * Tipos de documento por categoría y crédito
 * FUENTE ÚNICA DE VERDAD para todos los componentes
 */

import type { Rol } from "@/tipos";

// ─── Permisos ───
export const DOCUMENTOS_PERMISOS: Record<string, Rol[]> = {
  ver: ["SUPER_ADMIN", "ADMIN", "AGENTE", "EJECUTIVO", "CLIENTE"],
  subir: ["SUPER_ADMIN", "ADMIN", "AGENTE", "EJECUTIVO", "CLIENTE"],
  eliminar: ["SUPER_ADMIN", "ADMIN"],
  gestionarEstado: ["SUPER_ADMIN", "ADMIN"],
  solicitar: ["SUPER_ADMIN", "ADMIN", "AGENTE", "EJECUTIVO"],
  previsualizar: ["SUPER_ADMIN", "ADMIN", "AGENTE", "EJECUTIVO", "CLIENTE"],
};

// ─── Estados de documento ───
export const DOCUMENTOS_ESTADOS = [
  { id: "PENDIENTE", label: "Pendiente", color: "#F59E0B", bgColor: "bg-amber-50" },
  { id: "EN_REVISION", label: "En Revisión", color: "#3B82F6", bgColor: "bg-blue-50" },
  { id: "APROBADO", label: "Aprobado", color: "#10B981", bgColor: "bg-emerald-50" },
  { id: "RECHAZADO", label: "Rechazado", color: "#EF4444", bgColor: "bg-red-50" },
] as const;

// ─── Tipo de cada entrada de documento ───
export interface DocConfigEntry {
  id: string;
  tipo: string;
  nombre: string;
  obligatorio: boolean;
  buscarPor: string[];
}

// ─── Tipos de documento por situación laboral ───
export const DOCUMENTOS_POR_SITUACION: Record<string, DocConfigEntry[]> = {
  DEPENDIENTE: [
    { id: "cedula", tipo: "CEDULA_IDENTIDAD", nombre: "Cédula de Identidad por ambos lados (vigente)", obligatorio: true, buscarPor: ["cédula|cedula", "identidad"] },
    { id: "liq-sueldo", tipo: "LIQUIDACION_SUELDO", nombre: "6 Últimas Liquidaciones de Sueldo", obligatorio: true, buscarPor: ["liquidación|liquidacion|liquidaciones", "sueldo"] },
    { id: "afp", tipo: "CERTIFICADO_COTIZACIONES_AFP", nombre: "Certificado de Cotizaciones AFP (24 meses)", obligatorio: true, buscarPor: ["afp|cotizaciones"] },
    { id: "anexo-laboral", tipo: "ANEXO_LABORAL", nombre: "Anexo o Permanencia Laboral", obligatorio: true, buscarPor: ["anexo|permanencia", "laboral"] },
    { id: "domicilio", tipo: "COMPROBANTE_DOMICILIO", nombre: "Cuenta Casa (luz, agua, gas, internet, celular o cartola AFP)", obligatorio: true, buscarPor: ["domicilio|cuenta casa|luz|agua"] },
    { id: "dicom", tipo: "CERTIFICADO_CMF", nombre: "Certificado de Deudas CMF", obligatorio: true, buscarPor: ["cmf|dicom|deudas"] },
  ],
  INDEPENDIENTE: [
    { id: "cedula", tipo: "CEDULA_IDENTIDAD", nombre: "Cédula de Identidad por ambos lados (vigente)", obligatorio: true, buscarPor: ["cédula|cedula", "identidad"] },
    { id: "boletas", tipo: "BOLETAS_CON_IMPUESTO", nombre: "6 Últimas Boletas con Impuesto", obligatorio: true, buscarPor: ["boletas|boleta", "impuesto"] },
    { id: "resumen-mensual", tipo: "RESUMEN_MENSUAL_BOLETAS", nombre: "6 Últimos Resúmenes Mensuales de Boletas", obligatorio: true, buscarPor: ["resumen", "mensual", "boletas|boleta"] },
    { id: "resumen-anual-2026", tipo: "RESUMEN_ANUAL_BOLETAS", nombre: "Resumen Anual de Boletas Año 2026", obligatorio: true, buscarPor: ["resumen anual", "boletas|boleta", "2026"] },
    { id: "resumen-anual-2025", tipo: "RESUMEN_ANUAL_BOLETAS", nombre: "Resumen Anual de Boletas Año 2025", obligatorio: true, buscarPor: ["resumen anual", "boletas|boleta", "2025"] },
    { id: "renta-2026", tipo: "DECLARACION_RENTA_F22", nombre: "Declaración de Renta 2026", obligatorio: true, buscarPor: ["renta|declaración|declaracion", "2026"] },
    { id: "aceptacion-renta-2026", tipo: "ACEPTACION_RENTA", nombre: "Aceptación de Renta 2026", obligatorio: true, buscarPor: ["aceptación|aceptacion", "renta", "2026"] },
    { id: "cartera-trib", tipo: "CARTERA_TRIBUTARIA_36", nombre: "Cartera Tributaria Actualizada 36 meses", obligatorio: true, buscarPor: ["cartera", "tributaria", "36"] },
    { id: "dicom", tipo: "CERTIFICADO_CMF", nombre: "Certificado de Deudas CMF", obligatorio: true, buscarPor: ["cmf|dicom|deudas"] },
  ],
  EMPRESA: [
    { id: "cedula-socios", tipo: "CEDULA_IDENTIDAD", nombre: "CI por ambos lados de los socios o dueños", obligatorio: true, buscarPor: ["cédula|cedula|ci", "socios|dueños|duenos"] },
    { id: "cartera-trib-36", tipo: "CARTERA_TRIBUTARIA_36", nombre: "Cartera Tributaria Actualizada 36 meses", obligatorio: true, buscarPor: ["cartera", "tributaria", "36"] },
    { id: "cartera-trib-credito", tipo: "CARTERA_TRIBUTARIA_36", nombre: "Cartera Tributaria para Solicitar Créditos", obligatorio: true, buscarPor: ["cartera", "tributaria", "crédito|credito|solicitar"] },
    { id: "balance-2025", tipo: "BALANCE", nombre: "Balance 2025 firmado por contador", obligatorio: true, buscarPor: ["balance", "2025"] },
    { id: "balance-2024", tipo: "BALANCE", nombre: "Balance 2024 firmado por contador", obligatorio: true, buscarPor: ["balance", "2024"] },
    { id: "renta-f22-2026", tipo: "DECLARACION_RENTA_F22", nombre: "Declaración de Renta F22 Compacto 2026", obligatorio: true, buscarPor: ["renta", "f22", "2026"] },
    { id: "renta-f22-2025", tipo: "DECLARACION_RENTA_F22", nombre: "Declaración de Renta F22 Compacto 2025", obligatorio: true, buscarPor: ["renta", "f22", "2025"] },
    { id: "aceptacion-renta-2026", tipo: "ACEPTACION_RENTA", nombre: "Aceptación de Renta 2026", obligatorio: true, buscarPor: ["aceptación|aceptacion", "renta", "2026"] },
    { id: "aceptacion-renta-2025", tipo: "ACEPTACION_RENTA", nombre: "Aceptación de Renta 2025", obligatorio: true, buscarPor: ["aceptación|aceptacion", "renta", "2025"] },
    { id: "rol-empresa", tipo: "ROL_EMPRESA", nombre: "Rol Empresa", obligatorio: true, buscarPor: ["rol", "empresa"] },
    { id: "cert-tgr", tipo: "CERTIFICADO_DEUDA_TGR", nombre: "Certificado de Deuda de TGR", obligatorio: true, buscarPor: ["tgr|deuda tgr"] },
    { id: "dicom", tipo: "CERTIFICADO_CMF", nombre: "Certificado de Deudas CMF", obligatorio: true, buscarPor: ["cmf|dicom|deudas"] },
  ],
};

// ─── Documentos opcionales (patrimonio) ───
export const DOCUMENTOS_PATRIMONIO: DocConfigEntry[] = [
  { id: "padron-vehiculo", tipo: "PADRON_VEHICULO", nombre: "Padrón de Vehículo (para apalancar patrimonio)", obligatorio: false, buscarPor: ["vehículo", "vehiculo", "padrón", "padron"] },
  { id: "dominio-propiedad", tipo: "DOMINIO_PROPIEDAD", nombre: "Dominio Vigente de Propiedad (para apalancar patrimonio)", obligatorio: false, buscarPor: ["dominio", "propiedad"] },
  { id: "titulo", tipo: "TITULO_UNIVERSITARIO", nombre: "Título Universitario o Certificado de Título (si aplica)", obligatorio: false, buscarPor: ["título", "titulo", "universitario"] },
];

// ─── Función para obtener documentos según situación laboral ───
export function obtenerDocumentosPorSituacion(situacionLaboral: string): DocConfigEntry[] {
  return DOCUMENTOS_POR_SITUACION[situacionLaboral] || DOCUMENTOS_POR_SITUACION.DEPENDIENTE;
}

// ─── Función para obtener documentos completos (con patrimonio) ───
export function obtenerDocumentosCompletos(situacionLaboral: string): DocConfigEntry[] {
  const docsBase = obtenerDocumentosPorSituacion(situacionLaboral);
  return [...docsBase, ...DOCUMENTOS_PATRIMONIO];
}

/**
 * Tipos que aparecen en más de una entrada de la configuración.
 *
 * Varios requisitos comparten `tipo` porque solo se distinguen por el año:
 * `resumen-anual-2026` y `resumen-anual-2025` son ambos RESUMEN_ANUAL_BOLETAS,
 * igual que los dos balances y las dos declaraciones de renta. Para esos, el
 * tipo por sí solo no dice cuál de los dos requisitos se está cumpliendo.
 */
const TIPOS_AMBIGUOS: Set<string> = (() => {
  const cuenta = new Map<string, number>();
  const todas = [
    ...Object.values(DOCUMENTOS_POR_SITUACION).flat(),
    ...DOCUMENTOS_PATRIMONIO,
  ];
  for (const entrada of todas) {
    if (entrada.tipo) cuenta.set(entrada.tipo, (cuenta.get(entrada.tipo) || 0) + 1);
  }
  return new Set([...cuenta].filter(([, n]) => n > 1).map(([t]) => t));
})();

/**
 * Busca si un documento subido coincide con una entrada de config.
 * 1. Match por tipo exacto, solo si ese tipo identifica a un único requisito
 * 2. Match por keywords en el nombre del archivo (busca TODOS los grupos)
 * 3. Match por keywords en el campo tipo (puede ser nombre display si se subió con el nombre legible)
 */
export function buscarDocSubido(
  docSubido: { tipo?: string; nombre?: string },
  configEntry: DocConfigEntry
): boolean {
  // Match por tipo exacto, pero solo cuando ese tipo identifica a un único
  // requisito. Si lo comparten varios — el mismo documento de distintos años —
  // aceptarlo daría por cumplidos todos ellos con un solo archivo, y la
  // solicitud saldría al banco marcada como completa faltando un año.
  if (
    docSubido.tipo &&
    configEntry.tipo &&
    docSubido.tipo === configEntry.tipo &&
    !TIPOS_AMBIGUOS.has(configEntry.tipo)
  ) {
    return true;
  }

  // Función helper para matchear keywords contra un texto
  const matchKeywords = (texto: string): boolean => {
    const textoLower = texto.toLowerCase();
    return configEntry.buscarPor.every((grupo) => {
      const variantes = grupo.split("|");
      return variantes.some((v) => textoLower.includes(v.toLowerCase()));
    });
  };

  // Match por keywords en el nombre del archivo
  if (docSubido.nombre && matchKeywords(docSubido.nombre)) return true;

  // Match por keywords en el campo tipo (puede contener el nombre display del documento)
  if (docSubido.tipo && docSubido.tipo !== configEntry.tipo && matchKeywords(docSubido.tipo)) return true;

  return false;
}

// ─── Función para verificar permisos ───
export function tienePermisoDocumento(rol: string, accion: string): boolean {
  const permisos = DOCUMENTOS_PERMISOS[accion];
  if (!permisos) return false;
  return permisos.includes(rol as any);
}
