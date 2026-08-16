import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAdmin } from "./supabase-admin";

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = getSupabaseAdmin();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/**
 * Limpia un texto antes de interpolarlo en un filtro `.or()` de PostgREST.
 *
 * `.eq()`, `.in()` y compañía viajan como parámetros y son seguras. `.or()`
 * NO: recibe una cadena con sintaxis propia — `campo.operador.valor` separado
 * por comas y agrupado con paréntesis — así que un texto de búsqueda con una
 * coma o un paréntesis deja de ser un valor y pasa a ser estructura de la
 * consulta.
 *
 * Se quitan solo los caracteres que rompen la estructura:
 *   , ( )   separan y agrupan condiciones
 *   % *     comodines de LIKE; permiten además búsquedas costosas a propósito
 *   \ "     escape y comillas del parser
 *
 * El punto se conserva a propósito. PostgREST ya consumió los dos primeros
 * para `columna.operador`, así que en la posición de valor es un carácter
 * corriente — y quitarlo rompería buscar por correo, que es lo más frecuente.
 */
export function limpiarParaFiltro(texto: string): string {
  return texto
    .replace(/[,()%*\\"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

// Convertir camelCase a minusculas para columnas Supabase
export function toSupabaseColumns(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key.toLowerCase()] = value;
  }
  return result;
}

// Convertir minusculas a camelCase para respuesta Supabase
export function fromSupabaseColumns(obj: Record<string, unknown>): Record<string, unknown> {
  if (!obj) return obj;
  const result: Record<string, unknown> = {};
  const keyMap: Record<string, string> = {
    nombreejecutivo: "nombreEjecutivo",
    tipocredito: "tipoCredito",
    montosolicitado: "montoSolicitado",
    valorpropiedad: "valorPropiedad",
    piedisponible: "pieDisponible",
    situacionlaboral: "situacionLaboral",
    endicom: "enDicom",
    dicomdetalle: "dicomDetalle",
    rentamensual: "rentaMensual",
    cargaslegales: "cargasLegales",
    estadocivil: "estadoCivil",
    regimenmatrimonial: "regimenMatrimonial",
    fechanacimiento: "fechaNacimiento",
    domicilioparticular: "domicilioParticular",
    comunaciudad: "comunaCiudad",
    valorarriendo: "valorArriendo",
    nombreempleador: "nombreEmpleador",
    rutfactura: "rutEmpresa",
    fechaingreso: "fechaIngreso",
    rentaliquida: "rentaLiquida",
    bancoabonorenta: "bancoAbonoRenta",
    fechapago: "fechaPago",
    direccionlaboral: "direccionLaboral",
    comunaciudadlaboral: "comunaCiudadLaboral",
    telefonolaboralfijo: "telefonoLaboralFijo",
    emaillaboral: "emailLaboral",
    otrosingresos: "otrosIngresos",
    referidopor: "referidoPor",
    referidopornombre: "referidoPorNombre",
    codigoreferido: "codigoReferido",
    diasenetapa: "diasEnEtapa",
    creadoen: "creadoEn",
    actualizadoen: "actualizadoEn",
    leadid: "leadId",
    leadnombre: "leadNombre",
    usuarioid: "usuarioId",
    ultimacceso: "ultimoAcceso",
    creadopor: "creadoPor",
    fechavencimiento: "fechaVencimiento",
    nombrearchivo: "nombreArchivo",
    archivourl: "archivoUrl",
    fechainicio: "fechaInicio",
    fechafin: "fechaFin",
    ejecutivoid: "ejecutivoId",
    ejecutivonombre: "ejecutivoNombre",
    creditosaprobados: "creditosAprobados",
    montototal: "montoTotal",
    tasacomision: "tasaComision",
    comisiontotal: "comisionTotal",
    asignadoa: "asignadoA",
    cuentapie: "cuentaPie",
    complementarrenta: "complementarRenta",
  };
  for (const [key, value] of Object.entries(obj)) {
    const mapped = keyMap[key] || key;
    result[mapped] = value;
  }
  return result;
}

export function fromSupabaseArray(arr: Record<string, unknown>[]): Record<string, unknown>[] {
  if (!arr) return [];
  return arr.map(fromSupabaseColumns);
}
