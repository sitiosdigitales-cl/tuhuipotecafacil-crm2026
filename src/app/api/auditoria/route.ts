import { NextRequest, NextResponse } from "next/server";
import { supabase, fromSupabaseArray } from "@/lib/supabase";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!["SUPER_ADMIN", "ADMIN"].includes(auth.rol)) return forbidden();

  try {
    const { searchParams } = new URL(request.url);
    const accion = searchParams.get("accion");
    const modulo = searchParams.get("modulo");
    const usuarioId = searchParams.get("usuarioId");

    let query = supabase.from("auditoria").select("*");

    if (accion) query = query.eq("accion", accion);
    if (modulo) query = query.eq("modulo", modulo);
    if (usuarioId) query = query.eq("usuarioid", usuarioId);

    query = query.order("fecha", { ascending: false }).limit(200);

    const { data, error } = await query;
    if (error) {
      console.error("Fallo la consulta:", error.message);
      return NextResponse.json({ success: false, error: "No se pudieron cargar los datos" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: fromSupabaseArray(data || []) });
  } catch (e) {
    console.error("Error inesperado:", e);
    return NextResponse.json({ success: false, error: "Error al cargar los datos" }, { status: 500 });
  }
}
