import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";

// Endpoint público para recibir leads desde formularios web

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, any> = {};
    
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => { body[key] = value; });
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      formData.forEach((value, key) => { body[key] = value.toString(); });
    } else {
      try { body = await request.json(); } catch {
        const text = await request.text();
        const params = new URLSearchParams(text);
        params.forEach((value, key) => { body[key] = value; });
      }
    }

    console.log("Webhook recibido:", JSON.stringify(body));

    const nombre = body.nombre || body.first_name || body.Name || "";
    const apellido = body.apellido || body.last_name || "";
    
    if (!nombre && !apellido) {
      return NextResponse.json({ success: false, error: "Nombre y apellido requeridos" }, { status: 400 });
    }

    const leadId = crypto.randomUUID();

    // Usar toSupabaseColumns como en la ruta /api/leads
    const { data, error } = await supabase
      .from("leads")
      .insert(toSupabaseColumns({
        id: leadId,
        nombre: nombre || "Sin nombre",
        apellido: apellido || "Sin apellido",
        rut: body.rut || body.Rut || "",
        email: body.email || body["Correo Electrónico"] || null,
        telefono: body.telefono || body["Número de Teléfono"] || null,
        origen: "WEB",
        etapa: "NUEVO_LEAD",
        prioridad: "MEDIA",
        situacionLaboral: "DEPENDIENTE",
        enDicom: false,
        diasEnEtapa: 0,
      }))
      .select()
      .single();

    if (error) {
      console.error("Error Supabase:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log("Lead creado:", data);
    return NextResponse.json({ success: true, data, message: "Lead creado" }, { status: 201 });
    
  } catch (error) {
    console.error("Error webhook:", error);
    return NextResponse.json({ success: false, error: "Error al procesar" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Webhook activo" });
}
