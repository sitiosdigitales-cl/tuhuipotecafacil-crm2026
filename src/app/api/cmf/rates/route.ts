import { NextResponse } from "next/server";

import { obtenerTasaVigente } from "@/lib/cmf/service";

// GET /api/cmf/rates/latest - Obtener tasa vigente
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") || undefined;
  const moneda = searchParams.get("moneda") || undefined;

  try {
    const tasa = await obtenerTasaVigente(tipo || undefined, moneda || undefined);

    if (!tasa) {
      return NextResponse.json(
        { error: "No se encontraron tasas disponibles" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tasa,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener tasa" },
      { status: 500 }
    );
  }
}
