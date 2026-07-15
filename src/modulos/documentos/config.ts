/**
 * Configuración del módulo Documentos
 * Tipos de documento por categoría y crédito
 */

import type { Rol } from "@/tipos";

// ─── Permisos ───
export const DOCUMENTOS_PERMISOS: Record<string, Rol[]> = {
  ver: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO", "CLIENTE"],
  subir: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO", "CLIENTE"],
  eliminar: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
  gestionarEstado: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
  solicitar: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"],
  previsualizar: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO", "CLIENTE"],
};

// ─── Estados de documento ───
export const DOCUMENTOS_ESTADOS = [
  { id: "PENDIENTE", label: "Pendiente", color: "#F59E0B", bgColor: "bg-amber-50" },
  { id: "EN_REVISION", label: "En Revisión", color: "#3B82F6", bgColor: "bg-blue-50" },
  { id: "APROBADO", label: "Aprobado", color: "#10B981", bgColor: "bg-emerald-50" },
  { id: "RECHAZADO", label: "Rechazado", color: "#EF4444", bgColor: "bg-red-50" },
] as const;

// ─── Tipos de documento por situación laboral ───
export const DOCUMENTOS_POR_SITUACION = {
  DEPENDIENTE: [
    { id: "cedula", nombre: "Cédula de Identidad por ambos lados (vigente)", obligatorio: true },
    { id: "liq-sueldo", nombre: "6 Últimas Liquidaciones de Sueldo", obligatorio: true },
    { id: "afp", nombre: "Certificado de Cotizaciones AFP (24 meses)", obligatorio: true },
    { id: "anexo-laboral", nombre: "Anexo o Permanencia Laboral", obligatorio: true },
    { id: "domicilio", nombre: "Cuenta Casa (luz, agua, gas, internet, celular o cartola AFP)", obligatorio: true },
    { id: "dicom", nombre: "Certificado de Deudas CMF", obligatorio: true },
  ],
  INDEPENDIENTE: [
    { id: "cedula", nombre: "Cédula de Identidad por ambos lados (vigente)", obligatorio: true },
    { id: "boletas", nombre: "6 Últimas Boletas con Impuesto", obligatorio: true },
    { id: "resumen-mensual", nombre: "6 Últimos Resúmenes Mensuales de Boletas", obligatorio: true },
    { id: "resumen-anual-2026", nombre: "Resumen Anual de Boletas Año 2026", obligatorio: true },
    { id: "resumen-anual-2025", nombre: "Resumen Anual de Boletas Año 2025", obligatorio: true },
    { id: "renta-2026", nombre: "Declaración de Renta 2026", obligatorio: true },
    { id: "aceptacion-renta-2026", nombre: "Aceptación de Renta 2026", obligatorio: true },
    { id: "cartera-trib", nombre: "Cartera Tributaria Actualizada 36 meses", obligatorio: true },
    { id: "dicom", nombre: "Certificado de Deudas CMF", obligatorio: true },
  ],
  EMPRESA: [
    { id: "cedula-socios", nombre: "CI por ambos lados de los socios o dueños", obligatorio: true },
    { id: "cartera-trib-36", nombre: "Cartera Tributaria Actualizada 36 meses", obligatorio: true },
    { id: "cartera-trib-credito", nombre: "Cartera Tributaria para Solicitar Créditos", obligatorio: true },
    { id: "balance-2025", nombre: "Balance 2025 firmado por contador", obligatorio: true },
    { id: "balance-2024", nombre: "Balance 2024 firmado por contador", obligatorio: true },
    { id: "renta-f22-2026", nombre: "Declaración de Renta F22 Compacto 2026", obligatorio: true },
    { id: "renta-f22-2025", nombre: "Declaración de Renta F22 Compacto 2025", obligatorio: true },
    { id: "aceptacion-renta-2026", nombre: "Aceptación de Renta 2026", obligatorio: true },
    { id: "aceptacion-renta-2025", nombre: "Aceptación de Renta 2025", obligatorio: true },
    { id: "rol-empresa", nombre: "Rol Empresa", obligatorio: true },
    { id: "cert-tgr", nombre: "Certificado de Deuda de TGR", obligatorio: true },
    { id: "dicom", nombre: "Certificado de Deudas CMF", obligatorio: true },
  ],
};

// ─── Documentos opcionales (patrimonio) ───
export const DOCUMENTOS_PATRIMONIO = [
  { id: "padron-vehiculo", nombre: "Padrón de Vehículo (para apalancar patrimonio)", obligatorio: false },
  { id: "dominio-propiedad", nombre: "Dominio Vigente de Propiedad (para apalancar patrimonio)", obligatorio: false },
  { id: "titulo", nombre: "Título Universitario o Certificado de Título (si aplica)", obligatorio: false },
] as const;

// ─── Función para obtener documentos según situación laboral ───
export function obtenerDocumentosPorSituacion(situacionLaboral: string) {
  return DOCUMENTOS_POR_SITUACION[situacionLaboral as keyof typeof DOCUMENTOS_POR_SITUACION] || [];
}

// ─── Función para obtener documentos completos (con patrimonio) ───
export function obtenerDocumentosCompletos(situacionLaboral: string) {
  const docsBase = obtenerDocumentosPorSituacion(situacionLaboral);
  return [...docsBase, ...DOCUMENTOS_PATRIMONIO];
}

// ─── Función para verificar permisos ───
export function tienePermisoDocumento(rol: string, accion: string): boolean {
  const permisos = DOCUMENTOS_PERMISOS[accion];
  if (!permisos) return false;
  return permisos.includes(rol as any);
}
