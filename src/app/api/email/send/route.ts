import { NextRequest, NextResponse } from "next/server";

import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import {
  enviarCreditoAprobado,
  enviarEmail,
  enviarEmailBienvenida,
  enviarEmailTemplate,
  enviarRecordatorio,
  enviarSolicitudDocumentos,
} from "@/lib/email";
import { puedeAccederLead } from "@/lib/permisos-lead";
import { supabase } from "@/lib/supabase";

const ROLES_OPERACIONALES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "EJECUTIVO",
  "AGENTE",
]);
const ROLES_ADMINISTRATIVOS = new Set(["SUPER_ADMIN", "ADMIN"]);
const TIPOS_CON_CONTENIDO_LIBRE = new Set(["custom", "template"]);
const TIPOS_VALIDOS = new Set([
  "custom",
  "template",
  "bienvenida",
  "documentos",
  "credito_aprobado",
  "recordatorio",
  "test",
]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LeadEmail {
  apellido?: string | null;
  asignadoa?: string | null;
  email?: string | null;
  id: string;
  nombre?: string | null;
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

function getOptionalText(
  body: Record<string, unknown>,
  field: string,
  maxLength: number
): string | undefined | null {
  if (body[field] === undefined) return undefined;
  return getText(body, field, maxLength);
}

function getTextOrNumber(
  body: Record<string, unknown>,
  field: string,
  maxLength: number
): string | null {
  const value = body[field];
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return getText(body, field, maxLength);
}

function getDocuments(body: Record<string, unknown>): string[] | null {
  if (!Array.isArray(body.documentos)) return null;
  if (body.documentos.length === 0 || body.documentos.length > 50) return null;

  const documents = body.documentos.map((document) =>
    typeof document === "string" ? document.trim() : ""
  );
  if (documents.some((document) => !document || document.length > 200)) {
    return null;
  }
  return documents;
}

function getTemplateData(
  body: Record<string, unknown>
): Record<string, string> | null {
  if (!isRecord(body.data)) return null;
  const entries = Object.entries(body.data);
  if (entries.length > 50) return null;

  const data: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (
      !key ||
      key.length > 100 ||
      typeof value !== "string" ||
      value.length > 10_000
    ) {
      return null;
    }
    data[key] = value;
  }
  return data;
}

async function getLead(leadId: string): Promise<LeadEmail | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, nombre, apellido, email, asignadoa")
    .eq("id", leadId)
    .single();

  if (error || !data) return null;
  return data as LeadEmail;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Solicitud inválida");
  }

  if (!isRecord(body)) return badRequest("Solicitud inválida");
  const tipo = getText(body, "tipo", 50);
  if (!tipo || !TIPOS_VALIDOS.has(tipo)) {
    return badRequest("Tipo de email no válido");
  }

  if (tipo === "test") {
    if (!ROLES_ADMINISTRATIVOS.has(auth.rol)) return forbidden();
    const to = getText(body, "to", 254);
    if (!to || !EMAIL_PATTERN.test(to)) return badRequest("Email no válido");

    const fechaPrueba = new Date().toLocaleString("es-CL");
    const resultado = await enviarEmail({
      to,
      subject: "Prueba de configuración - TuHipotecaFacil",
      html:
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center;"><h1 style="color: white; margin: 0;">Email de prueba exitoso</h1></div><div style="padding: 30px; background: #F8FAFC;"><h2 style="color: #1E293B;">Configuración SMTP funcionando</h2><p style="color: #475569; line-height: 1.6;">La configuración de email de TuHipotecaFacil está funcionando correctamente.</p><div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #E2E8F0;"><p style="color: #64748B; margin: 0;"><strong>Fecha:</strong> ' +
        fechaPrueba +
        '</p></div></div></div>',
    });
    return emailResult(resultado);
  }

  if (!ROLES_OPERACIONALES.has(auth.rol)) return forbidden();
  if (
    TIPOS_CON_CONTENIDO_LIBRE.has(tipo) &&
    !ROLES_ADMINISTRATIVOS.has(auth.rol)
  ) {
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

  const email = lead.email?.trim().toLowerCase() ?? "";
  const nombre = [lead.nombre, lead.apellido]
    .filter((part): part is string => typeof part === "string" && !!part.trim())
    .map((part) => part.trim())
    .join(" ");
  if (!nombre || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { success: false, error: "El lead no tiene datos de contacto válidos" },
      { status: 422 }
    );
  }

  let resultado: boolean;
  switch (tipo) {
    case "custom": {
      const subject = getText(body, "subject", 200);
      const html = getText(body, "html", 100_000);
      const text = getOptionalText(body, "text", 100_000);
      if (!subject || subject.includes("\r") || subject.includes("\n") || !html) {
        return badRequest("Asunto o contenido no válido");
      }
      if (text === null) return badRequest("Contenido de texto no válido");
      resultado = await enviarEmail({ to: email, subject, html, text });
      break;
    }
    case "template": {
      const template = getText(body, "template", 100);
      const data = getTemplateData(body);
      if (!template || !data) return badRequest("Template o datos no válidos");
      resultado = await enviarEmailTemplate(template, email, data);
      break;
    }
    case "bienvenida":
      resultado = await enviarEmailBienvenida(email, nombre);
      break;
    case "documentos": {
      const documentos = getDocuments(body);
      if (!documentos) return badRequest("Documentos no válidos");
      resultado = await enviarSolicitudDocumentos(
        email,
        nombre,
        documentos
      );
      break;
    }
    case "credito_aprobado": {
      const monto = getTextOrNumber(body, "monto", 50);
      const banco = getText(body, "banco", 100);
      const plazo = getOptionalText(body, "plazo", 20);
      const cuota = getOptionalText(body, "cuota", 50);
      if (!monto || !banco || plazo === null || cuota === null) {
        return badRequest("Datos del crédito no válidos");
      }
      resultado = await enviarCreditoAprobado(
        email,
        nombre,
        monto,
        banco,
        plazo ?? "20",
        cuota ?? "0"
      );
      break;
    }
    case "recordatorio": {
      const asunto = getText(body, "asunto", 200);
      const mensaje = getText(body, "mensaje", 20_000);
      const fecha = getOptionalText(body, "fecha", 100);
      if (
        !asunto ||
        asunto.includes("\r") ||
        asunto.includes("\n") ||
        !mensaje ||
        fecha === null
      ) {
        return badRequest("Datos del recordatorio no válidos");
      }
      resultado = await enviarRecordatorio(
        email,
        nombre,
        asunto,
        mensaje,
        fecha
      );
      break;
    }
    default:
      return badRequest("Tipo de email no válido");
  }

  return emailResult(resultado);
}

function emailResult(resultado: boolean) {
  if (resultado) {
    return NextResponse.json({
      success: true,
      message: "Email enviado correctamente",
    });
  }
  return NextResponse.json(
    { success: false, error: "Error al enviar email" },
    { status: 500 }
  );
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!ROLES_OPERACIONALES.has(auth.rol)) return forbidden();

  const templates = [
    {
      id: "bienvenida",
      nombre: "Bienvenida",
      descripcion: "Email de bienvenida a nuevos clientes",
    },
    {
      id: "documentos",
      nombre: "Solicitud de Documentos",
      descripcion: "Solicitar documentos pendientes",
    },
    {
      id: "credito_aprobado",
      nombre: "Crédito Aprobado",
      descripcion: "Notificar aprobación de crédito",
    },
    {
      id: "recordatorio",
      nombre: "Recordatorio",
      descripcion: "Enviar recordatorio genérico",
    },
  ];
  if (ROLES_ADMINISTRATIVOS.has(auth.rol)) {
    templates.push({
      id: "test",
      nombre: "Prueba SMTP",
      descripcion: "Enviar email de prueba para verificar configuración",
    });
  }

  return NextResponse.json({ success: true, templates });
}
