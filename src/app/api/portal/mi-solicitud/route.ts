import { NextRequest, NextResponse } from "next/server";
import { supabase, fromSupabaseColumns } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

// GET /api/portal/mi-solicitud — La solicitud de quien tiene la sesión abierta.
//
// Reemplaza la búsqueda por RUT del portal, que era pública y además hacía
// coincidencia parcial: seis dígitos cualesquiera devolvían la ficha de otra
// persona. El identificador ahora es la sesión, no un dato que el visitante
// escribe.
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("email", auth.email.toLowerCase())
    .order("creadoen", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error al obtener la solicitud del cliente:", error.message);
    return NextResponse.json(
      { success: false, error: "No se pudo cargar tu solicitud" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: "No encontramos una solicitud asociada a tu cuenta" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: fromSupabaseColumns(data) });
}
