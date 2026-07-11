import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";

// Endpoint para recibir leads desde webhooks (Elementor, WordPress, etc.)
// NO requiere autenticación - es público para formularios externos

export async function POST(request: NextRequest) {
  try {
    // Intentar parsear JSON
    let body: Record<string, any> = {};
    
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      // Elementor a veces envía datos como form-urlencoded
      const text = await request.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        body[key] = value;
      });
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        body[key] = value.toString();
      });
    } else {
      // Intentar parsear como JSON como fallback
      try {
        body = await request.json();
      } catch {
        const text = await request.text();
        const params = new URLSearchParams(text);
        params.forEach((value, key) => {
          body[key] = value;
        });
      }
    }

    console.log("Webhook recibido:", JSON.stringify(body, null, 2));

    // Extraer campos - Elementor puede enviarlos con prefijos o en formato anidado
    const nombre = body.nombre || body.first_name || body.Name || body["nombre"] || "";
    const apellido = body.apellido || body.last_name || body["apellido"] || "";
    
    if (!nombre && !apellido) {
      console.error("Webhook: nombre y apellido requeridos", body);
      return NextResponse.json({ 
        success: false, 
        error: "Nombre y apellido son requeridos",
        received: body 
      }, { status: 400 });
    }

    const leadId = crypto.randomUUID();

    const { data, error } = await supabase
      .from("leads")
      .insert(toSupabaseColumns({
        id: leadId,
        nombre: nombre || "Sin nombre",
        apellido: apellido || "Sin apellido",
        rut: body.rut || body.RUT || "",
        email: body.email || body.correo || null,
        telefono: body.telefono || body.phone || body.tel || null,
        origen: "WEB",
        etapa: "NUEVO_LEAD",
        prioridad: "MEDIA",
        nombreEjecutivo: null,
        banco: body.banco || null,
        tipoCredito: body.tipoCredito || body.tipo_credito || null,
        montoSolicitado: body.montoSolicitado ? parseFloat(body.montoSolicitado) : null,
        valorPropiedad: body.valorPropiedad ? parseFloat(body.valorPropiedad) : null,
        pieDisponible: body.pieDisponible ? parseFloat(body.pieDisponible) : null,
        notas: body.comentarios || body.mensaje || body.notas || null,
        situacionLaboral: body.situacionLaboral || "DEPENDIENTE",
        enDicom: body.enDicom === "true" || body.enDicom === true,
        diasEnEtapa: 0,
      }))
      .select()
      .single();

    if (error) {
      console.error("Error al crear lead:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Crear notificación
    try {
      await supabase.from("notificaciones").insert({
        id: crypto.randomUUID(),
        tipo: "lead",
        titulo: "Nuevo lead desde formulario web",
        descripcion: `${nombre} ${apellido} completó el formulario`,
        leida: false,
        leadid: leadId,
        accionurl: `/leads/${leadId}`,
        creadoen: new Date().toISOString(),
      });
    } catch {
      // Notificación es opcional
    }

    console.log("Lead creado exitosamente:", leadId);
    return NextResponse.json({ 
      success: true, 
      data,
      message: "Lead creado correctamente" 
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error en webhook:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Error al procesar el webhook" 
    }, { status: 500 });
  }
}

// Endpoint GET para verificar que el webhook funciona
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Webhook endpoint activo",
    timestamp: new Date().toISOString()
  });
}
