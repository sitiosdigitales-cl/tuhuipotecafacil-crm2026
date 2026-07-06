import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "";
const fromEmail = process.env.FROM_EMAIL || "CRM <notificaciones@tuhipotecafacil.cl>";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient && resendApiKey) {
    resendClient = new Resend(resendApiKey);
  }
  return resendClient!;
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

// Templates de email predefinidos
export const EMAIL_TEMPLATES: Record<string, (data: Record<string, string>) => EmailTemplate> = {
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
};

// Enviar email
export async function enviarEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Si no hay API key configurada, simular envío
    if (!resendApiKey) {
      console.log("📧 [SIMULADO] Email enviado:", {
        to: options.to,
        subject: options.subject,
      });
      return true;
    }

    const client = getResendClient();
    if (!client) return false;

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
  data: Record<string, string>
): Promise<boolean> {
  const template = EMAIL_TEMPLATES[templateName];
  if (!template) {
    console.error("Template no encontrado:", templateName);
    return false;
  }

  const { asunto, contenido } = template(data);

  return enviarEmail({
    to,
    subject: asunto,
    html: contenido,
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
  const listaDocs = documentos.map((doc) => `<li>${doc}</li>`).join("");
  const urlPortal = `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/portal-cliente?lead=${leadId}`;

  return enviarEmailTemplate("documentosPendientes", email, {
    nombre,
    documentos: `<ul style="color: #475569; margin: 0; padding-left: 20px;">${listaDocs}</ul>`,
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
