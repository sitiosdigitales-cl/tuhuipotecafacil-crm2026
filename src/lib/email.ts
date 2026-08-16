import { Resend } from "resend";

import { escapeHtml, safeHttpUrl, sanitizeEmailHeader } from "./html-output";

const fromEmail = process.env.FROM_EMAIL || "CRM <notificaciones@tuhipotecafacil.cl>";

let resendClient: Resend | null = null;
let resendClientKey = "";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  if (!apiKey) return null;

  if (!resendClient || resendClientKey !== apiKey) {
    resendClient = new Resend(apiKey);
    resendClientKey = apiKey;
  }
  return resendClient;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailTemplate {
  nombre: string;
  asunto: string;
  contenido: string;
}

export type EmailTemplateData = Record<string, string | string[]>;

// Templates de email predefinidos
const EMAIL_TEMPLATES: Record<string, (data: Record<string, string>) => EmailTemplate> = {
  bienvenida: (data) => ({
    nombre: "Bienvenida",
    asunto: `¡Bienvenido a Tu Hipoteca Fácil, ${data.nombre}!`,
    contenido: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Tu Hipoteca Fácil</h1>
          <p style="color: #E0E7FF; margin: 5px 0 0;">CRM Hipotecario Inteligente</p>
        </div>
        <div style="padding: 30px; background: #F8FAFC;">
          <h2 style="color: #1E293B;">¡Hola ${data.nombre}!</h2>
          <p style="color: #475569; line-height: 1.6;">
            Tu solicitud de crédito ha sido recibida exitosamente. Nuestro equipo se pondrá en contacto contigo pronto.
          </p>
          <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #E2E8F0;">
            <h3 style="color: #3B82F6; margin: 0 0 10px;">Próximos pasos:</h3>
            <ul style="color: #475569; margin: 0; padding-left: 20px;">
              <li>Un ejecutivo te contactará en las próximas 24 horas</li>
              <li>Prepara tu documentación básica</li>
              <li>Revisa tu correo para actualizaciones</li>
            </ul>
          </div>
          <p style="color: #64748B; font-size: 14px;">
            Si tienes preguntas,回复 a este correo o llámanos al +56 9 2123 4567
          </p>
        </div>
        <div style="background: #1E293B; padding: 20px; text-align: center;">
          <p style="color: #94A3B8; margin: 0; font-size: 12px;">
            © 2026 Tu Hipoteca Fácil - Todos los derechos reservados
          </p>
        </div>
      </div>
    `,
  }),

  documentosPendientes: (data) => ({
    nombre: "Documentos Pendientes",
    asunto: `Documentos pendientes - ${data.nombre}`,
    contenido: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #F59E0B, #D97706); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Documentos Pendientes</h1>
        </div>
        <div style="padding: 30px; background: #F8FAFC;">
          <h2 style="color: #1E293B;">Hola ${data.nombre},</h2>
          <p style="color: #475569; line-height: 1.6;">
            Para continuar con tu solicitud de crédito, necesitamos los siguientes documentos:
          </p>
          <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #E2E8F0;">
            ${data.documentos}
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.urlPortal}" style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Subir Documentos
            </a>
          </div>
          <p style="color: #64748B; font-size: 14px;">
            Puedes subir tus documentos directamente desde nuestro portal seguro.
          </p>
        </div>
        <div style="background: #1E293B; padding: 20px; text-align: center;">
          <p style="color: #94A3B8; margin: 0; font-size: 12px;">
            © 2026 Tu Hipoteca Fácil - Todos los derechos reservados
          </p>
        </div>
      </div>
    `,
  }),

  creditoAprobado: (data) => ({
    nombre: "Crédito Aprobado",
    asunto: `¡Felicidades! Tu crédito ha sido aprobado`,
    contenido: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">¡Crédito Aprobado!</h1>
          <p style="color: #D1FAE5; margin: 5px 0 0;">Felicitaciones ${data.nombre}</p>
        </div>
        <div style="padding: 30px; background: #F8FAFC;">
          <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #E2E8F0;">
            <h3 style="color: #10B981; margin: 0 0 15px;">Resumen de tu crédito:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748B;">Monto aprobado:</td>
                <td style="padding: 8px 0; color: #1E293B; font-weight: bold; text-align: right;">$${data.monto}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748B;">Banco:</td>
                <td style="padding: 8px 0; color: #1E293B; font-weight: bold; text-align: right;">${data.banco}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748B;">Plazo:</td>
                <td style="padding: 8px 0; color: #1E293B; font-weight: bold; text-align: right;">${data.plazo} años</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748B;">Cuota mensual:</td>
                <td style="padding: 8px 0; color: #1E293B; font-weight: bold; text-align: right;">$${data.cuota}</td>
              </tr>
            </table>
          </div>
          <p style="color: #475569; line-height: 1.6;">
            Tu ejecutivo se contactará contigo para coordinar la firma de documentos y el desembolso.
          </p>
        </div>
        <div style="background: #1E293B; padding: 20px; text-align: center;">
          <p style="color: #94A3B8; margin: 0; font-size: 12px;">
            © 2026 Tu Hipoteca Fácil - Todos los derechos reservados
          </p>
        </div>
      </div>
    `,
  }),

  recordatorio: (data) => ({
    nombre: "Recordatorio",
    asunto: `Recordatorio: ${data.asunto}`,
    contenido: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6366F1, #4F46E5); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Recordatorio</h1>
        </div>
        <div style="padding: 30px; background: #F8FAFC;">
          <h2 style="color: #1E293B;">Hola ${data.nombre},</h2>
          <p style="color: #475569; line-height: 1.6;">
            ${data.mensaje}
          </p>
          ${data.fecha ? `
          <div style="background: white; border-radius: 12px; padding: 15px; margin: 20px 0; border: 1px solid #E2E8F0;">
            <p style="color: #6366F1; font-weight: bold; margin: 0;">📅 ${data.fecha}</p>
          </div>
          ` : ''}
        </div>
        <div style="background: #1E293B; padding: 20px; text-align: center;">
          <p style="color: #94A3B8; margin: 0; font-size: 12px;">
            © 2026 Tu Hipoteca Fácil - Todos los derechos reservados
          </p>
        </div>
      </div>
    `,
  }),
  notificacionDocumento: (data) => ({
    nombre: "Notificacion de Documento",
    asunto: data.evento + " - TuHipotecaFacil",
    contenido: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #6366F1, #4F46E5); padding: 30px; text-align: center;"><h1 style="color: white; margin: 0;">Notificacion de Documento</h1></div><div style="padding: 30px; background: #F8FAFC;"><h2 style="color: #1E293B;">Hola ' + data.nombre + ',</h2><p style="color: #475569; line-height: 1.6;">' + data.descripcion + '</p>' + (data.url ? '<div style="text-align: center; margin: 20px 0;"><a href="' + data.url + '" style="background: #6366F1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver Documento</a></div>' : '') + '</div><div style="background: #1E293B; padding: 20px; text-align: center;"><p style="color: #94A3B8; margin: 0; font-size: 12px;">© 2026 Tu Hipoteca Facil - Todos los derechos reservados</p></div></div>',
  }),

  notificacionLead: (data) => ({
    nombre: "Notificacion de Lead",
    asunto: data.evento + " - TuHipotecaFacil",
    contenido: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #3B82F6, #2563EB); padding: 30px; text-align: center;"><h1 style="color: white; margin: 0;">Notificacion de Lead</h1></div><div style="padding: 30px; background: #F8FAFC;"><h2 style="color: #1E293B;">Hola ' + data.nombre + ',</h2><p style="color: #475569; line-height: 1.6;">' + data.descripcion + '</p>' + (data.url ? '<div style="text-align: center; margin: 20px 0;"><a href="' + data.url + '" style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver Lead</a></div>' : '') + '</div><div style="background: #1E293B; padding: 20px; text-align: center;"><p style="color: #94A3B8; margin: 0; font-size: 12px;">© 2026 Tu Hipoteca Facil - Todos los derechos reservados</p></div></div>',
  }),

  notificacionTarea: (data) => ({
    nombre: "Notificacion de Tarea",
    asunto: data.evento + " - TuHipotecaFacil",
    contenido: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #F59E0B, #D97706); padding: 30px; text-align: center;"><h1 style="color: white; margin: 0;">Notificacion de Tarea</h1></div><div style="padding: 30px; background: #F8FAFC;"><h2 style="color: #1E293B;">Hola ' + data.nombre + ',</h2><p style="color: #475569; line-height: 1.6;">' + data.descripcion + '</p>' + (data.url ? '<div style="text-align: center; margin: 20px 0;"><a href="' + data.url + '" style="background: #F59E0B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver Tarea</a></div>' : '') + '</div><div style="background: #1E293B; padding: 20px; text-align: center;"><p style="color: #94A3B8; margin: 0; font-size: 12px;">© 2026 Tu Hipoteca Facil - Todos los derechos reservados</p></div></div>',
  }),
};

