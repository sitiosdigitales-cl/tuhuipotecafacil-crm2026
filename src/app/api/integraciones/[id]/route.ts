import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { camposEditablesIntegracion } from "@/lib/integraciones";
import { tienePermisoConfig } from "@/modulos/configuracion/config";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  if (!tienePermisoConfig(auth.rol, "gestionarIntegraciones")) {
    return forbidden();
  }

  const { id } = await params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const campos = camposEditablesIntegracion(body);
    if (Object.keys(campos).length === 0) {
      return NextResponse.json(
        { success: false, error: "No hay cambios válidos" },
        { status: 400 }
      );
    }
    const { error } = await supabase.from("integraciones").update(toSupabaseColumns(campos)).eq("id", id);
    if (error) return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  if (!tienePermisoConfig(auth.rol, "gestionarIntegraciones")) {
    return forbidden();
  }

  const { id } = await params;
  try {
    const { error } = await supabase.from("integraciones").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
