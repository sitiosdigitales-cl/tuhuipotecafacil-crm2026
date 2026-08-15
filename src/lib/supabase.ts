import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY no configuradas");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-key"
);

// Cliente admin con service role (bypass RLS) - solo server-side
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = serviceKey
  ? createClient(supabaseUrl || "https://placeholder.supabase.co", serviceKey)
  : supabase;

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
export function toSupabaseColumns(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key.toLowerCase()] = value;
  }
  return result;
}

// Convertir minusculas a camelCase para respuesta Supabase
export function fromSupabaseColumns(obj: Record<string, any>): Record<string, any> {
  if (!obj) return obj;
  const result: Record<string, any> = {};
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

export function fromSupabaseArray(arr: Record<string, any>[]): Record<string, any>[] {
  if (!arr) return [];
  return arr.map(fromSupabaseColumns);
}