/**
 * Configuración del módulo Clientes
 * Reglas de negocio, permisos y labels
 */

import type { Rol } from "@/tipos";

// ─── Permisos ───
export const CLIENTES_PERMISOS: Record<string, Rol[]> = {
  ver: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO", "CLIENTE"],
  editar: ["SUPER_ADMIN", "ADMIN", "GERENTE", "CLIENTE"],
  verDocumentos: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO", "CLIENTE"],
  subirDocumentos: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO", "CLIENTE"],
  solicitarDocumentos: ["SUPER_ADMIN", "ADMIN", "GERENTE", "AGENTE", "EJECUTIVO"],
  gestionarEstado: ["SUPER_ADMIN", "ADMIN", "GERENTE"],
};

// ─── Secciones del perfil ───
export const CLIENTES_SECCIONES_PERFIL = [
  { id: "datos_personales", label: "Datos del Cliente", icono: "User" },
  { id: "patrimonio", label: "Patrimonio", icono: "Home" },
  { id: "datos_empleador", label: "Datos del Empleador", icono: "Briefcase" },
  { id: "ejecutivo", label: "Ejecutivo Asignado", icono: "UserCheck" },
] as const;

// ─── Categorías de documentos por tipo de trabajo ───
export const CLIENTES_DOCUMENTOS_DEPENDIENTE = [
  { id: "cedula", nombre: "Cédula de Identidad por ambos lados (vigente)", obligatorio: true },
  { id: "liq-sueldo", nombre: "6 Últimas Liquidaciones de Sueldo", obligatorio: true },
  { id: "afp", nombre: "Certificado de Cotizaciones AFP (24 meses)", obligatorio: true },
  { id: "anexo-laboral", nombre: "Anexo o Permanencia Laboral", obligatorio: true },
  { id: "domicilio", nombre: "Cuenta Casa (luz, agua, gas, internet, celular o cartola AFP)", obligatorio: true },
  { id: "dicom", nombre: "Certificado de Deudas CMF", obligatorio: true },
  { id: "titulo", nombre: "Título Universitario o Certificado de Título (si aplica)", obligatorio: false },
  { id: "padron-vehiculo", nombre: "Padrón de Vehículo (para apalancar patrimonio)", obligatorio: false },
  { id: "dominio-propiedad", nombre: "Dominio Vigente de Propiedad (para apalancar patrimonio)", obligatorio: false },
] as const;

export const CLIENTES_DOCUMENTOS_INDEPENDIENTE = [
  { id: "cedula", nombre: "Cédula de Identidad por ambos lados (vigente)", obligatorio: true },
  { id: "boletas", nombre: "6 Últimas Boletas con Impuesto", obligatorio: true },
  { id: "resumen-mensual", nombre: "6 Últimos Resúmenes Mensuales de Boletas", obligatorio: true },
  { id: "resumen-anual-2026", nombre: "Resumen Anual de Boletas Año 2026", obligatorio: true },
  { id: "resumen-anual-2025", nombre: "Resumen Anual de Boletas Año 2025", obligatorio: true },
  { id: "renta-2026", nombre: "Declaración de Renta 2026", obligatorio: true },
  { id: "aceptacion-renta-2026", nombre: "Aceptación de Renta 2026", obligatorio: true },
  { id: "cartera-trib", nombre: "Cartera Tributaria Actualizada 36 meses", obligatorio: true },
  { id: "dicom", nombre: "Certificado de Deudas CMF", obligatorio: true },
  { id: "titulo", nombre: "Título Universitario o Certificado de Título (si aplica)", obligatorio: false },
  { id: "padron-vehiculo", nombre: "Padrón de Vehículo (para apalancar patrimonio)", obligatorio: false },
  { id: "dominio-propiedad", nombre: "Dominio Vigente de Propiedad (para apalancar patrimonio)", obligatorio: false },
] as const;

export const CLIENTES_DOCUMENTOS_EMPRESA = [
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
] as const;

// ─── Función para obtener documentos según situación laboral y crédito ───
export function obtenerDocumentosRequeridos(
  situacionLaboral: string,
  _tipoCredito?: string
) {
  let docsBase: readonly { id: string; nombre: string; obligatorio: boolean }[] = [];
  
  switch (situacionLaboral) {
    case "DEPENDIENTE":
      docsBase = CLIENTES_DOCUMENTOS_DEPENDIENTE;
      break;
    case "INDEPENDIENTE":
      docsBase = CLIENTES_DOCUMENTOS_INDEPENDIENTE;
      break;
    case "EMPRESA":
      docsBase = CLIENTES_DOCUMENTOS_EMPRESA;
      break;
    default:
      docsBase = CLIENTES_DOCUMENTOS_DEPENDIENTE;
  }
  
  return [...docsBase];
}

// ─── Función para verificar permisos ───
export function tienePermisoCliente(rol: string, accion: string): boolean {
  const permisos = CLIENTES_PERMISOS[accion];
  if (!permisos) return false;
  return permisos.includes(rol as any);
}
