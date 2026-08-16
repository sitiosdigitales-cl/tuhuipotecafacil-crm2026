import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import {
  ReferralCodeConfigurationError,
  resolveReferralCode,
} from "@/lib/referral-code";
import { ReferralRegistrationInputSchema } from "@/lib/public-lead-schema";
import { parseBoundedJson, RequestPayloadError } from "@/lib/request-json";

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await parseBoundedJson(request);
  } catch (error) {
    if (error instanceof RequestPayloadError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ success: false, error: "Solicitud inválida" }, { status: 400 });
  }

  const parsedBody = ReferralRegistrationInputSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      { success: false, error: "Datos de formulario inválidos" },
      { status: 400 }
    );
  }

  const { codigo, nombre, email, telefono } = parsedBody.data;

  try {

    const propietario = await resolveReferralCode(codigo);
    if (!propietario) {
      return NextResponse.json(
        { success: false, error: "Código de referido inválido" },
        { status: 400 }
      );
    }

    const leadId = crypto.randomUUID();
    
    const { data, error } = await supabase
      .from("leads")
      .insert(toSupabaseColumns({
        id: leadId,
        nombre: nombre.split(" ")[0] || nombre,
        apellido: nombre.split(" ").slice(1).join(" ") || "",
        email,
        telefono: telefono || null,
        origen: "REFERIDO",
        etapa: "NUEVO_LEAD",
        prioridad: "MEDIA",
        codigoReferido: codigo,
        referidoPor: propietario.id,
        referidoPorNombre: `${propietario.nombre} ${propietario.apellido}`.trim(),
        notas: "Registro recibido mediante el programa de referidos",
        diasEnEtapa: 0,
        situacionLaboral: "DEPENDIENTE",
        enDicom: false,
      }))
      .select()
      .single();

    if (error) {
      console.error("Error al registrar referido:", error);
      return NextResponse.json(
        { success: false, error: "Error al registrar" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { id: data.id } });
  } catch (error) {
    if (error instanceof ReferralCodeConfigurationError) {
      return NextResponse.json(
        { success: false, error: "El programa de referidos no está configurado" },
        { status: 503 }
      );
    }
    console.error("Error al registrar referido:", error);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 }
    );
  }
}
