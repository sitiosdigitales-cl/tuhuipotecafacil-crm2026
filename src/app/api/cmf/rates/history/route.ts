import { NextResponse } from "next/server";

export const dynamic = "force-static";
import { obtenerHistorico } from "@/lib/cmf/service";

// GET /api/cmf/rates/history - Obtener histórico de tasas
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
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener histórico" },
      { status: 500 }
    );
  }
}
