import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role key para bypass de RLS (solo en este endpoint server-side)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(req: NextRequest) {
  // 1. Validar secret via query param
  const secret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.ELEMENTOR_WEBHOOK_SECRET;
  
  if (expectedSecret && secret !== expectedSecret) {
    console.error("Webhook: Secret inválido");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const rawBody = await req.text();
    const contentType = req.headers.get("content-type") || "";
    
    let body: Record<string, any> = {};
    
    // Parsear según el content-type
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

    // Normalizar campos de Elementor
    const rawFields = body.fields ?? body;
    const normalized: Record<string, any> = {};
    
    Object.entries(rawFields).forEach(([key, val]: [string, any]) => {
      if (typeof val === "object" && val?.value !== undefined) {
        normalized[key] = val.value;
      } else {
        normalized[key] = val;
      }
    });

    // Mapear campos del formulario al esquema de leads
    const nombre = normalized["Nombre"] || normalized["nombre"] || normalized["name"] || "";
    const apellido = normalized["Apellido"] || normalized["apellido"] || normalized["last_name"] || "";
    const rut = normalized["Rut"] || normalized["rut"] || "";
    const email = normalized["Correo Electrónico"] || normalized["email"] || normalized["correo"] || "";
    const telefono = normalized["Número de Teléfono"] || normalized["telefono"] || normalized["teléfono"] || null;
    const montoCredito = normalized["monto_credito"] || normalized["montoCredito"] || null;
    const mensaje = normalized["mensaje"] || normalized["comentarios"] || null;

    if (!nombre && !apellido) {
      console.error("Webhook: nombre y apellido requeridos");
      return NextResponse.json({ error: "Datos inválidos: nombre y apellido requeridos" }, { status: 400 });
    }

    // Insertar en Supabase
    const { error } = await supabaseAdmin.from("leads").insert({
      nombre,
      apellido,
      rut,
      email,
      telefono,
      montoCredito: montoCredito ? parseFloat(montoCredito) : null,
      notas: mensaje,
      origen: "elementor_wordpress",
      etapa: "NUEVO_LEAD",
      prioridad: "MEDIA",
      situacionLaboral: "DEPENDIENTE",
      enDicom: false,
      diasEnEtapa: 0,
    });

    if (error) {
      console.error("Error insertando lead:", error);
      return NextResponse.json({ error: "Error al guardar lead" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Lead creado correctamente" }, { status: 200 });
    
  } catch (err) {
    console.error("Error procesando webhook:", err);
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
  return NextResponse.json({ status: "ok", message: "Endpoint activo" });
}
