import { NextRequest, NextResponse } from "next/server";


// Webhook para recibir formularios de WordPress/Elementor
// Configurar en Elementor: Webhook URL â†’ https://tu-dominio.com/api/webhook/wordpress

export async function POST(request: NextRequest) {
  try {
    // Elementor envÃ­a los datos en formato form-urlencoded o JSON
    const contentType = request.headers.get("content-type") || "";
    let data: Record<string, any> = {};

    if (contentType.includes("application/json")) {
      data = await request.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        data[key] = value;
      });
    } else {
      // Intentar leer como JSON por defecto
      data = await request.json();
    }

    console.log("Webhook WordPress recibido:", data);

    // Mapear campos de Elementor a campos del CRM
    // Los nombres de campo pueden variar segÃºn la configuraciÃ³n de Elementor
    const leadData = {
      id: `lead-wp-${Date.now()}`,
      // Campos estÃ¡ndar de Elementor Form
      nombre: data.nombre || data.first_name || "",
      apellido: data.apellido || data.last_name || "",
      email: data.email || data.correo || "",
      telefono: data.telefono || data.phone || data.tel || "",
      rut: data.rut || data.RUT || "",
      mensaje: data.mensaje || data.message || data.consulta || "",
      // Campos personalizados
      origen: "WEB",
      etapa: "NUEVO_LEAD",
      prioridad: "MEDIA",
      montoSolicitado: data.monto || data.monto_solicitado ? parseFloat((data.monto || data.monto_solicitado || "0").replace(/\./g, "")) : undefined,
      tipoCredito: data.tipo_credito || data.tipoCredito || undefined,
      banco: data.banco || undefined,
      situacionLaboral: data.situacion_laboral === "independiente" ? "INDEPENDIENTE" : "DEPENDIENTE",
      enDicom: false,
      creadoEn: new Date().toISOString(),
      fuente: "wordpress_elementor",
      formularioId: data.form_id || data.formulario_id || undefined,
      ip: request.headers.get("x-forwarded-for") || "unknown",
    };

    // Validar que tenga al menos nombre y apellido
    if (!leadData.nombre || !leadData.apellido) {
      console.warn("Webhook sin nombre/apellido vÃ¡lido:", data);
      return NextResponse.json(
        { success: false, error: "Nombre y apellido son requeridos" },
        { status: 400 }
      );
    }

    // Enviar notificaciÃ³n al CRM (simulado)
    // En producciÃ³n, aquÃ­ se guardarÃ­a en la base de datos
    await notificarNuevoLead(leadData);

    return NextResponse.json({
      success: true,
      message: "Lead recibido correctamente",
      leadId: leadData.id,
    });

  } catch (error) {
    console.error("Error en webhook WordPress:", error);
    return NextResponse.json(
      { success: false, error: "Error procesando webhook" },
      { status: 500 }
    );
  }
}

// FunciÃ³n para notificar al CRM sobre nuevo lead
async function notificarNuevoLead(leadData: any) {
  // En un sistema real, esto guardarÃ­a en la base de datos
  // y enviarÃ­a una notificaciÃ³n push al CRM
  console.log("Nuevo lead desde WordPress:", {
    nombre: `${leadData.nombre} ${leadData.apellido}`,
    email: leadData.email,
    telefono: leadData.telefono,
    origen: leadData.origen,
  });

  // Simular guardado
  return true;
}
