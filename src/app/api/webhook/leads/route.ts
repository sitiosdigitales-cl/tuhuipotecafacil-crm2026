import { createHash, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { enviarEmail } from "@/lib/email";
import { despacharNotificacion } from "@/lib/dispatcher-notificaciones";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstText(fields: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = fields[key];
    if (typeof value === "string" && value) return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

function secretMatches(provided: string, expected: string): boolean {
  const providedDigest = createHash("sha256").update(provided).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedDigest, expectedDigest);
}

// POST /api/webhook/leads — Endpoint unificado para formularios externos (Elementor, WordPress, etc.)
// Autenticación: cabecera X-Webhook-Secret, enviada solo desde el servidor WordPress.
// Soporta: JSON, form-urlencoded, y el formato anidado de Elementor ({fields: {key: {value, raw_value}}})
export async function POST(request: NextRequest) {
  const expectedSecret = process.env.ELEMENTOR_WEBHOOK_SECRET;
  if (!expectedSecret || expectedSecret.length < 32) {
    console.error("ELEMENTOR_WEBHOOK_SECRET no está configurado de forma segura");
    return NextResponse.json(
      { error: "Webhook no disponible" },
      { status: 503 }
    );
  }

  const secret = request.headers.get("x-webhook-secret");

  if (!secret || !secretMatches(secret, expectedSecret)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const rawBody = await request.text();
    const contentType = request.headers.get("content-type") || "";

    // LOG: Body received
    // Solo el tamaño. El cuerpo trae RUT, renta y teléfono del cliente, y los
    // logs de Vercel los guarda y los ve cualquiera del equipo con acceso al
    // panel.
    console.log("Webhook leads - Content-Type:", contentType, "Body length:", rawBody.length);

    let body: Record<string, unknown> = {};

    if (contentType.includes("application/json")) {
      const parsed: unknown = JSON.parse(rawBody);
      body = isRecord(parsed) ? parsed : {};
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(rawBody);
      params.forEach((value, key) => { body[key] = value; });
    } else {
      try {
        const parsed: unknown = JSON.parse(rawBody);
        body = isRecord(parsed) ? parsed : {};
      } catch {
        const params = new URLSearchParams(rawBody);
        params.forEach((value, key) => { body[key] = value; });
      }
    }

    // Normalizar formato Elementor: {fields: {key: {value}}} → {key: value}
    const rawFields = isRecord(body.fields) ? body.fields : body;
    const normalized: Record<string, unknown> = {};

    Object.entries(rawFields).forEach(([key, value]) => {
      normalized[key] = isRecord(value) && value.value !== undefined ? value.value : value;
    });

    // Mapear campos del formulario al esquema de leads
    // Soporta etiquetas de Elementor (en español) y nombres genéricos (inglés/español)
    const nombre = firstText(normalized, ["Nombre", "nombre", "first_name", "name"]);
    const apellido = firstText(normalized, ["Apellido", "apellido", "last_name"]);
    const rut = firstText(normalized, ["Rut", "rut", "RUT"]);
    const email = firstText(normalized, ["Correo Electrónico", "email", "correo"]);
    const telefono = firstText(normalized, ["Número de Teléfono", "telefono", "teléfono", "phone", "tel"]) || null;
    const montoCredito = firstText(normalized, ["monto_credito", "montoCredito", "monto", "monto_solicitado"]) || null;
    const tipoCredito = firstText(normalized, ["¿Qué tipo de crédito buscas?", "tipo_credito", "tipoCredito"]) || null;
    const situacionLaboral = firstText(normalized, ["¿Cuál es tu situación laboral?", "situacion_laboral"]) || null;
    const comentarios = firstText(normalized, ["Comentarios adicionales", "mensaje", "message", "consulta"]) || null;
    const rentaMensual = firstText(normalized, ["¿Cuál es tu renta mensual aproximada?", "renta_mensual", "rentaMensual"]) || null;
    const complementarRenta = firstText(normalized, ["¿Deseas complementar renta?", "complementar_renta"]) || null;
    const enDicom = firstText(normalized, ["¿Estás actualmente en DICOM?", "en_dicom"]) || null;
    const dicomDetalle = firstText(normalized, ["Si estás en DICOM, ¿corresponde?", "dicom_detalle"]) || null;

    if (!nombre && !apellido) {
      return NextResponse.json({ error: "Nombre y apellido son requeridos" }, { status: 400 });
    }

    // Determinar situación laboral
    let sitLaboral = "DEPENDIENTE";
    if (situacionLaboral && situacionLaboral.toLowerCase().includes("independiente")) {
      sitLaboral = "INDEPENDIENTE";
    }

    // Parsear monto
    let monto = null;
    if (montoCredito) {
      const parsed = parseFloat(String(montoCredito).replace(/\./g, ""));
      if (!isNaN(parsed) && parsed > 0) monto = parsed;
    }

    const leadId = crypto.randomUUID();
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("leads").insert({
      id: leadId,
      nombre,
      apellido,
      rut: rut || `web-${leadId.substring(0, 8)}`,
      email,
      telefono,
      montosolicitado: monto,
      origen: "SITIO WEB",
      etapa: "NUEVO_LEAD",
      prioridad: "MEDIA",
      situacionlaboral: sitLaboral,
      tipocredito: tipoCredito,
      rentamensual: rentaMensual,
      complementarrenta: complementarRenta === "Si" || complementarRenta === "si",
      endicom: enDicom === "Si" || enDicom === "si",
      dicomdetalle: dicomDetalle,
      notas: comentarios,
      diasenetapa: 0,
      creadoen: new Date().toISOString(),
    });

    if (error) {
      console.error("Error guardando lead:", error);
      return NextResponse.json({ error: "Error al guardar lead", details: error.message }, { status: 500 });
    }

    // Notificacion in-app via dispatcher
    try {
      await despacharNotificacion({
        evento: "lead_nuevo",
        leadId,
        titulo: "Nuevo lead desde sitio web",
        descripcion: `${nombre} ${apellido} completo el formulario`,
        accionUrl: `/leads/${leadId}`,
      });
      console.log("Notificacion dispatch OK para lead:", leadId);
    } catch (notifErr) {
      console.error("Error en dispatch notificacion:", notifErr);
    }

    // Enviar emails de notificación (no bloquear si falla)
    try {
      const asunto = `Nuevo Lead: ${nombre} ${apellido} - ${tipoCredito || "Sin tipo"}`;
      const htmlNotificacion = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1E40AF, #2563EB); color: white; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 18px;">🏠 Nuevo Lead - TuHipotecaFacil.cl</h1>
          </div>
          <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin: 0 0 15px;">${nombre} ${apellido}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #64748b;">Email:</td><td style="padding: 8px 0; color: #1e293b;">${email || "No informado"}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b;">Teléfono:</td><td style="padding: 8px 0; color: #1e293b;">${telefono || "No informado"}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b;">Rut:</td><td style="padding: 8px 0; color: #1e293b;">${rut || "No informado"}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b;">Tipo crédito:</td><td style="padding: 8px 0; color: #1e293b;">${tipoCredito || "No informado"}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b;">Situación laboral:</td><td style="padding: 8px 0; color: #1e293b;">${sitLaboral}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b;">Renta:</td><td style="padding: 8px 0; color: #1e293b;">${normalized["¿Cuál es tu renta mensual aproximada?"] || "No informado"}</td></tr>
              ${comentarios ? `<tr><td style="padding: 8px 0; color: #64748b;">Comentarios:</td><td style="padding: 8px 0; color: #1e293b;">${comentarios}</td></tr>` : ''}
            </table>
            <div style="margin-top: 20px; text-align: center;">
              <a href="https://tuhuipotecafacil-crm2026-sitiosdigitales.vercel.app/leads" style="background: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver en CRM</a>
            </div>
          </div>
        </div>
      `;

      // Enviar a contacto@tuhipotecafacil.cl
      await enviarEmail({
        to: ["contacto@tuhipotecafacil.cl", "tuhipotecafacil.cl@gmail.com"],
        subject: asunto,
        html: htmlNotificacion,
      });
    } catch (emailErr) {
      console.error("Error enviando email notificación:", emailErr);
    }

    return NextResponse.json({ success: true, message: "Lead creado correctamente" }, { status: 200 });

  } catch (err) {
    console.error("Error en webhook leads:", err);
    return NextResponse.json({ error: "Error interno", details: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Webhook endpoint activo" });
}
