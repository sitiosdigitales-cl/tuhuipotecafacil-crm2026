import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codigo, nombre, email, telefono } = body;

    if (!codigo || !nombre || !email) {
      return NextResponse.json(
        { success: false, error: "Codigo, nombre y email son requeridos" },
        { status: 400 }
      );
    }

    // Buscar el usuario que posee este codigo
    // En produccion, buscar en tabla de codigos de referido
    // Por ahora, crear el lead directamente

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
        notas: `Referido via enlace - Codigo: ${codigo}`,
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

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error al registrar referido:", error);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 }
    );
  }
}