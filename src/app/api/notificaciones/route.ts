import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuarioId");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("notificaciones")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(limit);

    if (usuarioId) {
      query = query.eq("usuarioid", usuarioId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ success: true, data: [] });

    const notificaciones = (data || []).map((n: any) => ({
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      descripcion: n.descripcion,
      leida: n.leida,
      fecha: n.fecha,
      usuarioId: n.usuarioid,
    }));

    return NextResponse.json({ success: true, data: notificaciones });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo, titulo, descripcion, usuarioId } = body;

    if (!tipo || !titulo) {
      return NextResponse.json({ success: false, error: "tipo y titulo requeridos" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("notificaciones")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        tipo,
        titulo,
        descripcion: descripcion || "",
        leida: false,
        fecha: new Date().toISOString(),
        usuarioId: usuarioId || null,
      }))
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error al crear notificación" }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al crear notificación" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, leida } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "id requerido" }, { status: 400 });
    }

    const { error } = await supabase
      .from("notificaciones")
      .update(toSupabaseColumns({ leida: leida ?? true }))
      .eq("id", id);

    if (error) return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}
