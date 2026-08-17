import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { toSupabaseColumns } from "@/lib/supabase";
import { enviarEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/html-output";
import { readBoundedText, RequestPayloadError } from "@/lib/request-json";

const MAX_EMAIL_WEBHOOK_BYTES = 256 * 1024;

// POST /api/webhook/email — Recibe los correos que cPanel entrega por email
// piping, a través de wordpress/email-handler.php, y crea un lead.
//
// El correo del dominio vive en cPanel y no se puede mover, así que el correo
// entrante de Resend no aplica: exigiría apuntar los MX del dominio a Resend.
//
// Autenticación: cabecera X-Webhook-Secret contra EMAIL_WEBHOOK_SECRET.
// Obligatoria: el endpoint escribe en la base con la service role key y dispara
// correos, así que sin secreto configurado no acepta nada.

interface CorreoEntrante {
  from?: string;
  subject?: string;
  text?: string;
}

function remitenteAutorizado(request: NextRequest): boolean {
  const esperado = process.env.EMAIL_WEBHOOK_SECRET;
  if (!esperado) return false;

  const recibido = request.headers.get("x-webhook-secret");
  if (!recibido || recibido.length !== esperado.length) return false;

  // Comparación en tiempo constante sin traer crypto: acumula las diferencias
  // en vez de cortar en el primer byte distinto.
  let diff = 0;
  for (let i = 0; i < esperado.length; i++) {
    diff |= esperado.charCodeAt(i) ^ recibido.charCodeAt(i);
  }
  return diff === 0;
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
  // El secreto se comprueba antes de leer el cuerpo: quien no lo trae no llega
  // a gastar ni el flujo de lectura.
  if (!remitenteAutorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let rawBody: string;
  try {
    rawBody = await readBoundedText(request, MAX_EMAIL_WEBHOOK_BYTES);
  } catch (error) {
    if (error instanceof RequestPayloadError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  try {
    // El handler de cPanel manda JSON con el correo ya desarmado. Es el único
    // productor, así que no se aceptan otros formatos: las ramas de multipart y
    // urlencoded que hubo antes eran para proveedores que nunca se usaron, y la
    // de multipart ni siquiera funcionaba porque leía el cuerpo dos veces.
    let correo: CorreoEntrante;
    try {
      correo = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Cuerpo no es JSON válido" }, { status: 400 });
    }

    const from = correo.from || "";
    const subject = correo.subject || "";
    const body = correo.text || "";

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
    const supabaseAdmin = getSupabaseAdmin();

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
      const safeNombre = escapeHtml(nombre);
      const safeTipoConsulta = escapeHtml(tipoConsulta);
      const safeSubject = escapeHtml(subject);
      await enviarEmail({
        to: email,
        subject: "¡Hemos recibido tu consulta! - TuHipotecaFacil.cl",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1E40AF, #2563EB); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 22px;">🏠 TuHipotecaFacil.cl</h1>
              <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">¡Hola ${safeNombre}!</p>
            </div>
            <div style="background: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                Hemos recibido tu consulta sobre <strong>${safeTipoConsulta}</strong> y ya estamos trabajando en ella.
              </p>
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                Nuestro equipo se pondrá en contacto contigo en las próximas <strong>24 horas hábiles</strong>.
              </p>
              <div style="background: white; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="font-size: 12px; color: #64748b; margin: 0;"><strong>Resumen de tu consulta:</strong></p>
                <p style="font-size: 13px; color: #0f172a; margin: 5px 0 0;">Asunto: <strong>${safeSubject}</strong></p>
                <p style="font-size: 13px; color: #0f172a; margin: 5px 0 0;">Tipo: <strong>${safeTipoConsulta}</strong></p>
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
    usage: "POST application/json con { from, subject, text } y X-Webhook-Secret",
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
