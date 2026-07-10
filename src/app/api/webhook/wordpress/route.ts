import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";

// Webhook para recibir formularios de WordPress/Elementor
// Configurar en Elementor: Webhook URL → https://tu-dominio.com/api/webhook/wordpress

export async function POST(request: NextRequest) {
  try {
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
      data = await request.json();
    }

    const leadData = {
      nombre: data.nombre || data.first_name || "",
      apellido: data.apellido || data.last_name || "",
      email: data.email || data.correo || "",
      telefono: data.telefono || data.phone || data.tel || "",
      rut: data.rut || data.RUT || "",
      origen: "WEB",
      etapa: "NUEVO_LEAD",
      prioridad: "MEDIA",
      montoSolicitado: data.monto || data.monto_solicitado
        ? parseFloat((data.monto || data.monto_solicitado || "0").replace(/\./g, ""))
        : undefined,
      tipoCredito: data.tipo_credito || data.tipoCredito || undefined,
      banco: data.banco || undefined,
      situacionLaboral: data.situacion_laboral === "independiente" ? "INDEPENDIENTE" : "DEPENDIENTE",
      enDicom: false,
      notas: data.mensaje || data.message || data.consulta || undefined,
    };

    if (!leadData.nombre || !leadData.apellido) {
      return NextResponse.json(
        { success: false, error: "Nombre y apellido son requeridos" },
        { status: 400 }
      );
    }

    // Guardar lead en Supabase
    const { data: leadCreado, error } = await supabase
      .from("leads")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        ...leadData,
        diasEnEtapa: 0,
        creadoEn: new Date().toISOString(),
      }))
      .select()
      .single();

    if (error) {
      console.error("Error guardando lead desde WordPress:", error);
      return NextResponse.json(
        { success: false, error: "Error al guardar lead" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lead recibido y guardado correctamente",
      leadId: leadCreado.id,
    });

  } catch (error) {
    console.error("Error en webhook WordPress:", error);
    return NextResponse.json(
      { success: false, error: "Error procesando webhook" },
      { status: 500 }
    );
  }
}