function templateDataAsText(data: EmailTemplateData): Record<string, string> {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(", ") : value,
    ])
  );
}

function safeTemplateData(data: EmailTemplateData): Record<string, string> {
  const safeData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      Array.isArray(value)
        ? value.map((item) => escapeHtml(item)).join(", ")
        : escapeHtml(value),
    ])
  );

  if (Array.isArray(data.documentos)) {
    const items = data.documentos
      .map((documento) => `<li>${escapeHtml(documento)}</li>`)
      .join("");
    safeData.documentos = `<ul style="color: #475569; margin: 0; padding-left: 20px;">${items}</ul>`;
  }

  for (const key of ["url", "urlPortal"]) {
    const value = data[key];
    if (typeof value === "string") {
      safeData[key] = value ? safeHttpUrl(value) : "";
    }
  }

  return safeData;
}

export function crearEmailDesdeTemplate(
  templateName: string,
  data: EmailTemplateData
): EmailTemplate | null {
  const template = EMAIL_TEMPLATES[templateName];
  if (!template) return null;

  const rawTemplate = template(templateDataAsText(data));
  const safeTemplate = template(safeTemplateData(data));
  return {
    nombre: rawTemplate.nombre,
    asunto: sanitizeEmailHeader(rawTemplate.asunto),
    contenido: safeTemplate.contenido,
  };
}

