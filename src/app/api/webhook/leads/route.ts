import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enviarEmail } from "@/lib/email";
import { despacharNotificacion } from "@/lib/dispatcher-notificaciones";

// Service role key para bypass de RLS (solo server-side)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// POST /api/webhook/leads — Endpoint unificado para formularios externos (Elementor, WordPress, etc.)
// Autenticación: ?secret=<ELEMENTOR_WEBHOOK_SECRET> (opcional si la env var no está configurada)
// Soporta: JSON, form-urlencoded, y el formato anidado de Elementor ({fields: {key: {value, raw_value}}})
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.ELEMENTOR_WEBHOOK_SECRET;

  // LOG: Request recibido
  console.log("Webhook leads - Secret:", secret ? "provided" : "none", "Expected:", expectedSecret ? "configured" : "not configured");

  if (expectedSecret && secret !== expectedSecret) {
    console.log("Webhook leads - Secret mismatch");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const rawBody = await request.text();
    const contentType = request.headers.get("content-type") || "";

    // LOG: Body received
    console.log("Webhook leads - Content-Type:", contentType, "Body length:", rawBody.length);
    console.log("Webhook leads - Body preview:", rawBody.substring(0, 500));

    let body: Record<string, any> = {};

    if (contentType.includes("application/json")) {
      body = JSON.parse(rawBody);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(rawBody);
      params.forEach((value, key) => { body[key] = value; });
    } else {
      try { body = JSON.parse(rawBody); } catch {
        const params = new URLSearchParams(rawBody);
        params.forEach((value, key) => { body[key] = value; });
      }
    }

    // Normalizar formato Elementor: {fields: {key: {value}}} → {key: value}
    const rawFields = body.fields ?? body;
    const normalized: Record<string, any> = {};

    Object.entries(rawFields).forEach(([key, val]: [string, any]) => {
      normalized[key] = typeof val === "object" && val?.value !== undefined ? val.value : val;
    });

    // Mapear campos del formulario al esquema de leads
    // Soporta etiquetas de Elementor (en español) y nombres genéricos (inglés/español)
    const nombre = normalized["Nombre"] || normalized["nombre"] || normalized["first_name"] || normalized["name"] || "";
    const apellido = normalized["Apellido"] || normalized["apellido"] || normalized["last_name"] || "";
    const rut = normalized["Rut"] || normalized["rut"] || normalized["RUT"] || "";
    const email = normalized["Correo Electrónico"] || normalized["email"] || normalized["correo"] || "";
    const telefono = normalized["Número de Teléfono"] || normalized["telefono"] || normalized["teléfono"] || normalized["phone"] || normalized["tel"] || null;
    const montoCredito = normalized["monto_credito"] || normalized["montoCredito"] || normalized["monto"] || normalized["monto_solicitado"] || null;
    const tipoCredito = normalized["¿Qué tipo de crédito buscas?"] || normalized["tipo_credito"] || normalized["tipoCredito"] || null;
    const situacionLaboral = normalized["¿Cuál es tu situación laboral?"] || normalized["situacion_laboral"] || null;
    const comentarios = normalized["Comentarios adicionales"] || normalized["mensaje"] || normalized["message"] || normalized["consulta"] || null;
    const rentaMensual = normalized["¿Cuál es tu renta mensual aproximada?"] || normalized["renta_mensual"] || normalized["rentaMensual"] || null;
    const complementarRenta = normalized["¿Deseas complementar renta?"] || normalized["complementar_renta"] || null;
    const enDicom = normalized["¿Estás actualmente en DICOM?"] || normalized["en_dicom"] || null;
    const dicomDetalle = normalized["Si estás en DICOM, ¿corresponde?"] || normalized["dicom_detalle"] || null;

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
    despacharNotificacion({
      evento: "lead_nuevo",
      leadId,
      titulo: "Nuevo lead desde sitio web",
      descripcion: `${nombre} ${apellido} completo el formulario`,
      accionUrl: `/leads/${leadId}`,
    }).catch(() => {});

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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Webhook endpoint activo" });
}
