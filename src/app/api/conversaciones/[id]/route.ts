import { NextRequest, NextResponse } from "next/server";
import { supabase, fromSupabaseColumns } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const { id } = await params;
    const { data, error } = await supabase.from("conversaciones").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ success: false, error: "Conversación no encontrada" }, { status: 404 });
    return NextResponse.json({ success: true, data: fromSupabaseColumns(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Error al obtener conversación" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const { id } = await params;
    const body = await request.json();
    const { data, error } = await supabase
      .from("conversaciones")
      .update(body)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const { id } = await params;
    const { error } = await supabase.from("conversaciones").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
