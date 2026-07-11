import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    
    let body: Record<string, any> = {};
    try { body = JSON.parse(rawBody); } catch {
      const params = new URLSearchParams(rawBody);
      params.forEach((value, key) => { body[key] = value; });
    }

    const nombre = body.Nombre || body.nombre || body.first_name || "";
    const apellido = body.Apellido || body.apellido || body.last_name || "";
    
    if (!nombre && !apellido) {
      return NextResponse.json({ success: false, error: "Nombre y apellido requeridos" }, { status: 400 });
    }

    const leadId = crypto.randomUUID();

    // Usar SQL raw para evitar problemas con el schema cache
    const { data, error } = await supabase.rpc('insert_lead_webhook', {
      p_id: leadId,
      p_nombre: nombre,
      p_apellido: apellido,
      p_rut: body.Rut || body.rut || "",
      p_email: body["Correo Electrónico"] || body.email || null,
      p_telefono: body["Número de Teléfono"] || body.telefono || null,
    }).single();

    if (error) {
      // Si la función RPC no existe, usar insert directo
      const { data: insertData, error: insertError } = await supabase
        .from("leads")
        .insert({
          id: leadId,
          nombre: nombre,
          apellido: apellido,
          rut: body.Rut || body.rut || "",
          email: body["Correo Electrónico"] || body.email || null,
          telefono: body["Número de Teléfono"] || body.telefono || null,
          origen: "WEB",
          etapa: "NUEVO_LEAD",
          prioridad: "MEDIA",
          situacionlaboral: "DEPENDIENTE",
          endicom: false,
          diasenetapa: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error Supabase:", insertError);
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: insertData }, { status: 201 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
    
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
