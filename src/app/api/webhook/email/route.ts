import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, toSupabaseColumns } from "@/lib/supabase";
import { enviarEmail } from "@/lib/email";
import { Resend } from "resend";

// POST /api/webhook/email — Recibe emails reenviados desde el correo corporativo
// Fuente: correo entrante de Resend (evento email.received)
// Crea un lead automáticamente en el CRM
//
// Autenticación: firma Svix de Resend (svix-id, svix-timestamp, svix-signature)
// verificada contra RESEND_WEBHOOK_SECRET. Obligatoria: el endpoint escribe en
// la base con la service role key y dispara correos.

interface EventoResend {
  type: string;
  data?: { email_id?: string };
}

async function verificarEventoResend(
  request: NextRequest,
  rawBody: string
): Promise<EventoResend | null> {
  const secreto = process.env.RESEND_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  if (!secreto || !apiKey) return null;

  // Resend entrega vía Svix. El SDK recibe las tres cabeceras ya desarmadas.
  const headers = {
    id: request.headers.get("svix-id") ?? "",
    timestamp: request.headers.get("svix-timestamp") ?? "",
    signature: request.headers.get("svix-signature") ?? "",
  };
  if (!headers.id || !headers.signature) return null;

  try {
    // verify() lanza si la firma no cuadra o si el evento está fuera de la
    // ventana de tiempo, que es lo que impide reenviar uno capturado.
    const resend = new Resend(apiKey);
    return (await resend.webhooks.verify({
      payload: rawBody,
      headers,
      webhookSecret: secreto,
    })) as EventoResend;
  } catch {
    return null;
  }
}

interface CorreoRecibido {
  from?: string;
  subject?: string;
  text?: string;
}

async function obtenerCorreoRecibido(emailId: string): Promise<CorreoRecibido | null> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.receiving.get(emailId);
    if (error || !data) {
      console.error("No se pudo recuperar el correo recibido:", error);
      return null;
    }
    return data as CorreoRecibido;
  } catch (e) {
    console.error("Error consultando el correo recibido:", e);
    return null;
  }
}

// Extraer nombre del campo "From" del email
function extraerNombreDeFrom(from: string): { nombre: string; apellido: string; email: string } {
  // Formos posibles:
  // "Juan Pérez <juan@correo.cl>"
  // "juan@correo.cl"
  // "juan.perez@correo.cl"
  const emailMatch = from.match(/<([^>]+)>/) || [null, from];
  const email = (emailMatch[1] || from).trim().toLowerCase();

  // Intentar extraer nombre del display name
  const displayNameMatch = from.match(/^"?([^"<]+)"?\s*</);
  let nombre = "";
  let apellido = "";

  if (displayNameMatch) {
    const parts = displayNameMatch[1].trim().split(/\s+/);
    nombre = parts[0] || "";
    apellido = parts.slice(1).join(" ") || "";
  } else {
    // Usar la parte antes del @ como nombre
    const localPart = email.split("@")[0];
    const parts = localPart.replace(/[._-]/g, " ").split(/\s+/);
    nombre = parts[0] || "";
    apellido = parts.slice(1).join(" ") || "";
  }

  return { nombre, apellido, email };
}

// Extraer teléfono del contenido del email (formato chileno)
function extraerTelefono(texto: string): string | null {
  const patterns = [
    /(?:\+?56)?\s*9\s*\d{4}\s*\d{4}/,                    // +56 9 1234 5678
    /(?:\+?56)?\s*(?:\(\s*\d\s*\)|\d)\s*\d{3}\s*\d{4}/,  // +56 2 1234 5678
    /tel(?:[ée]fono|fono)?\s*:?\s*([+\d\s()-]{8,})/i,     // Teléfono: +56 9 1234 5678
    /celular\s*:?\s*([+\d\s()-]{8,})/i,                     // Celular: +56 9 1234 5678
    /contacto\s*:?\s*([+\d\s()-]{8,})/i,                    // Contacto: +56 9 1234 5678
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match) {
      const phone = (match[1] || match[0]).replace(/[^0-9+]/g, "");
      if (phone.length >= 8) return phone;
    }
  }
  return null;
}

