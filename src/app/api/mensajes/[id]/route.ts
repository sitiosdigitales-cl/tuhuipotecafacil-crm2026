import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

// PUT /api/mensajes/[id] — Actualizar mensaje (contenido, reacciones, respondiendoA)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const { id } = await params;
    const body = await request.json();
    const camposPermitidos: Record<string, any> = {};
    if (body.contenido !== undefined) camposPermitidos.contenido = body.contenido;
    if (body.reacciones !== undefined) camposPermitidos.reacciones = body.reacciones;
    if (body.respondiendoA !== undefined) camposPermitidos.respondiendoA = body.respondiendoA;
    camposPermitidos.editadoen = new Date().toISOString();

    const { data, error } = await supabase
      .from("mensajes")
      .update(camposPermitidos)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error al actualizar mensaje" }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar mensaje" }, { status: 500 });
  }
}

// DELETE /api/mensajes/[id] — Eliminar mensaje (soft delete: contenido vacío + tipo SISTEMA)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("mensajes")
      .update({ contenido: "[Mensaje eliminado]", tipo: "SISTEMA", editadoen: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error al eliminar mensaje" }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar mensaje" }, { status: 500 });
  }
}