// Enviar email
export async function enviarEmail(options: EmailOptions): Promise<boolean> {
  try {
    const client = getResendClient();
    if (!client) {
      const simulacionExplicita =
        process.env.NODE_ENV !== "production" &&
        process.env.EMAIL_SIMULATION === "true";
      if (simulacionExplicita) {
        console.info("[email] Entrega simulada por configuración explícita");
        return true;
      }

      console.error("[email] RESEND_API_KEY no está configurada");
      return false;
    }

    await client.emails.send({
      from: options.from || fromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log("📧 Email enviado exitosamente a:", options.to);
    return true;

  } catch (error) {
    console.error("Error al enviar email:", error);
    return false;
  }
}

// Enviar email desde template
export async function enviarEmailTemplate(
  templateName: string,
  to: string | string[],
  data: EmailTemplateData
): Promise<boolean> {
  const email = crearEmailDesdeTemplate(templateName, data);
  if (!email) {
    console.error("Template no encontrado:", templateName);
    return false;
  }

  return enviarEmail({
    to,
    subject: email.asunto,
    html: email.contenido,
  });
}

// Enviar email de bienvenida
export async function enviarEmailBienvenida(email: string, nombre: string): Promise<boolean> {
  return enviarEmailTemplate("bienvenida", email, { nombre });
}

// Enviar solicitud de documentos
export async function enviarSolicitudDocumentos(
  email: string,
  nombre: string,
  documentos: string[],
  leadId: string
): Promise<boolean> {
  const urlPortal = `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/portal-cliente?lead=${leadId}`;

  return enviarEmailTemplate("documentosPendientes", email, {
    nombre,
    documentos,
    urlPortal,
  });
}

// Enviar notificación de crédito aprobado
export async function enviarCreditoAprobado(
  email: string,
  nombre: string,
  monto: string,
  banco: string,
  plazo: string,
  cuota: string
): Promise<boolean> {
  return enviarEmailTemplate("creditoAprobado", email, {
    nombre,
    monto,
    banco,
    plazo,
    cuota,
  });
}

// Enviar recordatorio
export async function enviarRecordatorio(
  email: string,
  nombre: string,
  asunto: string,
  mensaje: string,
  fecha?: string
): Promise<boolean> {
  return enviarEmailTemplate("recordatorio", email, {
    nombre,
    asunto,
    mensaje,
    fecha: fecha || "",
  });
}
