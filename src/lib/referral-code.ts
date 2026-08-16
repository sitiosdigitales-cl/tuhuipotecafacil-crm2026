import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { getSupabaseAdmin } from "@/lib/supabase-admin";

const VERSION = "REF1";
const FIRMA_BYTES = 16;
const LONGITUD_MAXIMA_ID = 128;

export class ReferralCodeConfigurationError extends Error {
  constructor() {
    super("JWT_SECRET debe tener al menos 32 caracteres para emitir códigos de referido");
    this.name = "ReferralCodeConfigurationError";
  }
}

export interface ReferralOwner {
  id: string;
  nombre: string;
  apellido: string;
}

function obtenerSecreto(secreto?: string): string {
  const valor = secreto ?? process.env.JWT_SECRET;
  if (!valor || valor.length < 32) throw new ReferralCodeConfigurationError();
  return valor;
}

function firmar(payload: string, secreto: string): string {
  return createHmac("sha256", secreto)
    .update(`codigo-referido:v1:${payload}`)
    .digest()
    .subarray(0, FIRMA_BYTES)
    .toString("base64url");
}

export function createReferralCode(userId: string, secreto?: string): string {
  const id = userId.trim();
  if (!id || id.length > LONGITUD_MAXIMA_ID || /[\u0000-\u001f\u007f]/.test(id)) {
    throw new Error("Identificador de usuario inválido");
  }

  const payload = Buffer.from(id, "utf8").toString("base64url");
  return `${VERSION}.${payload}.${firmar(payload, obtenerSecreto(secreto))}`;
}

export function verifyReferralCode(codigo: string, secreto?: string): string | null {
  const coincidencia = /^REF1\.([A-Za-z0-9_-]{2,171})\.([A-Za-z0-9_-]{22})$/.exec(
    codigo.trim()
  );
  if (!coincidencia) return null;

  const [, payload, firmaRecibida] = coincidencia;
  const payloadDecodificado = Buffer.from(payload, "base64url");
  if (payloadDecodificado.toString("base64url") !== payload) return null;

  const firmaEsperada = firmar(payload, obtenerSecreto(secreto));
  const firmaRecibidaBuffer = Buffer.from(firmaRecibida, "ascii");
  const firmaEsperadaBuffer = Buffer.from(firmaEsperada, "ascii");
  if (
    firmaRecibidaBuffer.length !== firmaEsperadaBuffer.length ||
    !timingSafeEqual(firmaRecibidaBuffer, firmaEsperadaBuffer)
  ) {
    return null;
  }

  const userId = payloadDecodificado.toString("utf8");
  if (
    !userId ||
    userId.length > LONGITUD_MAXIMA_ID ||
    /[\u0000-\u001f\u007f]/.test(userId) ||
    Buffer.from(userId, "utf8").toString("base64url") !== payload
  ) {
    return null;
  }

  return userId;
}

export async function resolveReferralCode(codigo: string): Promise<ReferralOwner | null> {
  const userId = verifyReferralCode(codigo);
  if (!userId) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("usuarios")
    .select("id,nombre,apellido")
    .eq("id", userId)
    .eq("estado", "ACTIVO")
    .limit(1);

  if (error) throw error;
  const usuario = data?.[0];
  if (!usuario) return null;

  return {
    id: String(usuario.id),
    nombre: String(usuario.nombre ?? ""),
    apellido: String(usuario.apellido ?? ""),
  };
}
