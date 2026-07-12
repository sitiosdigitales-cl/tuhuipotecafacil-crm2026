import { NextRequest, NextResponse } from "next/server";
import { requireRole, forbidden } from "@/lib/api-auth";

import { actualizarTasas } from "@/lib/cmf/service";

// POST /api/cmf/update - Forzar actualización de tasas (solo ADMIN+)
export async function POST(request: NextRequest) {
  const user = requireRole(request, ["SUPER_ADMIN", "ADMIN"]);
  if (!user) return forbidden();
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