// Extraer contexto del email (tipo de consulta, monto, etc.)
function extraerContexto(subject: string, body: string): { tipoConsulta: string; monto: number | null; comentarios: string } {
  const text = `${subject} ${body}`.toLowerCase();

  let tipoConsulta = "Consulta general";
  if (text.includes("hipotecario") || text.includes("hipotecaria") || text.includes("casa") || text.includes("departamento") || text.includes("vivienda")) {
    tipoConsulta = "Crédito Hipotecario";
  } else if (text.includes("consumo") || text.includes("personal")) {
    tipoConsulta = "Crédito de Consumo";
  } else if (text.includes("empresa") || text.includes("negocio") || text.includes("pyme")) {
    tipoConsulta = "Capital para Empresas";
  } else if (text.includes("refinanciamiento")) {
    tipoConsulta = "Refinanciamiento";
  }

  // Buscar monto mencionado
  let monto: number | null = null;
  const montoMatch = body.match(/\$[\s]*[\d.]+(?:\s*(?:UF|uf|millones|MM))?/);
  if (montoMatch) {
    const numStr = montoMatch[0].replace(/[^0-9.]/g, "");
    const num = parseFloat(numStr);
    if (num > 0) monto = num;
  }

  return { tipoConsulta, monto, comentarios: body.substring(0, 500) };
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const evento = await verificarEventoResend(request, rawBody);
  if (!evento) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Resend manda varios tipos de evento al mismo endpoint. Los que no son
  // correo entrante se aceptan y se ignoran: responder error haría que Resend
  // los reintente en vano.
  if (evento.type !== "email.received") {
    return NextResponse.json({ received: true, ignorado: evento.type });
  }

  try {
    const emailId = evento.data?.email_id;
    if (!emailId) {
      return NextResponse.json({ error: "Evento sin email_id" }, { status: 400 });
    }

    // El webhook trae solo metadatos: ni cuerpo, ni cabeceras, ni adjuntos.
    // El contenido se pide aparte, y de ahí sale el teléfono y el contexto.
    const completo = await obtenerCorreoRecibido(emailId);
    if (!completo) {
      return NextResponse.json(
        { error: "No se pudo recuperar el contenido del correo" },
        { status: 502 }
      );
    }

    const from = completo.from || "";
    const subject = completo.subject || "";
    const body = completo.text || "";

    if (!from) {
      return NextResponse.json({ error: "Correo sin remitente" }, { status: 400 });
    }

    // Extraer datos del email
    const { nombre, apellido, email } = extraerNombreDeFrom(from);
    const telefono = extraerTelefono(body);
    const { tipoConsulta, monto, comentarios } = extraerContexto(subject, body);

    if (!nombre && !apellido) {
      return NextResponse.json({ error: "No se pudo extraer nombre del remitente" }, { status: 400 });
    }

    const leadId = crypto.randomUUID();

    // Crear lead en Supabase (usar admin para bypass RLS)
    const { error } = await supabaseAdmin
      .from("leads")
      .insert(toSupabaseColumns({
        id: leadId,
        nombre: nombre || "Sin nombre",
        apellido: apellido || "",
        email: email || null,
        telefono: telefono,
        rut: `email-${leadId.substring(0, 8)}`,
        origen: "email_corporativo",
        etapa: "NUEVO_LEAD",
        prioridad: "MEDIA",
        tipoCredito: tipoConsulta,
        montoSolicitado: monto,
        notas: `Email recibido: "${subject}"\n\n${comentarios}`,
        situacionLaboral: "DEPENDIENTE",
        enDicom: false,
        diasEnEtapa: 0,
        creadoEn: new Date().toISOString(),
      }))
      .select()
      .single();

    if (error) {
      console.error("Error creando lead desde email:", error);
      return NextResponse.json({ error: "Error al guardar lead" }, { status: 500 });
    }

    // Crear notificación en el CRM (usar admin para bypass RLS)
    try {
      await supabaseAdmin.from("notificaciones").insert({
        id: crypto.randomUUID(),
        tipo: "lead",
        titulo: "Lead desde email corporativo",
        descripcion: `${nombre} ${apellido} envió un email: "${subject}"`,
        leida: false,
        leadid: leadId,
        accionurl: `/leads/${leadId}`,
        creadoen: new Date().toISOString(),
      });
    } catch {
      // Notificación no es crítica
    }

    // Enviar email de confirmación al remitente
    try {
      await enviarEmail({
        to: email,
        subject: "¡Hemos recibido tu consulta! - TuHipotecaFacil.cl",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1E40AF, #2563EB); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 22px;">🏠 TuHipotecaFacil.cl</h1>
              <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">¡Hola ${nombre}!</p>
            </div>
            <div style="background: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                Hemos recibido tu consulta sobre <strong>${tipoConsulta}</strong> y ya estamos trabajando en ella.
              </p>
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                Nuestro equipo se pondrá en contacto contigo en las próximas <strong>24 horas hábiles</strong>.
              </p>
              <div style="background: white; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="font-size: 12px; color: #64748b; margin: 0;"><strong>Resumen de tu consulta:</strong></p>
                <p style="font-size: 13px; color: #0f172a; margin: 5px 0 0;">Asunto: <strong>${subject}</strong></p>
                <p style="font-size: 13px; color: #0f172a; margin: 5px 0 0;">Tipo: <strong>${tipoConsulta}</strong></p>
              </div>
              <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
                Si tienes alguna consulta, escríbenos por WhatsApp al <strong>+56 9 6684 2168</strong>.
              </p>
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://wa.me/56966842168" style="display: inline-block; background: #25D366; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">💬 Escribir por WhatsApp</a>
              </div>
            </div>
          </div>
        `,
      });
    } catch {
      // Email de confirmación no es crítico
    }

    return NextResponse.json({
      success: true,
      message: "Lead creado desde email",
      leadId,
      nombre: `${nombre} ${apellido}`,
      email,
      tipoConsulta,
    });

  } catch (err) {
    console.error("Error en webhook email:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Email webhook endpoint activo",
    usage: "POST con: { from, subject, text, html } o formato SendGrid/Mailgun",
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
