import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { MARKETING_PERMISOS } from "@/modulos/marketing/config";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!MARKETING_PERMISOS.editar.some((rol) => rol === auth.rol)) return forbidden();
  const { id } = await params;
  try {
    const body = await request.json();
    const { error } = await supabase.from("biblioteca").update(toSupabaseColumns(body)).eq("id", id);
    if (error) return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!MARKETING_PERMISOS.eliminar.some((rol) => rol === auth.rol)) return forbidden();
  const { id } = await params;
  try {
    const { error } = await supabase.from("biblioteca").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
