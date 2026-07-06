import { NextResponse } from "next/server";
import { obtenerEstadoCMF } from "@/lib/cmf/service";

// GET /api/cmf/status - Estado del servicio CMF
export async function GET() {
  try {
    const estado = await obtenerEstadoCMF();

    return NextResponse.json({
      success: true,
      data: estado,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener estado" },
      { status: 500 }
    );
  }
}
