import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray } from "@/lib/supabase";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import {
  camposEditablesIntegracion,
  ocultarSecretos,
} from "@/lib/integraciones";
import { tienePermisoConfig } from "@/modulos/configuracion/config";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!tienePermisoConfig(auth.rol, "gestionarIntegraciones")) {
    return forbidden();
  }

  try {
    const { data, error } = await supabase.from("integraciones").select("*").order("creadoen", { ascending: false });
    if (error) {
      console.error("Fallo la consulta:", error.message);
      return NextResponse.json({ success: false, error: "No se pudieron cargar los datos" }, { status: 500 });
    }
    const integraciones = fromSupabaseArray(data || []).map((integracion) =>
      ocultarSecretos(integracion)
    );
    return NextResponse.json({ success: true, data: integraciones });
  } catch (e) {
    console.error("Error inesperado:", e);
    return NextResponse.json({ success: false, error: "Error al cargar los datos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!tienePermisoConfig(auth.rol, "gestionarIntegraciones")) {
    return forbidden();
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const campos = camposEditablesIntegracion(body);
    if (typeof campos.nombre !== "string" || !campos.nombre.trim()) {
      return NextResponse.json(
        { success: false, error: "Nombre requerido" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("integraciones")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        ...campos,
        nombre: campos.nombre.trim(),
        tipo: campos.tipo || "API",
        estado: campos.estado || "DESCONECTADA",
        creadoEn: new Date().toISOString(),
      }))
      .select().single();
    if (error) return NextResponse.json({ success: false, error: "Error al crear" }, { status: 500 });
    return NextResponse.json(
      { success: true, data: ocultarSecretos(data) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ success: false, error: "Error al crear" }, { status: 500 });
  }
}
