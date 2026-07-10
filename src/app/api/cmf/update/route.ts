import { NextResponse } from "next/server";

export const dynamic = "force-static";
import { actualizarTasas } from "@/lib/cmf/service";

// POST /api/cmf/update - Forzar actualización de tasas
export async function POST() {
  try {
    const resultado = await actualizarTasas();

    return NextResponse.json({
      success: resultado.exito,
      data: {
        registros: resultado.registros,
        mensaje: resultado.mensaje,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar tasas" },
      { status: 500 }
    );
  }
}
