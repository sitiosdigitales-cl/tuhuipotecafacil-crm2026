import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const rawBody = await request.text();
    const contentType = request.headers.get("content-type") || "";

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

    const { error } = await supabaseAdmin.from("leads").insert({
      id: crypto.randomUUID(),
      nombre,
      apellido,
      rut,
      email,
      telefono,
      monto_solicitado: monto,
      origen: "elementor_wordpress",
      etapa: "NUEVO_LEAD",
      prioridad: "MEDIA",
      situacionlaboral: sitLaboral,
      tipocredito: tipoCredito,
      notas: comentarios,
      endicom: false,
      diasenetapa: 0,
      creado_en: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: "Error al guardar lead" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Lead creado correctamente" }, { status: 200 });

  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
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
