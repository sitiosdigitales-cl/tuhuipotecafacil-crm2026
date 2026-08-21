import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("bancos")
      .select("id,nombre,color,tasa_base,cae,updated_at")
      .eq("estado", "ACTIVO")
      .gt("tasa_base", 0)
      .order("nombre", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: "Tasas no disponibles" },
        { status: 503 }
      );
    }

    const tasas = (data ?? []).map((banco) => ({
      actualizadoEn: banco.updated_at,
      cae: Number(banco.cae),
      color: banco.color,
      id: banco.id,
      nombre: banco.nombre,
      tasa: Number(banco.tasa_base),
    }));
    const response = NextResponse.json({ success: true, data: tasas });
    response.headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Tasas no disponibles" },
      { status: 503 }
    );
  }
}
