import { NextRequest, NextResponse } from "next/server";

import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { puedeAccederLead } from "@/lib/permisos-lead";
import { supabase } from "@/lib/supabase";
import {
  enviarMensajeWhatsApp,
  enviarPlantillaWhatsApp,
  isWhatsAppConfigured,
} from "@/lib/whatsapp";

const ROLES_OPERACIONALES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "EJECUTIVO",
  "AGENTE",
]);
const ROLES_ADMINISTRATIVOS = new Set(["SUPER_ADMIN", "ADMIN"]);
const TEMPLATE_PATTERN = /^[a-z0-9_]{1,512}$/;
const LANGUAGE_PATTERN = /^[a-z]{2,3}(?:_[A-Z]{2})?$/;

interface LeadWhatsApp {
  asignadoa?: string | null;
  email?: string | null;
  id: string;
  telefono?: string | null;
}

interface TemplateParameter {
  text: string;
  type: "text";
}

function badRequest(error: string) {
  return NextResponse.json({ success: false, error }, { status: 400 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number
): string | null {
  const value = body[field];
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) return null;
  return normalized;
}

function getTemplateParameters(value: unknown): TemplateParameter[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20) return null;

  const parameters: TemplateParameter[] = [];
  for (const parameter of value) {
    if (!isRecord(parameter) || parameter.type !== "text") return null;
    const text = getText(parameter, "text", 1_024);
    if (!text) return null;
    parameters.push({ type: "text", text });
  }
  return parameters;
}

async function getLead(leadId: string): Promise<LeadWhatsApp | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, telefono, asignadoa, email")
    .eq("id", leadId)
    .single();

  if (error || !data) return null;
  return data as LeadWhatsApp;
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  if (!ROLES_OPERACIONALES.has(auth.rol)) return forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Solicitud inválida");
  }
  if (!isRecord(body)) return badRequest("Solicitud inválida");

  const tipo = body.tipo === undefined ? "texto" : getText(body, "tipo", 20);
  if (tipo !== "texto" && tipo !== "plantilla") {
    return badRequest("Tipo de mensaje no válido");
  }
  if (tipo === "plantilla" && !ROLES_ADMINISTRATIVOS.has(auth.rol)) {
    return forbidden();
  }

  const leadId = getText(body, "leadId", 128);
  if (!leadId) return badRequest("leadId es requerido");

  const lead = await getLead(leadId);
  if (!lead) {
    return NextResponse.json(
      { success: false, error: "Lead no encontrado" },
      { status: 404 }
    );
  }
  if (!puedeAccederLead(auth, lead)) return forbidden();

  const telefono = lead.telefono?.trim() ?? "";
  const digits = telefono.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) {
    return NextResponse.json(
      { success: false, error: "El lead no tiene un teléfono válido" },
      { status: 422 }
    );
  }
  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { success: false, error: "Integración de WhatsApp no configurada" },
      { status: 503 }
    );
  }

  try {
    const result =
      tipo === "plantilla"
        ? await sendTemplate(body, telefono)
        : await sendText(body, telefono);

    if (result instanceof Response) return result;
    if (!result.success) {
      console.error("El proveedor de WhatsApp rechazó el envío", result.error);
      return NextResponse.json(
        { success: false, error: "No se pudo enviar el mensaje" },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error("Error en API WhatsApp:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo enviar el mensaje" },
      { status: 502 }
    );
  }
}

async function sendText(body: Record<string, unknown>, telefono: string) {
  const mensaje = getText(body, "mensaje", 4_096);
  if (!mensaje) return badRequest("Mensaje no válido");
  return enviarMensajeWhatsApp({ telefono, mensaje });
}

async function sendTemplate(body: Record<string, unknown>, telefono: string) {
  const nombrePlantilla = getText(body, "nombrePlantilla", 512);
  const idioma =
    body.idioma === undefined ? "es" : getText(body, "idioma", 10);
  const parametros = getTemplateParameters(body.parametros);
  if (
    !nombrePlantilla ||
    !TEMPLATE_PATTERN.test(nombrePlantilla) ||
    !idioma ||
    !LANGUAGE_PATTERN.test(idioma) ||
    !parametros
  ) {
    return badRequest("Plantilla no válida");
  }

  return enviarPlantillaWhatsApp({
    telefono,
    nombrePlantilla,
    idioma,
    parametros,
  });
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  if (!ROLES_ADMINISTRATIVOS.has(auth.rol)) return forbidden();

  return NextResponse.json({ configured: isWhatsAppConfigured() });
}
