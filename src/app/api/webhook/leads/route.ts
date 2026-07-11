import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const contentType = request.headers.get("content-type") || "";
    
    let body: Record<string, any> = {};
    
    // Parsear según el content-type
    if (contentType.includes("application/json")) {
      try { body = JSON.parse(rawBody); } catch { body = {}; }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(rawBody);
      params.forEach((value, key) => { body[key] = value; });
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      formData.forEach((value, key) => { body[key] = value.toString(); });
    } else {
      // Intentar JSON primero, luego form-urlencoded
      try { body = JSON.parse(rawBody); } catch {
        const params = new URLSearchParams(rawBody);
        params.forEach((value, key) => { body[key] = value; });
      }
    }

    console.log("Webhook - Content-Type:", contentType);
    console.log("Webhook - Body:", JSON.stringify(body, null, 2));

    // Buscar nombre y apellido con diferentes nombres posibles
    const nombre = body.Nombre || body.nombre || body.first_name || body["nombre"] || "";
    const apellido = body.Apellido || body.apellido || body.last_name || body["apellido"] || "";
    
    if (!nombre && !apellido) {
      console.log("Webhook - Error: nombre y apellido requeridos");
      return NextResponse.json({ 
        success: false, 
        error: "Nombre y apellido requeridos",
        received: body 
      }, { status: 400 });
    }

    const leadId = crypto.randomUUID();
    const rut = body.Rut || body.rut || body["rut"] || "";
    const email = body["Correo Electrónico"] || body.email || body["email"] || null;
    const telefono = body["Número de Teléfono"] || body.telefono || body["telefono"] || null;

    const { data, error } = await supabase
      .from("leads")
      .insert({
        id: leadId,
        nombre: nombre,
        apellido: apellido,
        rut: rut,
        email: email,
        telefono: telefono,
        origen: "WEB",
        etapa: "NUEVO_LEAD",
        prioridad: "MEDIA",
        situacionlaboral: "DEPENDIENTE",
        endicom: false,
        diasenetapa: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Webhook - Error Supabase:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log("Webhook - Lead creado:", data.id);
    return NextResponse.json({ success: true, data }, { status: 201 });
    
  } catch (error) {
    console.error("Webhook - Error:", error);
    return NextResponse.json({ success: false, error: "Error al procesar" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
