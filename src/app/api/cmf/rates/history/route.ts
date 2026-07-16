import { NextResponse } from "next/server";

import { obtenerHistorico } from "@/lib/cmf/service";

// GET /api/cmf/rates/history - Obtener histÃ³rico de tasas
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const meses = parseInt(searchParams.get("meses") || "12");

  try {
    const historico = await obtenerHistorico(meses);

    return NextResponse.json({
      success: true,
      data: historico,
      total: historico.length,
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Error al obtener histÃ³rico" },
      { status: 500 }
    );
  }
}
